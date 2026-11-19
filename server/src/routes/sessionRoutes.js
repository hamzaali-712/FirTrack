import { createHash } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { createAuthMiddleware } from "../auth/middleware.js";
import { ApiError } from "../errors/ApiError.js";
import { Exercise } from "../models/Exercise.js";
import { IdempotencyRecord } from "../models/IdempotencyRecord.js";
import { WorkoutPlan } from "../models/WorkoutPlan.js";
import { WorkoutSession } from "../models/WorkoutSession.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidId() {
  throw new ApiError(404, "RESOURCE_NOT_FOUND", "The requested session was not found.");
}

function validation(message, fieldErrors) {
  throw new ApiError(422, "VALIDATION_ERROR", message, { fieldErrors });
}

function integerValue(value, field, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new ApiError(422, "VALIDATION_ERROR", "One or more set fields are invalid.", {
      fieldErrors: [{ field, message: `Must be an integer from ${minimum} to ${maximum}.` }],
    });
  }
  return value;
}

function durationMinutes(session) {
  if (!session.completedAt || !session.startedAt) return null;
  return Math.max(0, Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 60000));
}

function toFullSession(session) {
  return {
    id: session._id.toString(),
    status: session.status,
    sourcePlanId: session.sourcePlanId.toString(),
    sourceDayId: session.sourceDayId.toString(),
    planNameSnapshot: session.planNameSnapshot,
    dayLabelSnapshot: session.dayLabelSnapshot,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    abandonedAt: session.abandonedAt?.toISOString() ?? null,
    ...(session.status === "completed" ? { durationMinutes: durationMinutes(session) } : {}),
    version: session.version,
    exercises: session.exercises
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        id: exercise._id.toString(),
        exerciseId: exercise.exerciseId.toString(),
        nameSnapshot: exercise.nameSnapshot,
        trackingType: exercise.trackingType,
        position: exercise.position,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        targetDurationSec: exercise.targetDurationSec,
        targetWeightKg: exercise.targetWeightKg,
        sets: exercise.sets
          .sort((a, b) => a.position - b.position)
          .map((set) => ({
            id: set._id.toString(),
            position: set.position,
            reps: set.reps,
            weightKg: set.weightKg,
            durationSec: set.durationSec,
            completed: set.completed,
          })),
      })),
  };
}

function terminalSummary(session) {
  return {
    id: session._id.toString(),
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    ...(session.status === "completed"
      ? {
          completedAt: session.completedAt.toISOString(),
          durationMinutes: durationMinutes(session),
        }
      : {
          abandonedAt: session.abandonedAt.toISOString(),
        }),
    version: session.version,
  };
}

function validateSetPayload(exercise, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(422, "VALIDATION_ERROR", "The performed set is invalid.", {
      fieldErrors: [{ field: "body", message: "Must be an object." }],
    });
  }
  if (typeof body.completed !== "boolean") {
    throw new ApiError(422, "VALIDATION_ERROR", "The performed set is invalid.", {
      fieldErrors: [{ field: "completed", message: "Must be a boolean." }],
    });
  }
  if (!Number.isInteger(body.version) || body.version < 1) {
    throw new ApiError(422, "VALIDATION_ERROR", "The session version is invalid.", {
      fieldErrors: [{ field: "version", message: "Must be a positive integer." }],
    });
  }

  const allowed = new Set(["version", "reps", "weightKg", "durationSec", "completed"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    throw new ApiError(422, "VALIDATION_ERROR", "The performed set is invalid.", {
      fieldErrors: [{ field: "body", message: "Contains unsupported fields." }],
    });
  }

  let reps = body.reps ?? null;
  let weightKg = body.weightKg ?? null;
  let durationSec = body.durationSec ?? null;

  if (exercise.trackingType === "reps_weight" || exercise.trackingType === "reps_only") {
    if (reps !== null) integerValue(reps, "reps", body.completed ? 1 : 0, 100);
    if (exercise.trackingType === "reps_only") {
      if (weightKg !== null) {
        throw new ApiError(422, "VALIDATION_ERROR", "Reps-only sets cannot contain weight.", {
          fieldErrors: [{ field: "weightKg", message: "Must be null." }],
        });
      }
      weightKg = null;
    } else if (weightKg !== null) {
      if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) {
        throw new ApiError(422, "VALIDATION_ERROR", "The resistance set weight is invalid.", {
          fieldErrors: [{ field: "weightKg", message: "Must be from 0 to 500 kg." }],
        });
      }
    }
    durationSec = null;
  } else {
    if (durationSec !== null) integerValue(durationSec, "durationSec", body.completed ? 1 : 0, 7200);
    reps = null;
    weightKg = null;
  }

  if (body.completed && reps === null && exercise.trackingType !== "duration") {
    throw new ApiError(422, "VALIDATION_ERROR", "Completed rep sets require reps.", {
      fieldErrors: [{ field: "reps", message: "Required for a completed rep set." }],
    });
  }
  if (body.completed && exercise.trackingType === "reps_weight" && weightKg === null) {
    throw new ApiError(422, "VALIDATION_ERROR", "Completed resistance sets require weight.", {
      fieldErrors: [{ field: "weightKg", message: "Required for a completed resistance set." }],
    });
  }
  if (body.completed && exercise.trackingType === "duration" && durationSec === null) {
    throw new ApiError(422, "VALIDATION_ERROR", "Completed timed sets require duration.", {
      fieldErrors: [{ field: "durationSec", message: "Required for a completed timed set." }],
    });
  }

  return { version: body.version, reps, weightKg, durationSec, completed: body.completed };
}

