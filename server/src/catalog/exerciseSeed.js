import { Exercise, EXERCISE_GROUPS } from "../models/Exercise.js";

const safeMovementNotes = [
  "Use a range of motion and resistance you can control.",
  "Stop if the movement causes pain.",
];

function entry(
  slug,
  name,
  primaryMuscleGroup,
  equipment,
  difficulty,
  trackingType,
  goalTags,
  instructions,
  secondaryMuscleGroups = [],
) {
  return {
    slug,
    name,
    primaryMuscleGroup,
    secondaryMuscleGroups,
    equipment,
    difficulty,
    trackingType,
    instructions,
    safetyNotes: safeMovementNotes,
    goalTags,
    imageUrl: null,
  };
}

export const exerciseSeed = [
  entry("barbell-bench-press", "Barbell Bench Press", "chest", ["barbell"], "intermediate", "reps_weight", ["muscle_gain", "strength"], ["Lie with your eyes under the bar and set your feet on the floor.", "Grip the bar evenly and lower it under control toward the mid-chest.", "Press the bar upward until your elbows are extended without bouncing."], ["triceps", "shoulders"]),
  entry("incline-dumbbell-press", "Incline Dumbbell Press", "chest", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Set a bench to a comfortable incline and hold a dumbbell in each hand.", "Lower the weights beside the upper chest with wrists stacked over elbows.", "Press the weights upward without letting them collide."], ["triceps", "shoulders"]),
  entry("push-up", "Push-Up", "chest", ["bodyweight"], "beginner", "reps_only", ["muscle_gain", "strength", "general_fitness"], ["Place your hands just wider than shoulder width and make a straight line from head to heels.", "Lower your chest toward the floor while keeping your elbows controlled.", "Press the floor away to return to the start position."], ["triceps", "shoulders"]),
  entry("chest-press-machine", "Chest Press Machine", "chest", ["machine"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Adjust the seat so the handles begin around mid-chest height.", "Hold the handles and press forward without locking your elbows forcefully.", "Return the handles slowly until you feel a comfortable stretch."], ["triceps", "shoulders"]),

  entry("lat-pulldown", "Lat Pulldown", "back", ["cable"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Set the thigh pad and take a comfortable overhand grip.", "Sit tall and draw the bar toward the upper chest while keeping your torso steady.", "Return the bar upward with control until your arms are extended."], ["biceps", "shoulders"]),
  entry("pull-up", "Pull-Up", "back", ["bodyweight"], "advanced", "reps_only", ["muscle_gain", "strength"], ["Take a secure overhand grip on the bar with hands wider than shoulder width.", "Brace your trunk and pull until your chin clears the bar without swinging.", "Lower yourself under control to the starting position."], ["biceps"]),
  entry("seated-cable-row", "Seated Cable Row", "back", ["cable"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Sit tall with knees slightly bent and hold the row handle.", "Pull the handle toward your torso while keeping your shoulders relaxed.", "Extend your arms slowly without rounding your back."], ["biceps"]),
  entry("one-arm-dumbbell-row", "One-Arm Dumbbell Row", "back", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Support one hand and knee on a stable bench and hold a dumbbell in the other hand.", "Keep your trunk steady and draw the weight toward your hip.", "Lower the weight until your arm is extended, then repeat on the other side."], ["biceps"]),

  entry("overhead-press", "Overhead Press", "shoulders", ["barbell"], "intermediate", "reps_weight", ["muscle_gain", "strength"], ["Stand with feet about hip-width apart and hold the bar at shoulder height.", "Brace your trunk and press the bar overhead while keeping it close to your face.", "Lower the bar under control back to shoulder height."], ["triceps"]),
  entry("lateral-raise", "Lateral Raise", "shoulders", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "general_fitness"], ["Stand tall with a light dumbbell at each side and a soft bend in your elbows.", "Raise your arms out to the sides to a comfortable height without shrugging.", "Lower the dumbbells slowly to your sides."]),
  entry("rear-delt-fly", "Rear Delt Fly", "shoulders", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "general_fitness"], ["Hinge at the hips with a neutral back and hold light dumbbells below your shoulders.", "Raise your arms out to the sides while keeping a slight elbow bend.", "Lower the weights slowly and maintain a steady torso."], ["back"]),
  entry("face-pull", "Face Pull", "shoulders", ["cable"], "beginner", "reps_weight", ["muscle_gain", "general_fitness"], ["Set a cable attachment near face height and hold both ends.", "Pull the attachment toward your face while keeping your elbows lifted.", "Return your hands forward with control."], ["back"]),

  entry("barbell-curl", "Barbell Curl", "biceps", ["barbell"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Stand upright and hold the bar with an underhand grip.", "Bend your elbows to raise the bar without swinging your torso.", "Lower the bar slowly until your arms are extended."]),
  entry("dumbbell-curl", "Dumbbell Curl", "biceps", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "general_fitness"], ["Stand tall with a dumbbell in each hand and palms facing forward.", "Curl the weights toward your shoulders while keeping your elbows near your sides.", "Lower the weights under control."]),
  entry("hammer-curl", "Hammer Curl", "biceps", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain", "general_fitness"], ["Stand upright while holding dumbbells with palms facing each other.", "Bend your elbows and lift the weights without rotating your wrists.", "Lower the dumbbells slowly to the starting position."]),
  entry("preacher-curl", "Preacher Curl", "biceps", ["barbell"], "intermediate", "reps_weight", ["muscle_gain"], ["Set the preacher bench so your upper arms rest securely on the pad.", "Curl the bar upward without lifting your upper arms from the pad.", "Lower the bar slowly, stopping before your elbows lock."]),

  entry("cable-triceps-pushdown", "Cable Triceps Pushdown", "triceps", ["cable"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Stand facing the cable with elbows close to your sides.", "Press the handle downward by extending your elbows.", "Return the handle upward slowly while keeping your upper arms steady."]),
  entry("overhead-triceps-extension", "Overhead Triceps Extension", "triceps", ["dumbbells"], "beginner", "reps_weight", ["muscle_gain"], ["Hold one dumbbell securely with both hands and raise it overhead.", "Bend your elbows to lower the weight behind your head within a comfortable range.", "Extend your elbows to raise the dumbbell overhead again."]),
  entry("skull-crusher", "Skull Crusher", "triceps", ["barbell"], "intermediate", "reps_weight", ["muscle_gain", "strength"], ["Lie on a bench and hold a light bar above your chest with arms extended.", "Bend your elbows to lower the bar toward the area above your forehead.", "Extend your elbows to return the bar above your chest."]),
  entry("close-grip-push-up", "Close-Grip Push-Up", "triceps", ["bodyweight"], "intermediate", "reps_only", ["muscle_gain", "strength"], ["Set your hands beneath your shoulders and keep your body in a straight line.", "Lower your chest while keeping elbows close to your sides.", "Press through your hands to return to the start position."], ["chest"]),

  entry("squat", "Barbell Back Squat", "legs_glutes", ["barbell"], "intermediate", "reps_weight", ["muscle_gain", "strength", "general_fitness"], ["Position the bar securely across your upper back and stand with feet about shoulder-width apart.", "Sit your hips down and back while keeping your feet grounded and torso controlled.", "Drive through the floor to stand, maintaining balance over your feet."], ["core"]),
  entry("leg-press", "Leg Press", "legs_glutes", ["machine"], "beginner", "reps_weight", ["muscle_gain", "strength"], ["Set the seat so you can begin with knees comfortably bent.", "Place your feet on the platform and press it away without locking your knees.", "Bend your knees slowly to return the platform within a comfortable range."]),
  entry("romanian-deadlift", "Romanian Deadlift", "legs_glutes", ["barbell"], "intermediate", "reps_weight", ["muscle_gain", "strength"], ["Stand tall holding the bar in front of your thighs with a soft bend in your knees.", "Push your hips back and lower the bar close to your legs while keeping your back neutral.", "Drive your hips forward to return to standing."], ["back"]),
  entry("walking-lunge", "Walking Lunge", "legs_glutes", ["bodyweight"], "beginner", "reps_only", ["muscle_gain", "general_fitness"], ["Stand tall with feet hip-width apart and choose a clear, stable path.", "Step forward and lower until both knees are comfortably bent.", "Push through the front foot to step through and repeat on the other side."]),

  entry("plank", "Forearm Plank", "core", ["bodyweight"], "beginner", "duration", ["general_fitness", "strength"], ["Place your forearms on the floor with elbows below your shoulders.", "Step your feet back and keep your head, hips, and heels aligned.", "Breathe steadily while holding the position, then lower your knees to finish."], ["shoulders"]),
  entry("crunch", "Crunch", "core", ["bodyweight"], "beginner", "reps_only", ["general_fitness"], ["Lie on your back with knees bent and feet resting on the floor.", "Gently brace your trunk and lift your shoulder blades a short distance.", "Lower your upper back slowly without pulling on your neck."]),
  entry("dead-bug", "Dead Bug", "core", ["bodyweight"], "beginner", "reps_only", ["general_fitness", "strength"], ["Lie on your back with arms reaching upward and knees bent above your hips.", "Brace gently and lower one arm and the opposite leg within a controlled range.", "Return to the start and alternate sides while keeping your back comfortable."]),
  entry("hanging-knee-raise", "Hanging Knee Raise", "core", ["bodyweight"], "intermediate", "reps_only", ["muscle_gain", "strength"], ["Take a secure hang from a stable pull-up bar with shoulders controlled.", "Bend your knees and raise them toward your torso without swinging.", "Lower your legs slowly to the starting hang."], ["shoulders"]),

  entry("brisk-walking", "Brisk Walking", "cardio", ["bodyweight"], "beginner", "duration", ["fat_loss", "endurance", "general_fitness"], ["Choose a level route and a pace that feels purposeful but controlled.", "Walk with a comfortable stride and allow your arms to move naturally.", "Continue for the planned time, then gradually ease your pace."]),
  entry("running", "Running", "cardio", ["bodyweight"], "intermediate", "duration", ["fat_loss", "endurance", "general_fitness"], ["Choose a clear route and begin at a pace you can control.", "Run with relaxed shoulders and a comfortable, repeatable stride.", "Continue for the planned time and ease into a slower pace before stopping."]),
  entry("cycling", "Stationary Cycling", "cardio", ["machine"], "beginner", "duration", ["fat_loss", "endurance", "general_fitness"], ["Adjust the seat so your knee remains slightly bent near the bottom of the pedal stroke.", "Begin pedaling at a comfortable cadence and keep your posture relaxed.", "Continue for the planned time, then reduce effort gradually."]),
  entry("rowing-machine", "Rowing Machine", "cardio", ["machine"], "beginner", "duration", ["fat_loss", "endurance", "general_fitness"], ["Set your feet securely and sit tall with a relaxed grip on the handle.", "Drive with your legs first, then lean back slightly and draw the handle toward your torso.", "Extend your arms, hinge forward, and bend your knees to return smoothly."], ["back"]),
];

export function validateExerciseSeed(records = exerciseSeed) {
  const slugs = new Set();
  const names = new Set();
  const groupCounts = Object.fromEntries(EXERCISE_GROUPS.map((group) => [group, 0]));

  for (const record of records) {
    if (slugs.has(record.slug)) throw new Error(`Duplicate exercise slug: ${record.slug}`);
    slugs.add(record.slug);
    const normalizedName = record.name.trim().toLowerCase();
    if (names.has(normalizedName)) throw new Error(`Duplicate exercise name: ${record.name}`);
    names.add(normalizedName);
    if (!Object.hasOwn(groupCounts, record.primaryMuscleGroup)) {
      throw new Error(`Unsupported exercise group for ${record.slug}.`);
    }
    groupCounts[record.primaryMuscleGroup] += 1;
    if (
      !record.instructions.length ||
      record.instructions.some((instruction) => instruction.length < 8) ||
      record.imageUrl !== null
    ) {
      throw new Error(`Exercise content is incomplete or has unreviewed media: ${record.slug}`);
    }
  }

  if (slugs.size < 32) throw new Error("The exercise seed must contain at least 32 unique exercises.");
  for (const [group, count] of Object.entries(groupCounts)) {
    if (count < 4) throw new Error(`The exercise seed needs at least four ${group} entries.`);
  }

  return { groupCounts, total: slugs.size };
}

export async function seedExerciseCatalog() {
  const expected = validateExerciseSeed();
  await Exercise.init();
  await Exercise.bulkWrite(
    exerciseSeed.map(({ slug, ...fields }) => ({
      updateOne: {
        filter: { slug },
        update: {
          $set: { ...fields, isActive: true },
          $setOnInsert: {
            slug,
            animation: null,
            animationStatus: "missing",
            contentReviewStatus: "draft",
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  const active = await Exercise.find({ isActive: true })
    .select("slug primaryMuscleGroup")
    .setOptions({ sanitizeFilter: true })
    .lean();
  const groupCounts = Object.fromEntries(EXERCISE_GROUPS.map((group) => [group, 0]));
  const uniqueSlugs = new Set();
  for (const exercise of active) {
    if (uniqueSlugs.has(exercise.slug)) throw new Error(`Duplicate active slug: ${exercise.slug}`);
    uniqueSlugs.add(exercise.slug);
    groupCounts[exercise.primaryMuscleGroup] += 1;
  }
  if (uniqueSlugs.size < 32 || Object.values(groupCounts).some((count) => count < 4)) {
    throw new Error("Seed audit failed: active catalog does not meet the minimum group counts.");
  }

  return {
    seedCount: expected.total,
    activeCount: active.length,
    groupCounts,
  };
}
