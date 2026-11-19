import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarDays,
  localMidnightUtc,
  mondayStartParts,
  validateTimezone,
  zonedParts,
} from "../server/src/analytics/timezone.js";
import {
  completedSetCount,
  completedDurationMinutes,
  externalLoadVolume,
} from "../server/src/analytics/metrics.js";

test("canonical benchmark reconciles to 1330 kg-reps", () => {
  const session = {
    status: "completed",
    exercises: [{
      trackingType: "reps_weight",
      sets: [
        { completed: true, reps: 12, weightKg: 40, durationSec: null },
        { completed: true, reps: 10, weightKg: 45, durationSec: null },
        { completed: true, reps: 8, weightKg: 50, durationSec: null },
      ],
    }],
  };
  assert.equal(completedSetCount(session), 3);
  assert.equal(externalLoadVolume(session), 1330);
});

test("abandoned and timed-only sessions contribute no resistance volume", () => {
  assert.equal(externalLoadVolume({
    status: "abandoned",
    exercises: [{ trackingType: "reps_weight", sets: [{ completed: true, reps: 12, weightKg: 40 }] }],
  }), 0);
  assert.equal(completedSetCount({
    status: "completed",
    exercises: [{ trackingType: "duration", sets: [{ completed: true, reps: null, weightKg: null, durationSec: 60 }] }],
  }), 1);
  assert.equal(externalLoadVolume({
    status: "completed",
    exercises: [{ trackingType: "duration", sets: [{ completed: true, reps: null, weightKg: null, durationSec: 60 }] }],
  }), 0);
});

test("null duration or a clock inconsistency is handled without fake data", () => {
  assert.equal(completedDurationMinutes({
    status: "completed",
    startedAt: new Date("2026-11-18T11:00:00Z"),
    completedAt: new Date("2026-11-18T10:00:00Z"),
  }), null);
  assert.equal(completedDurationMinutes({
    status: "completed",
    startedAt: null,
    completedAt: new Date("2026-11-18T10:00:00Z"),
  }), 0);
});

test("IANA timezone validation and Monday week boundaries are deterministic", () => {
  assert.equal(validateTimezone("Asia/Karachi"), "Asia/Karachi");
  assert.equal(validateTimezone("Not/AZone"), null);
  assert.equal(validateTimezone(undefined), "UTC");

  const sunday = new Date("2026-11-22T12:00:00Z");
  const utcMonday = mondayStartParts(sunday, "UTC");
  assert.deepEqual(utcMonday, { year: 2026, month: 11, day: 16 });
  const nextMonday = addCalendarDays(utcMonday, 7);
  assert.deepEqual(nextMonday, { year: 2026, month: 11, day: 23 });
  assert.equal(localMidnightUtc(utcMonday, "UTC").toISOString(), "2026-11-16T00:00:00.000Z");

  const karachiMonday = mondayStartParts(sunday, "Asia/Karachi");
  assert.deepEqual(zonedParts(localMidnightUtc(karachiMonday, "Asia/Karachi"), "Asia/Karachi"), {
    year: karachiMonday.year,
    month: karachiMonday.month,
    day: karachiMonday.day,
    hour: 0,
    minute: 0,
    second: 0,
  });
});