export function createSessionRouter(config) {
  const router = Router();
  const { requireCsrf, requireSession } = createAuthMiddleware(config);

  router.post("/", requireSession, requireCsrf, async (req, res) => {
    const key = req.get("idempotency-key");
    if (typeof key !== "string" || !UUID_PATTERN.test(key)) {
      throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "A valid UUID Idempotency-Key is required.");
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw new ApiError(422, "VALIDATION_ERROR", "The session start payload is invalid.");
    }
    if (Object.keys(req.body).some((keyName) => !["planId", "dayId"].includes(keyName))) {
      throw new ApiError(422, "VALIDATION_ERROR", "The session start payload contains unsupported fields.");
    }
    if (!/^[a-f\d]{24}$/i.test(req.body.planId) || !/^[a-f\d]{24}$/i.test(req.body.dayId)) {
      throw new ApiError(404, "RESOURCE_NOT_FOUND", "The requested plan or day was not found.");
    }
    const canonical = JSON.stringify({
      planId: req.body.planId,
      dayId: req.body.dayId,
    });
    const payloadHash = createHash("sha256").update(canonical).digest("hex");

    const session = await mongoose.startSession();
    try {
      let replay;
      await session.withTransaction(async () => {
        const existingKey = await IdempotencyRecord.findOne({
          userId: req.authUserId,
          method: "POST",
          routeKey: "sessions",
          key,
        }).session(session);
        if (existingKey) {
          if (existingKey.payloadHash !== payloadHash) {
            throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "This idempotency key is already used for a different request.");
          }
          replay = existingKey;
          return;
        }

        const activeSession = await WorkoutSession.findOne({
          userId: req.authUserId,
          status: "in_progress",
        }).session(session).lean();
        if (activeSession) {
          throw new ApiError(409, "ACTIVE_SESSION_EXISTS", "A workout is already active.", {
            fieldErrors: [{ field: "activeSessionId", message: activeSession._id.toString() }],
          });
        }

        const plan = await WorkoutPlan.findOne({
          _id: req.body.planId,
          userId: req.authUserId,
          archivedAt: null,
        }).session(session);
        if (!plan) {
          const archived = await WorkoutPlan.findOne({
            _id: req.body.planId,
            userId: req.authUserId,
          }).session(session);
          if (archived?.archivedAt) {
            throw new ApiError(409, "PLAN_ARCHIVED", "The source plan is archived.");
          }
          throw new ApiError(404, "RESOURCE_NOT_FOUND", "The requested plan or day was not found.");
        }
        const day = plan.days.find((candidate) => candidate._id.toString() === req.body.dayId);
        if (!day) throw new ApiError(404, "RESOURCE_NOT_FOUND", "The requested plan or day was not found.");
        if (day.exercises.length < 1) {
          throw new ApiError(422, "VALIDATION_ERROR", "The plan day must contain at least one exercise.", {
            fieldErrors: [{ field: "dayId", message: "At least one exercise is required." }],
          });
        }

        const exerciseIds = day.exercises.map((entry) => entry.exerciseId);
        const catalogExercises = await Exercise.find({
          _id: { $in: exerciseIds },
          isActive: true,
        }).session(session).lean();
        const catalogById = new Map(catalogExercises.map((exercise) => [exercise._id.toString(), exercise]));
        if (catalogById.size !== day.exercises.length) {
          throw new ApiError(422, "VALIDATION_ERROR", "One or more plan exercises are unavailable.");
        }

        const snapshotExercises = day.exercises
          .sort((a, b) => a.position - b.position)
          .map((entry) => {
            const catalogExercise = catalogById.get(entry.exerciseId.toString());
            return {
              exerciseId: entry.exerciseId,
              nameSnapshot: catalogExercise.name,
              trackingType: catalogExercise.trackingType,
              position: entry.position,
              targetSets: entry.targetSets,
              targetReps: entry.targetReps,
              targetDurationSec: entry.targetDurationSec,
              targetWeightKg: entry.targetWeightKg,
              sets: Array.from({ length: entry.targetSets }, (_, index) => ({
                position: index,
                reps: null,
                weightKg: null,
                durationSec: null,
                completed: false,
              })),
            };
          });

        let created;
        try {
          created = await WorkoutSession.create([{
            userId: req.authUserId,
            sourcePlanId: plan._id,
            sourceDayId: day._id,
            planNameSnapshot: plan.name,
            dayLabelSnapshot: day.label,
            status: "in_progress",
            startedAt: new Date(),
            completedAt: null,
            abandonedAt: null,
            version: 1,
            exercises: snapshotExercises,
          }], { session }).then((documents) => documents[0]);
        } catch (error) {
          if (error?.code === 11000) {
            const active = await WorkoutSession.findOne({
              userId: req.authUserId,
              status: "in_progress",
            }).session(session).lean();
            throw new ApiError(409, "ACTIVE_SESSION_EXISTS", "A workout is already active.", {
              fieldErrors: active ? [{ field: "activeSessionId", message: active._id.toString() }] : [],
            });
          }
          throw error;
        }

        const responseBody = { data: toFullSession(created) };
        await IdempotencyRecord.create([{
          userId: req.authUserId,
          method: "POST",
          routeKey: "sessions",
          key,
          payloadHash,
          statusCode: 201,
          responseBody,
          resourceId: created._id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }], { session });
        replay = { statusCode: 201, responseBody };
        res.setHeader("Location", `/api/v1/sessions/${created._id.toString()}`);
      });
      res.setHeader("Cache-Control", "private, no-store");
      res.status(replay.statusCode).json(replay.responseBody);
    } finally {
      await session.endSession();
    }
  });

  router.get("/active", requireSession, async (req, res) => {
    const active = await WorkoutSession.findOne({
      userId: req.authUserId,
      status: "in_progress",
    }).lean();
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: active ? toFullSession(active) : null });
  });

  router.get("/", requireSession, async (req, res) => {
    const status = req.query.status ?? "completed";
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const sort = req.query.sort ?? "completed_desc";
    if (!["completed", "abandoned", "in_progress", "all"].includes(status) ||
        !["completed_desc", "started_desc", "started_asc"].includes(sort) ||
        !Number.isSafeInteger(page) || page < 1 || page > 10000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 50 ||
        Object.keys(req.query).some((key) => !["status", "page", "limit", "sort"].includes(key))) {
      throw new ApiError(400, "INVALID_QUERY", "One or more session query parameters are invalid.");
    }
    const filter = { userId: req.authUserId };
    if (status !== "all") filter.status = status;
    const sortObject =
      sort === "started_asc" ? { startedAt: 1, _id: 1 } :
      sort === "started_desc" ? { startedAt: -1, _id: -1 } :
      { completedAt: -1, _id: -1 };
    const [total, sessions] = await Promise.all([
      WorkoutSession.countDocuments(filter),
      WorkoutSession.find(filter).sort(sortObject).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: sessions.map((session) => ({
        id: session._id.toString(),
        status: session.status,
        planNameSnapshot: session.planNameSnapshot,
        dayLabelSnapshot: session.dayLabelSnapshot,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
        abandonedAt: session.abandonedAt?.toISOString() ?? null,
        ...(session.status === "completed" ? { durationMinutes: durationMinutes(session) } : {}),
        ...(session.status === "completed"
          ? { completedSetCount: session.exercises.reduce((count, exercise) =>
              count + exercise.sets.filter((set) => set.completed).length, 0) }
          : {}),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        hasNextPage: (page - 1) * limit + sessions.length < total,
      },
    });
  });

  router.get("/:sessionId", requireSession, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.sessionId)) invalidId();
    const session = await WorkoutSession.findOne({
      _id: req.params.sessionId,
      userId: req.authUserId,
    }).lean();
    if (!session) invalidId();
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: toFullSession(session) });
  });

  router.patch("/:sessionId/sets/:setId", requireSession, requireCsrf, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.sessionId) || !/^[a-f\d]{24}$/i.test(req.params.setId)) invalidId();
    const session = await WorkoutSession.findOne({
      _id: req.params.sessionId,
      userId: req.authUserId,
    });
    if (!session) invalidId();
    if (session.status !== "in_progress") {
      throw new ApiError(409, "INVALID_SESSION_STATE", "The session is no longer in progress.");
    }
    let exercise;
    let set;
    for (const candidateExercise of session.exercises) {
      const candidateSet = candidateExercise.sets.find((candidate) => candidate._id.toString() === req.params.setId);
      if (candidateSet) {
        exercise = candidateExercise;
        set = candidateSet;
        break;
      }
    }
    if (!exercise || !set) invalidId();
    const performed = validateSetPayload(exercise, req.body);
    if (performed.version !== session.version) {
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.", {
        fieldErrors: [{ field: "version", message: `Current version is ${session.version}.` }],
      });
    }

    const updated = await WorkoutSession.findOneAndUpdate(
      {
        _id: session._id,
        userId: req.authUserId,
        status: "in_progress",
        version: performed.version,
        "exercises.sets._id": set._id,
      },
      {
        $set: {
          "exercises.$[exercise].sets.$[set].reps": performed.reps,
          "exercises.$[exercise].sets.$[set].weightKg": performed.weightKg,
          "exercises.$[exercise].sets.$[set].durationSec": performed.durationSec,
          "exercises.$[exercise].sets.$[set].completed": performed.completed,
        },
        $inc: { version: 1 },
      },
      {
        returnDocument: "after",
        arrayFilters: [
          { "exercise.sets._id": set._id },
          { "set._id": set._id },
        ],
      },
    );
    if (!updated) {
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.", {
        fieldErrors: [{ field: "version", message: "Refetch the current session." }],
      });
    }
    const savedSet = updated.exercises
      .flatMap((candidate) => candidate.sets)
      .find((candidate) => candidate._id.toString() === req.params.setId);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: {
        sessionId: updated._id.toString(),
        version: updated.version,
        set: {
          id: savedSet._id.toString(),
          position: savedSet.position,
          reps: savedSet.reps,
          weightKg: savedSet.weightKg,
          durationSec: savedSet.durationSec,
          completed: savedSet.completed,
        },
        savedAt: updated.updatedAt.toISOString(),
      },
    });
  });

  router.post("/:sessionId/complete", requireSession, requireCsrf, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.sessionId)) invalidId();
    const session = await WorkoutSession.findOne({
      _id: req.params.sessionId,
      userId: req.authUserId,
    });
    if (!session) invalidId();
    if (session.status === "completed") {
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).json({ data: terminalSummary(session) });
    }
    if (session.status === "abandoned") {
      throw new ApiError(409, "INVALID_SESSION_STATE", "An abandoned session cannot be completed.");
    }
    if (!req.body || !Number.isInteger(req.body.version)) {
      throw new ApiError(422, "VALIDATION_ERROR", "The session version is required.");
    }
    if (req.body.version !== session.version) {
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.");
    }
    const completedSetCount = session.exercises.reduce(
      (count, exercise) => count + exercise.sets.filter((set) => set.completed).length,
      0,
    );
    if (completedSetCount < 1) {
      throw new ApiError(422, "NO_COMPLETED_SETS", "Complete at least one valid set before finishing.");
    }
    const completedAt = new Date();
    const updated = await WorkoutSession.findOneAndUpdate(
      {
        _id: session._id,
        userId: req.authUserId,
        status: "in_progress",
        version: req.body.version,
      },
      { $set: { status: "completed", completedAt }, $inc: { version: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) {
      const current = await WorkoutSession.findById(session._id);
      if (current?.status === "completed") {
        return res.status(200).json({ data: terminalSummary(current) });
      }
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.");
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: terminalSummary(updated) });
  });

  router.post("/:sessionId/abandon", requireSession, requireCsrf, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.sessionId)) invalidId();
    const session = await WorkoutSession.findOne({
      _id: req.params.sessionId,
      userId: req.authUserId,
    });
    if (!session) invalidId();
    if (session.status === "abandoned") {
      return res.status(200).json({ data: terminalSummary(session) });
    }
    if (session.status === "completed") {
      throw new ApiError(409, "INVALID_SESSION_STATE", "A completed session cannot be abandoned.");
    }
    if (!req.body || !Number.isInteger(req.body.version)) {
      throw new ApiError(422, "VALIDATION_ERROR", "The session version is required.");
    }
    if (req.body.version !== session.version) {
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.");
    }
    const abandonedAt = new Date();
    const updated = await WorkoutSession.findOneAndUpdate(
      {
        _id: session._id,
        userId: req.authUserId,
        status: "in_progress",
        version: req.body.version,
      },
      { $set: { status: "abandoned", abandonedAt }, $inc: { version: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) {
      const current = await WorkoutSession.findById(session._id);
      if (current?.status === "abandoned") {
        return res.status(200).json({ data: terminalSummary(current) });
      }
      throw new ApiError(409, "VERSION_CONFLICT", "The session has changed.");
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ data: terminalSummary(updated) });
  });

  return router;
}
