import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "client/public/assets/exercise-studies");

const standing = (overrides = {}) => ({
  layout: "standing",
  hipX: 120,
  hipY: 122,
  torso: -90,
  armL: 112,
  elbowL: 105,
  armR: 68,
  elbowR: 75,
  thighL: 108,
  kneeL: 92,
  thighR: 72,
  kneeR: 88,
  ...overrides,
});

const floor = (overrides = {}) => ({
  layout: "floor",
  hipX: 74,
  hipY: 144,
  torso: 0,
  armL: 90,
  elbowL: 90,
  armR: 90,
  elbowR: 90,
  thighL: 180,
  kneeL: 180,
  thighR: 180,
  kneeR: 180,
  ...overrides,
});

const exercises = [
  { slug: "bent-over-row", name: "Bent-Over Row", family: "strength", source: "published", frames: [standing({ torso: -42, hipY: 128 }), standing({ torso: -42, hipY: 128, armL: 145, elbowL: 300, armR: 35, elbowR: 240 })] },
  { slug: "bicep-curl", name: "Bicep Curl", family: "strength", source: "published", frames: [standing(), standing({ elbowL: 280, elbowR: 260 })] },
  { slug: "calf-raise", name: "Calf Raise", family: "strength", source: "published", frames: [standing(), standing({ hipY: 116, kneeL: 80, kneeR: 100 })] },
  { slug: "crunch", name: "Crunch", family: "floor", source: "published", frames: [floor(), floor({ torso: -32, hipY: 144, armL: 75, armR: 105 })] },
  { slug: "deadlift", name: "Deadlift", family: "strength", source: "published", frames: [standing({ torso: -48, hipY: 129, thighL: 118, thighR: 62 }), standing({ thighL: 100, thighR: 80 })] },
  { slug: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", family: "strength", source: "published", frames: [standing({ armL: 150, armR: 30, elbowL: 70, elbowR: 110 }), standing({ armL: 260, armR: 280, elbowL: 260, elbowR: 280 })] },
  { slug: "front-raise", name: "Front Raise", family: "strength", source: "published", frames: [standing(), standing({ armL: 0, armR: 0, elbowL: 0, elbowR: 0 })] },
  { slug: "glute-bridge", name: "Glute Bridge", family: "floor", source: "published", frames: [floor({ hipX: 78, hipY: 151, thighL: 155, thighR: 205, kneeL: 92, kneeR: 88 }), floor({ hipX: 78, hipY: 126, torso: -16, thighL: 155, thighR: 205, kneeL: 92, kneeR: 88 })] },
  { slug: "good-morning", name: "Good Morning", family: "strength", source: "published", frames: [standing({ armL: 160, armR: 20, elbowL: 280, elbowR: 260 }), standing({ torso: -45, hipY: 127, armL: 160, armR: 20, elbowL: 280, elbowR: 260 })] },
  { slug: "hammer-curl", name: "Hammer Curl", family: "strength", source: "published", frames: [standing(), standing({ elbowL: 278, elbowR: 262 })] },
  { slug: "high-knees", name: "High Knees", family: "cardio", source: "published", frames: [standing({ thighL: 300, kneeL: 90, armL: 120, armR: 60 }), standing({ thighR: 240, kneeR: 90, armL: 60, armR: 120 })] },
  { slug: "jumping-jack", name: "Jumping Jack", family: "cardio", source: "published", frames: [standing(), standing({ armL: 250, armR: 290, elbowL: 250, elbowR: 290, thighL: 125, thighR: 55, kneeL: 110, kneeR: 70 })] },
  { slug: "lateral-raise", name: "Lateral Raise", family: "strength", source: "published", frames: [standing(), standing({ armL: 180, armR: 0, elbowL: 180, elbowR: 0 })] },
  { slug: "lunge", name: "Lunge", family: "strength", source: "published", frames: [standing(), standing({ hipY: 128, thighL: 48, kneeL: 98, thighR: 140, kneeR: 55 })] },
  { slug: "overhead-press", name: "Overhead Press", family: "strength", source: "published", frames: [standing({ armL: 150, armR: 30, elbowL: 75, elbowR: 105 }), standing({ armL: 260, armR: 280, elbowL: 260, elbowR: 280 })] },
  { slug: "overhead-tricep-extension", name: "Overhead Tricep Extension", family: "strength", source: "published", frames: [standing({ armL: 260, armR: 280, elbowL: 70, elbowR: 110 }), standing({ armL: 260, armR: 280, elbowL: 260, elbowR: 280 })] },
  { slug: "plank", name: "Plank", family: "floor", source: "published", frames: [floor({ hipY: 139 }), floor({ hipY: 137 })] },
  { slug: "push-up", name: "Push-Up", family: "floor", source: "published", frames: [floor({ hipY: 136 }), floor({ hipY: 151, elbowL: 35, elbowR: 145 })] },
  { slug: "reverse-lunge", name: "Reverse Lunge", family: "strength", source: "published", frames: [standing(), standing({ hipY: 128, thighL: 140, kneeL: 55, thighR: 48, kneeR: 98 })] },
  { slug: "romanian-deadlift", name: "Romanian Deadlift", family: "strength", source: "published", frames: [standing(), standing({ torso: -52, hipY: 129, thighL: 104, thighR: 76 })] },
  { slug: "squat", name: "Squat", family: "strength", source: "published", frames: [standing(), standing({ hipY: 143, thighL: 125, kneeL: 72, thighR: 55, kneeR: 108, armL: 155, armR: 25 })] },
  { slug: "sumo-squat", name: "Sumo Squat", family: "strength", source: "published", frames: [standing({ thighL: 125, thighR: 55 }), standing({ hipY: 143, thighL: 145, kneeL: 50, thighR: 35, kneeR: 130, armL: 155, armR: 25 })] },
  { slug: "superman", name: "Superman", family: "floor", source: "published", frames: [floor({ hipY: 147, armL: 0, armR: 0 }), floor({ hipY: 132, armL: 0, armR: 0, thighL: 190, thighR: 170, kneeL: 190, kneeR: 170 })] },
  { slug: "wall-sit", name: "Wall Sit", family: "strength", source: "published", frames: [standing({ hipY: 144, thighL: 0, kneeL: 90, thighR: 0, kneeR: 90 }), standing({ hipY: 142, thighL: 0, kneeL: 90, thighR: 0, kneeR: 90 })] },
  { slug: "kettlebell-swing", name: "Kettlebell Swing", family: "draft", source: "repository-draft", frames: [standing({ torso: -42, hipY: 129, armL: 120, armR: 60 }), standing({ armL: 5, armR: 355, elbowL: 5, elbowR: 355 })] },
];

const number = (value) => Number(value.toFixed(1));
const pointAlong = ([x, y], length, angle) => {
  const radians = (angle * Math.PI) / 180;
  return [number(x + Math.cos(radians) * length), number(y + Math.sin(radians) * length)];
};
const pair = ([x, y]) => `${x} ${y}`;
const pathFor = (points) => `M${points.map(pair).join(" L")}`;
const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

function buildPose(config) {
  const hip = [config.hipX, config.hipY];
  const shoulder = pointAlong(hip, 54, config.torso);
  const head = pointAlong(shoulder, 22, config.layout === "floor" ? 0 : -90);
  const leftShoulder = [number(shoulder[0] - 5), shoulder[1]];
  const rightShoulder = [number(shoulder[0] + 5), shoulder[1]];
  const leftHip = [number(hip[0] - 4), hip[1]];
  const rightHip = [number(hip[0] + 4), hip[1]];
  const leftElbow = pointAlong(leftShoulder, 24, config.armL);
  const rightElbow = pointAlong(rightShoulder, 24, config.armR);
  const leftWrist = pointAlong(leftElbow, 23, config.elbowL);
  const rightWrist = pointAlong(rightElbow, 23, config.elbowR);
  const leftKnee = pointAlong(leftHip, 31, config.thighL);
  const rightKnee = pointAlong(rightHip, 31, config.thighR);
  const leftAnkle = pointAlong(leftKnee, 30, config.kneeL);
  const rightAnkle = pointAlong(rightKnee, 30, config.kneeR);
  const footDirection = config.layout === "floor" ? -1 : 1;

  return {
    head,
    shoulder,
    hip,
    leftElbow,
    rightElbow,
    leftKnee,
    rightKnee,
    leftWrist,
    rightWrist,
    paths: {
      torso: pathFor([hip, shoulder]),
      leftArm: pathFor([leftShoulder, leftElbow, leftWrist]),
      rightArm: pathFor([rightShoulder, rightElbow, rightWrist]),
      leftLeg: pathFor([leftHip, leftKnee, leftAnkle, [number(leftAnkle[0] + footDirection * 9), number(leftAnkle[1])]]),
      rightLeg: pathFor([rightHip, rightKnee, rightAnkle, [number(rightAnkle[0] + footDirection * 9), number(rightAnkle[1])]]),
    },
  };
}

function animatedPath(className, key, poses, duration) {
  const values = poses.map((pose) => pose.paths[key]).join(";");
  return `<path class="${className}" d="${poses[0].paths[key]}"><animate attributeName="d" values="${values}" keyTimes="0;0.5;1" dur="${duration}s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/></path>`;
}

function animatedCircle(className, key, poses, duration, radius) {
  const values = poses.map((pose) => pair(pose[key])).join(";");
  return `<circle class="${className}" cx="${poses[0][key][0]}" cy="${poses[0][key][1]}" r="${radius}"><animate attributeName="cx" values="${poses.map((pose) => pose[key][0]).join(";")}" keyTimes="0;0.5;1" dur="${duration}s" repeatCount="indefinite"/><animate attributeName="cy" values="${poses.map((pose) => pose[key][1]).join(";")}" keyTimes="0;0.5;1" dur="${duration}s" repeatCount="indefinite"/></circle>`;
}

function createSvg(exercise) {
  const [startConfig, activeConfig] = exercise.frames;
  const poses = [buildPose(startConfig), buildPose(activeConfig), buildPose(startConfig)];
  const duration = exercise.family === "cardio" ? "1.25" : exercise.family === "draft" ? "1.7" : "2.2";
  const titleId = `${exercise.slug}-title`;
  const descId = `${exercise.slug}-description`;
  const status = exercise.source === "repository-draft" ? "DRAFT REFERENCE" : "ILLUSTRATION STUDY";
  const floorY = poses[0].hip[1] > 130 || startConfig.layout === "floor" ? 196 : 202;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 250" role="img" aria-labelledby="${titleId} ${descId}" fill="none">
  <title id="${titleId}">${escapeXml(exercise.name)} movement study</title>
  <desc id="${descId}">Original simplified looping movement illustration. It is not form instruction and has not received independent exercise review.</desc>
  <style>
    .background{fill:#10252e}.ground{stroke:#31515b;stroke-width:2}.body{stroke:#ede7e3;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}.far-limb{stroke:#489fb5;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.near-limb{stroke:#82c0cc;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.joint{fill:#ffa62b;stroke:#10252e;stroke-width:2}.head{fill:#82c0cc;stroke:#ede7e3;stroke-width:3}.eyebrow{fill:#ffa62b;font:600 8px system-ui,sans-serif;letter-spacing:1.2px}.label{fill:#ede7e3;font:600 11px system-ui,sans-serif}.caption{fill:#a8c6cc;font:500 7px system-ui,sans-serif;letter-spacing:.5px}
    @media(prefers-reduced-motion:reduce){animate{display:none!important}}
  </style>
  <rect class="background" x="1" y="1" width="238" height="248" rx="18"/>
  <text class="eyebrow" x="16" y="22">${status}</text>
  <path class="ground" d="M18 ${floorY}H222"/>
  ${animatedPath("far-limb", "leftLeg", poses, duration)}
  ${animatedPath("body", "torso", poses, duration)}
  ${animatedPath("far-limb", "leftArm", poses, duration)}
  ${animatedPath("near-limb", "rightLeg", poses, duration)}
  ${animatedPath("near-limb", "rightArm", poses, duration)}
  ${animatedCircle("head", "head", poses, duration, 11)}
  ${animatedCircle("joint", "leftKnee", poses, duration, 3.5)}
  ${animatedCircle("joint", "rightKnee", poses, duration, 3.5)}
  ${animatedCircle("joint", "leftElbow", poses, duration, 3)}
  ${animatedCircle("joint", "rightElbow", poses, duration, 3)}
  <text class="label" x="120" y="224" text-anchor="middle">${escapeXml(exercise.name)}</text>
  <text class="caption" x="120" y="238" text-anchor="middle">CONCEPT ART · NOT FORM GUIDANCE</text>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

for (const exercise of exercises) {
  await writeFile(resolve(outputDir, `${exercise.slug}.svg`), createSvg(exercise), "utf8");
}

const manifest = {
  status: "supplemental-unreviewed",
  count: exercises.length,
  source: {
    repository: "https://github.com/AssiamahS/opengym3d/tree/ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae",
    note: "The 24 published pack names are references only. Kettlebell Swing is a repository draft, not part of that published pack. All SVG artwork and motion keyframes here are original simplified studies; no upstream animation or artwork was copied.",
  },
  exercises: exercises.map(({ slug, name, family, source }) => ({
    slug,
    name,
    file: `${slug}.svg`,
    sourceStatus: source,
    family,
    reviewStatus: "not-reviewed",
    instructionalUse: false,
  })),
};

await writeFile(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(resolve(outputDir, "SOURCES.md"), `# Exercise SVG studies

These are original, simplified vector movement studies created for FitTrack. They do not reuse OpenGym3D artwork, GLB files, pose definitions, or animation keyframes.

- The 24 names marked \`published\` are listed in the OpenGym3D v1 exercise-pack listing at the pinned repository revision below.
- \`Kettlebell Swing\` is based only on a draft exercise definition in that same repository; it is not represented as one of the published 24-pack animations.
- Source reference: [OpenGym3D at revision ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae](https://github.com/AssiamahS/opengym3d/tree/ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae).
- Published-name reference: [v1 exercise-pack listing](https://github.com/AssiamahS/opengym3d/blob/ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae/dist/GUMROAD_LISTING.md); draft-name reference: [Kettlebell Swing definition](https://github.com/AssiamahS/opengym3d/blob/ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae/exercises/kettlebell_swing.json).
- These files are supplementary concept art, not exercise instructions, biomechanical validation, or substitutes for the licensed realistic 3D model and independently reviewed clip required by the product specification.
- Each SVG includes a reduced-motion rule and an accessible title/description. The animated drawings are not independently reviewed and must not be presented as form guidance.

Regenerate from the project root with \`npm run generate:exercise-svg\`.
`, "utf8");

console.log(`Generated ${exercises.length} original exercise SVG studies in ${outputDir}`);
