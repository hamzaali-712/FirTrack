const supportedTimezoneCache = new Map();

export function validateTimezone(value) {
  const timezone = value === undefined || value === "" ? "UTC" : value;
  if (typeof timezone !== "string" || timezone.length > 100) return null;
  if (supportedTimezoneCache.has(timezone)) return timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    supportedTimezoneCache.set(timezone, timezone);
    return timezone;
  } catch {
    return null;
  }
}

export function zonedParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function addCalendarDays(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function localMidnightUtc({ year, month, day }, timezone) {
  const desired = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = desired;
  for (let index = 0; index < 4; index += 1) {
    const actual = zonedParts(new Date(candidate), timezone);
    const actualWall = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const difference = desired - actualWall;
    candidate += difference;
    if (difference === 0) break;
  }
  return new Date(candidate);
}

export function mondayStartParts(now, timezone) {
  const parts = zonedParts(now, timezone);
  const wallDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayIndex = wallDate.getUTCDay();
  const daysSinceMonday = (dayIndex + 6) % 7;
  return addCalendarDays(parts, -daysSinceMonday);
}
