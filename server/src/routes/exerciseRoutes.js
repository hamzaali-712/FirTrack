import { Router } from "express";
import mongoose from "mongoose";
import { createAuthMiddleware } from "../auth/middleware.js";
import { ApiError } from "../errors/ApiError.js";
import {
  Exercise,
  EXERCISE_DIFFICULTIES,
  EXERCISE_GOALS,
  EXERCISE_GROUPS,
  EXERCISE_EQUIPMENT,
} from "../models/Exercise.js";

const allowedQueryKeys = new Set([
  "q",
  "muscleGroup",
  "equipment",
  "difficulty",
  "goal",
  "page",
  "limit",
  "sort",
]);
const sortOptions = new Set(["name_asc", "name_desc", "relevance"]);

function invalidQuery(message) {
  throw new ApiError(400, "INVALID_QUERY", message);
}

function getSingleQueryValue(query, key) {
  const value = query[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") invalidQuery(`Query parameter "${key}" must appear once.`);
  return value;
}

function parseIntegerQuery(query, key, fallback, minimum, maximum) {
  const raw = getSingleQueryValue(query, key);
  if (raw === undefined) return fallback;
  if (!/^[0-9]+$/.test(raw)) invalidQuery(`Query parameter "${key}" must be an integer.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    invalidQuery(`Query parameter "${key}" must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function parseExerciseQuery(query) {
  const unexpected = Object.keys(query).filter((key) => !allowedQueryKeys.has(key));
  if (unexpected.length) invalidQuery("One or more query parameters are not supported.");

  const filters = {};
  const q = getSingleQueryValue(query, "q");
  if (q !== undefined) {
    const trimmed = q.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      invalidQuery("Search text must be between 1 and 100 characters.");
    }
    filters.q = trimmed;
  }
  const muscleGroup = getSingleQueryValue(query, "muscleGroup");
  if (muscleGroup !== undefined) {
    if (!EXERCISE_GROUPS.includes(muscleGroup)) invalidQuery("The muscle group is not supported.");
    filters.muscleGroup = muscleGroup;
  }
  const equipment = getSingleQueryValue(query, "equipment");
  if (equipment !== undefined) {
    if (!EXERCISE_EQUIPMENT.includes(equipment)) invalidQuery("The equipment filter is not supported.");
    filters.equipment = equipment;
  }
  const difficulty = getSingleQueryValue(query, "difficulty");
  if (difficulty !== undefined) {
    if (!EXERCISE_DIFFICULTIES.includes(difficulty)) invalidQuery("The difficulty filter is not supported.");
    filters.difficulty = difficulty;
  }
  const goal = getSingleQueryValue(query, "goal");
  if (goal !== undefined) {
    if (!EXERCISE_GOALS.includes(goal)) invalidQuery("The goal filter is not supported.");
    filters.goal = goal;
  }
  const page = parseIntegerQuery(query, "page", 1, 1, 10000);
  const limit = parseIntegerQuery(query, "limit", 20, 1, 50);
  const sort = getSingleQueryValue(query, "sort") ?? "name_asc";
  if (!sortOptions.has(sort)) invalidQuery("The sort option is not supported.");
  if (sort === "relevance" && !filters.q && !filters.goal) {
    invalidQuery("Relevance sorting requires a search query or goal.");
  }

  return { filters, page, limit, sort };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isApprovedAssetPath(value) {
  return (
    typeof value === "string" &&
    /^\/assets\/exercises\/[A-Za-z0-9._/-]+$/.test(value) &&
    !value.includes("..")
  );
}

function approvedAnimation(exercise) {
  if (
    exercise.animationStatus !== "verified" ||
    !exercise.animation ||
    !isApprovedAssetPath(exercise.animation.assetUrl) ||
    (exercise.animation.posterUrl && !isApprovedAssetPath(exercise.animation.posterUrl))
  ) {
    return null;
  }
  return exercise.animation;
}

function toExerciseSummary(exercise) {
  const animation = approvedAnimation(exercise);
  return {
    id: exercise._id.toString(),
    name: exercise.name,
    primaryMuscleGroup: exercise.primaryMuscleGroup,
    secondaryMuscleGroups: exercise.secondaryMuscleGroups,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    trackingType: exercise.trackingType,
    goalTags: exercise.goalTags,
    imageUrl: exercise.imageUrl ?? null,
    animationAvailable: animation !== null,
  };
}

function toExerciseDetail(exercise) {
  return {
    ...toExerciseSummary(exercise),
    instructions: exercise.instructions,
    safetyNotes: exercise.safetyNotes,
    animation: approvedAnimation(exercise),
  };
}

function buildFilter(filters) {
  const mongoFilter = { isActive: true };
  if (filters.muscleGroup) mongoFilter.primaryMuscleGroup = filters.muscleGroup;
  if (filters.equipment) mongoFilter.equipment = filters.equipment;
  if (filters.difficulty) mongoFilter.difficulty = filters.difficulty;
  if (filters.q) {
    mongoFilter.name = { $regex: escapeRegex(filters.q), $options: "i" };
  }
  return mongoFilter;
}

function sortFor(sort) {
  if (sort === "name_desc") return { name: -1, _id: 1 };
  return { name: 1, _id: 1 };
}

async function findRelevantPage({ filter, filters, page, limit }) {
  const scoreTerms = [];
  if (filters.goal) {
    scoreTerms.push({
      $cond: [{ $in: [filters.goal, "$goalTags"] }, 1, 0],
    });
  }
  if (filters.q) {
    scoreTerms.push({
      $cond: [
        {
          $regexMatch: {
            input: "$name",
            regex: `^${escapeRegex(filters.q)}`,
            options: "i",
          },
        },
        1,
        0,
      ],
    });
  }
  const offset = (page - 1) * limit;
  return Exercise.aggregate([
    { $match: filter },
    { $addFields: { _relevance: { $add: scoreTerms } } },
    { $sort: { _relevance: -1, name: 1, _id: 1 } },
    { $skip: offset },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        primaryMuscleGroup: 1,
        secondaryMuscleGroups: 1,
        equipment: 1,
        difficulty: 1,
        trackingType: 1,
        goalTags: 1,
        imageUrl: 1,
        animation: 1,
        animationStatus: 1,
      },
    },
  ]);
}

export function createExerciseRouter(config) {
  const router = Router();
  const { requireSession } = createAuthMiddleware(config);

  router.get("/", requireSession, async (req, res) => {
    const { filters, page, limit, sort } = parseExerciseQuery(req.query);
    const filter = buildFilter(filters);
    const offset = (page - 1) * limit;
    const [total, exercises] = await Promise.all([
      Exercise.countDocuments(filter),
      sort === "relevance"
        ? findRelevantPage({ filter, filters, page, limit })
        : Exercise.find(filter)
            .select("+animationStatus")
            .sort(sortFor(sort))
            .skip(offset)
            .limit(limit)
            .lean(),
    ]);

    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: exercises.map(toExerciseSummary),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        hasNextPage: offset + exercises.length < total,
      },
    });
  });

  router.get("/:exerciseId", requireSession, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.exerciseId) || !mongoose.isValidObjectId(req.params.exerciseId)) {
      throw new ApiError(400, "INVALID_ID", "The exercise ID is invalid.");
    }
    const exercise = await Exercise.findOne({
      _id: req.params.exerciseId,
      isActive: true,
    })
      .select("+animationStatus")
      .lean();
    if (!exercise) throw new ApiError(404, "RESOURCE_NOT_FOUND", "The requested resource was not found.");

    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: toExerciseDetail(exercise) });
  });

  return router;
}
