#!/usr/bin/env node
/**
 * SpaceX Launch Globe — 3D Model Optimization Pipeline
 *
 * Optimizes GLB models downloaded from Sketchfab for web use.
 * Run after placing raw .glb files in public/models/
 *
 * Usage: node scripts/optimize-models.mjs
 *
 * Prerequisites:
 *   npm install -D @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "fs";
import { join, basename } from "path";
import { execSync } from "child_process";

const MODELS_DIR = "public/models";
const RAW_DIR = "public/models/raw"; // Place raw downloads here
const OUTPUT_DIR = "public/models";

// Target optimization for each model
const MODEL_CONFIG = {
  "falcon9.glb": {
    simplifyRatio: 0.8, // Keep 80% of geometry (already low-poly)
    textureSize: 512,
    description: "Falcon 9 Block 5",
  },
  "falconHeavy.glb": {
    simplifyRatio: 0.8,
    textureSize: 512,
    description: "Falcon Heavy",
  },
  "starship.glb": {
    simplifyRatio: 0.04, // Aggressive: 883k → ~35k triangles
    textureSize: 512,
    description: "Starship S24/B7",
  },
};

function checkDependencies() {
  try {
    execSync("npx gltf-transform --version", { stdio: "pipe" });
    return true;
  } catch {
    console.log("⚠ gltf-transform not found. Installing...");
    try {
      execSync(
        "npm install -D @gltf-transform/cli",
        { stdio: "inherit" }
      );
      return true;
    } catch {
      console.error("✗ Failed to install @gltf-transform/cli");
      console.error("  Run manually: npm install -D @gltf-transform/cli");
      return false;
    }
  }
}

function optimizeModel(inputPath, outputPath, config) {
  const name = config.description;
  console.log(`\n── Optimizing ${name} ──`);

  const inputSize = statSync(inputPath).size;
  console.log(`  Input: ${(inputSize / 1024 / 1024).toFixed(1)} MB`);

  // Build optimization pipeline using gltf-transform CLI
  const commands = [
    // Strip unnecessary data
    `npx gltf-transform dedup "${inputPath}" "${outputPath}"`,
    // Resize textures
    `npx gltf-transform resize "${outputPath}" "${outputPath}" --width ${config.textureSize} --height ${config.textureSize}`,
    // Simplify mesh (reduce triangle count)
    `npx gltf-transform simplify "${outputPath}" "${outputPath}" --ratio ${config.simplifyRatio}`,
    // Compress with Draco
    `npx gltf-transform draco "${outputPath}" "${outputPath}"`,
  ];

  for (const cmd of commands) {
    try {
      console.log(`  → ${cmd.split('"')[0].trim()}...`);
      execSync(cmd, { stdio: "pipe" });
    } catch (e) {
      console.warn(`  ⚠ Step failed (continuing): ${e.message?.split("\n")[0]}`);
    }
  }

  if (existsSync(outputPath)) {
    const outputSize = statSync(outputPath).size;
    const ratio = ((1 - outputSize / inputSize) * 100).toFixed(0);
    console.log(`  Output: ${(outputSize / 1024 / 1024).toFixed(1)} MB (${ratio}% reduction)`);
    console.log(`  ✓ ${name} optimized`);
  } else {
    console.error(`  ✗ Output file not created`);
  }
}

function main() {
  console.log("SpaceX Launch Globe — Model Optimization Pipeline");
  console.log("================================================\n");

  if (!checkDependencies()) {
    process.exit(1);
  }

  // Check for raw models
  const hasRawDir = existsSync(RAW_DIR);
  const sourceDir = hasRawDir ? RAW_DIR : MODELS_DIR;

  if (hasRawDir) {
    console.log(`Using raw models from: ${RAW_DIR}`);
  } else {
    console.log(`No raw/ subdirectory found. Looking in: ${MODELS_DIR}`);
    console.log("Tip: Place original downloads in public/models/raw/ to preserve originals.\n");
  }

  let processed = 0;

  for (const [filename, config] of Object.entries(MODEL_CONFIG)) {
    const inputPath = join(sourceDir, filename);
    const outputPath = join(OUTPUT_DIR, filename);

    if (!existsSync(inputPath)) {
      console.log(`\n⚠ ${config.description}: ${filename} not found in ${sourceDir}`);
      continue;
    }

    // If source is the same as output, make a backup first
    if (sourceDir === MODELS_DIR) {
      if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });
      const backupPath = join(RAW_DIR, filename);
      if (!existsSync(backupPath)) {
        copyFileSync(inputPath, backupPath);
        console.log(`  Backed up original to ${backupPath}`);
      }
    }

    optimizeModel(inputPath, outputPath, config);
    processed++;
  }

  if (processed === 0) {
    console.log("\nNo models found to optimize.");
    console.log("Download models first: bash scripts/download-models.sh");
  } else {
    console.log(`\n✓ Done. ${processed} model(s) optimized.`);
    console.log("Models are ready in public/models/");
  }
}

main();
