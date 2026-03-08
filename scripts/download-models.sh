#!/bin/bash
#
# SpaceX Launch Globe — 3D Model Download Guide
# ===============================================
#
# Sketchfab requires a free account to download models.
# Follow these steps for each model:
#
# 1. Visit the Sketchfab URL
# 2. Click "Download 3D Model" (sign in if prompted)
# 3. Select "glTF" format (includes .glb binary)
# 4. Extract the downloaded ZIP
# 5. Place the .glb file in public/models/ with the expected filename
# 6. Run the optimization script: node scripts/optimize-models.mjs
#
# ── Falcon 9 Block 5 ──────────────────────────────────────────
# URL:      https://sketchfab.com/3d-models/spacex-falcon-9-block-5-61067a8b341c4b4b96053d5fa607f232
# Filename: public/models/falcon9.glb
# Creator:  AllThingsSpace (sunnychen753)
# License:  CC-BY 4.0
# Triangles: 28.6k (no optimization needed)
#
# ── Falcon Heavy ──────────────────────────────────────────────
# URL:      https://sketchfab.com/3d-models/spacex-falcon-heavy-2f11453207944cedba00e2c6c1aa1269
# Filename: public/models/falconHeavy.glb
# Creator:  AllThingsSpace (sunnychen753)
# License:  CC-BY 4.0
# Triangles: 25.6k (no optimization needed)
#
# ── Starship Ship 24 & Booster 7 V4 ──────────────────────────
# URL:      https://sketchfab.com/3d-models/spacex-starship-ship-24-booster-7-v4-97875d14b63e4b9ca9ed425ef4253306
# Filename: public/models/starship.glb
# Creator:  Clarence365
# License:  CC-BY 4.0
# Triangles: 883.8k (NEEDS optimization — run optimize-models.mjs)
#
# ── After downloading ─────────────────────────────────────────
# Verify files exist:
echo "Checking for model files..."
for model in falcon9.glb falconHeavy.glb starship.glb; do
  if [ -f "public/models/$model" ]; then
    echo "  ✓ $model found ($(du -h "public/models/$model" | cut -f1))"
  else
    echo "  ✗ $model MISSING — download from Sketchfab"
  fi
done

echo ""
echo "If all models are present, run: node scripts/optimize-models.mjs"
