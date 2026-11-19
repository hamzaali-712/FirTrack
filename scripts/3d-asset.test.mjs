import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDirectory = path.join(root, "client", "public", "assets", "3d");
const modelPath = path.join(assetDirectory, "push-up.v1.glb");

function readGlb(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);

  let offset = 12;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString("ascii", offset + 4, offset + 8);
    const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === "JSON") {
      return JSON.parse(chunk.toString("utf8").trimEnd());
    }
    offset += 8 + chunkLength;
  }

  assert.fail("GLB has no JSON chunk.");
}

test("bundled push-up asset matches the registered rigged clip", async () => {
  const buffer = await readFile(modelPath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const gltf = readGlb(buffer);
  const skin = gltf.skins?.find((candidate) => candidate.joints?.length === 163);
  const animation = gltf.animations?.find((candidate) => candidate.name === "Human.rig");
  const timeAccessor = animation
    ? gltf.accessors[animation.samplers[0].input]
    : undefined;

  assert.equal(sha256, "71308ea9b76e1de0aa079c51314f1c9d6c2977f068664c4e8d0c001b8b3681fe");
  assert.ok(skin, "Expected the registered 163-joint skin.");
  assert.ok(animation?.channels.length > 0, "Expected the named rig animation.");
  assert.equal(timeAccessor?.max?.[0], 2.8);
});

test("bundled asset retains its source and license notices", async () => {
  const [license, attribution, poster] = await Promise.all([
    readFile(path.join(assetDirectory, "LICENSE.txt"), "utf8"),
    readFile(path.join(assetDirectory, "ATTRIBUTION.txt"), "utf8"),
    readFile(path.join(assetDirectory, "push-up.v1.png")),
  ]);

  assert.match(license, /MIT License/);
  assert.match(attribution, /ea3a60130fdcfb3c4771e44d09f84ebab4ee9bae/);
  assert.match(attribution, /not been independently/);
  assert.ok(poster.length > 0);
});
