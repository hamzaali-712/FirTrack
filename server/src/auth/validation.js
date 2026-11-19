import { ApiError } from "../errors/ApiError.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedGoals = new Set([
  "muscle_gain",
  "strength",
  "fat_loss",
  "endurance",
  "general_fitness",
]);
const allowedExperience = new Set(["beginner", "intermediate", "advanced"]);
const allowedEquipment = new Set([
  "bodyweight",
  "dumbbells",
  "barbell",
  "machine",
  "cable",
  "other",
]);

function requirePlainObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "BAD_REQUEST", "The request body must be an object.");
  }
}

function validateAllowedKeys(body, allowedKeys) {
  const unexpected = Object.keys(body).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length) {
    throw new ApiError(422, "VALIDATION_ERROR", "Please check the submitted fields.", {
      fieldErrors: unexpected.map((field) => ({
        field,
        code: "NOT_ALLOWED",
        message: "This field is not allowed.",
      })),
    });
  }
}

function throwFieldErrors(fieldErrors) {
  if (fieldErrors.length) {
    throw new ApiError(422, "VALIDATION_ERROR", "Please check the submitted fields.", {
      fieldErrors,
    });
  }
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function validateRegistration(body) {
  requirePlainObject(body);
  validateAllowedKeys(body, ["name", "email", "password"]);

  const errors = [];
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80) {
    errors.push({
      field: "name",
      code: "OUT_OF_RANGE",
      message: "Name must be between 2 and 80 characters.",
    });
  }
  if (
    typeof body.email !== "string" ||
    body.email.trim().length > 254 ||
    !emailPattern.test(body.email.trim())
  ) {
    errors.push({ field: "email", code: "INVALID", message: "Enter a valid email address." });
  }
  if (
    typeof body.password !== "string" ||
    body.password.length < 8 ||
    body.password.length > 128
  ) {
    errors.push({
      field: "password",
      code: "OUT_OF_RANGE",
      message: "Password must be between 8 and 128 characters.",
    });
  }
  throwFieldErrors(errors);

  return {
    name: body.name.trim(),
    emailNormalized: normalizeEmail(body.email),
    password: body.password,
  };
}

export function validateLogin(body) {
  requirePlainObject(body);
  validateAllowedKeys(body, ["email", "password"]);

  const email =
    typeof body.email === "string" && body.email.trim().length <= 254
      ? normalizeEmail(body.email)
      : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailPattern.test(email) || password.length < 1 || password.length > 128) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  return { emailNormalized: email, password };
}

export function validateProfilePatch(body) {
  requirePlainObject(body);
  const fields = [
    "name",
    "primaryGoal",
    "experienceLevel",
    "equipmentPreferences",
    "age",
    "heightCm",
    "currentWeightKg",
  ];
  validateAllowedKeys(body, fields);

  const errors = [];
  const updates = {};
  if (!Object.keys(body).length) {
    errors.push({ field: "_", code: "REQUIRED", message: "Provide at least one profile field." });
  }
  if (Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80) {
      errors.push({
        field: "name",
        code: "OUT_OF_RANGE",
        message: "Name must be between 2 and 80 characters.",
      });
    } else {
      updates.name = body.name.trim();
    }
  }
  if (Object.hasOwn(body, "primaryGoal")) {
    if (typeof body.primaryGoal !== "string" || !allowedGoals.has(body.primaryGoal)) {
      errors.push({ field: "primaryGoal", code: "INVALID", message: "Choose a listed goal." });
    } else {
      updates.primaryGoal = body.primaryGoal;
    }
  }
  if (Object.hasOwn(body, "experienceLevel")) {
    if (typeof body.experienceLevel !== "string" || !allowedExperience.has(body.experienceLevel)) {
      errors.push({
        field: "experienceLevel",
        code: "INVALID",
        message: "Choose a listed experience level.",
      });
    } else {
      updates.experienceLevel = body.experienceLevel;
    }
  }
  if (Object.hasOwn(body, "equipmentPreferences")) {
    const equipment = body.equipmentPreferences;
    if (
      !Array.isArray(equipment) ||
      equipment.some((item) => typeof item !== "string" || !allowedEquipment.has(item)) ||
      new Set(equipment).size !== equipment.length
    ) {
      errors.push({
        field: "equipmentPreferences",
        code: "INVALID",
        message: "Choose distinct equipment options from the list.",
      });
    } else {
      updates.equipmentPreferences = equipment;
    }
  }
  for (const [field, minimum, maximum, integerOnly] of [
    ["age", 16, 100, true],
    ["heightCm", 80, 250, false],
    ["currentWeightKg", 20, 350, false],
  ]) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (
      value !== null &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < minimum ||
        value > maximum ||
        (integerOnly && !Number.isInteger(value)))
    ) {
      errors.push({
        field,
        code: "OUT_OF_RANGE",
        message: `Value must be between ${minimum} and ${maximum}.`,
      });
    } else {
      updates[field] = value;
    }
  }
  throwFieldErrors(errors);
  return updates;
}

export function toSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.emailNormalized,
    primaryGoal: user.primaryGoal,
    experienceLevel: user.experienceLevel,
    equipmentPreferences: [...user.equipmentPreferences],
    age: user.age ?? null,
    heightCm: user.heightCm ?? null,
    currentWeightKg: user.currentWeightKg ?? null,
    updatedAt: user.updatedAt,
  };
}
