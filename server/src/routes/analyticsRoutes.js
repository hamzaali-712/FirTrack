import { Router } from "express";
import { createAuthMiddleware } from "../auth/middleware.js";
import { ApiError } from "../errors/ApiError.js";
import { WorkoutSession } from "../models/WorkoutSession.js";
import {
  addCalendarDays,
  localMidnightUtc,
  mondayStartParts,
  validateTimezone,
} from "../analytics/timezone.js";
import {
  completedDurationMinutes,
  completedSetCount,
  externalLoadVolume,
} from "../analytics/metrics.js";

function parseOptionalWeeks(value) {
  if (value === undefined) return 8;
  if (!/^[0-9]+$/.test(value)) return null;
  const weeks = Number(value);
  if (!Number.isSafeInteger(weeks) || weeks < 1 || weeks > 26) return null;
  return weeks;
}

export function createAnalyticsRouter(config) {
  const router = Router();
  const { requireSession } = createAuthMiddleware(config);

  router.get("/dashboard/summary", requireSession, async (req, res) => {
    const timezone = validateTimezone(req.query.tz);
    if (!timezone) {
      throw new ApiError(400, "INVALID_TIMEZONE", "The requested IANA timezone is not supported.");
    }
    if (Object.keys(req.query).some((key) => key !== "tz")) {
      throw new ApiError(400, "INVALID_QUERY", "Only the tz query parameter is supported.");
    }
    const now = new Date();
    const monday = mondayStartParts(now, timezone);
    const weekStart = localMidnightUtc(monday, timezone);
    const weekEnd = localMidnightUtc(addCalendarDays(monday, 7), timezone);

    const sessions = await WorkoutSession.find({
      userId: req.authUserId,
      status: "completed",
      completedAt: { $gte: weekStart, $lt: weekEnd },
    }).sort({ completedAt: -1, _id: -1 }).lean();
    const active = await WorkoutSession.findOne({
      userId: req.authUserId,
      status: "in_progress",
    }).select("_id").lean();
    const recent = await WorkoutSession.find({
      userId: req.authUserId,
      status: "completed",
    }).sort({ completedAt: -1, _id: -1 }).limit(5).lean();

    let completedSets = 0;
    let durationMinutes = 0;
    for (const session of sessions) {
      completedSets += completedSetCount(session);
      const duration = completedDurationMinutes(session);
      if (duration !== null) durationMinutes += duration;
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: {
        timezone,
        weekStart: weekStart.toISOString(),
        weekEndExclusive: weekEnd.toISOString(),
        completedWorkoutsThisWeek: sessions.length,
        completedSetsThisWeek: completedSets,
        totalDurationMinutesThisWeek: durationMinutes,
        activeSessionId: active?._id.toString() ?? null,
        recentWorkouts: recent.map((session) => ({
          id: session._id.toString(),
          dayLabelSnapshot: session.dayLabelSnapshot,
          completedAt: session.completedAt.toISOString(),
        })),
      },
    });
  });

  router.get("/progress/summary", requireSession, async (req, res) => {
    const timezone = validateTimezone(req.query.tz);
    const weeks = parseOptionalWeeks(req.query.weeks);
    if (!timezone) {
      throw new ApiError(400, "INVALID_TIMEZONE", "The requested IANA timezone is not supported.");
    }
    if (weeks === null) {
      throw new ApiError(400, "INVALID_QUERY", "Weeks must be an integer from 1 to 26.");
    }
    if (Object.keys(req.query).some((key) => !["tz", "weeks"].includes(key))) {
      throw new ApiError(400, "INVALID_QUERY", "Only tz and weeks query parameters are supported.");
    }

    const now = new Date();
    const currentMonday = mondayStartParts(now, timezone);
    const firstMonday = addCalendarDays(currentMonday, -7 * (weeks - 1));
    const windowStart = localMidnightUtc(firstMonday, timezone);
    const windowEnd = localMidnightUtc(addCalendarDays(currentMonday, 7), timezone);
    const sessions = await WorkoutSession.find({
      userId: req.authUserId,
      status: "completed",
      completedAt: { $gte: windowStart, $lt: windowEnd },
    }).select("status completedAt startedAt exercises").lean();

    const series = [];
    let totalCompletedWorkouts = 0;
    let totalCompletedSets = 0;
    let totalVolumeKg = 0;

    for (let index = 0; index < weeks; index += 1) {
      const weekMonday = addCalendarDays(firstMonday, 7 * index);
      const bucketStart = localMidnightUtc(weekMonday, timezone);
      const bucketEnd = localMidnightUtc(addCalendarDays(weekMonday, 7), timezone);
      const bucketSessions = sessions.filter((session) => {
        const completedAt = session.completedAt;
        return completedAt >= bucketStart && completedAt < bucketEnd;
      });
      const completedWorkouts = bucketSessions.length;
      totalCompletedWorkouts += completedWorkouts;
      const dateLabel = `${weekMonday.year}-${String(weekMonday.month).padStart(2, "0")}-${String(weekMonday.day).padStart(2, "0")}`;
      const completedSets = bucketSessions.reduce(
        (total, session) => total + completedSetCount(session),
        0,
      );
      const volume = bucketSessions.reduce(
        (total, session) => total + externalLoadVolume(session),
        0,
      );
      totalCompletedSets += completedSets;
      totalVolumeKg += volume;
      series.push({
        weekStartLocal: dateLabel,
        completedWorkouts,
      });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({
      data: {
        timezone,
        weeks,
        totalCompletedWorkouts,
        totalCompletedSets,
        totalVolumeKg,
        workoutsByWeek: series,
      },
    });
  });

  return router;
}
