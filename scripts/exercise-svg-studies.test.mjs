import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = resolve(root, "client/public/assets/exercise-studies");

test("exercise SVG study set is complete, unique, and explicitly unreviewed", async () => {
  const manifest = JSON.parse(await readFile(resolve(assetDir, "manifest.json"), "utf8"));
  const svgFiles = (await readdir(assetDir)).filter((file) => file.endsWith(".svg"));

  assert.equal(manifest.count, 25);
  assert.equal(manifest.exercises.length, 25);
  assert.equal(svgFiles.length, 25);
  assert.equal(new Set(manifest.exercises.map(({ slug }) => slug)).size, 25);
  assert.equal(manifest.exercises.filter(({ sourceStatus }) => sourceStatus === "published").length, 24);
  assert.equal(manifest.exercises.find(({ slug }) => slug === "kettlebell-swing").sourceStatus, "repository-draft");
  assert.ok(manifest.exercises.every(({ instructionalUse, reviewStatus }) => !instructionalUse && reviewStatus === "not-reviewed"));

  for (const exercise of manifest.exercises) {
    const svg = await readFile(resolve(assetDir, exercise.file), "utf8");
    assert.match(svg, /<svg\b[^>]*role="img"/, exercise.file);
    assert.match(svg, /<title\b/, exercise.file);
    assert.match(svg, /<desc\b/, exercise.file);
    assert.match(svg, /<animate\b/, exercise.file);
    assert.match(svg, /prefers-reduced-motion:reduce/, exercise.file);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b/i, exercise.file);
  }
});
