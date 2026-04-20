/* =============================================================
   PLANT — growth state machine. Pure logic, no DOM.
   Depends on SPECIES from flowers.js.
   ============================================================= */

const SAVE_KEY = 'plant';

function newPlant(speciesId) {
  return {
    speciesId,
    stageIndex:    0,
    timeInStageMs: 0,
    moisture:      60,
    light:         'window',
    stress:        0,
    health:        100,
    lastUpdated:   Date.now(),
    isDead:        false,
    harvested:     false,
    journalFlags:  {}
  };
}

// Three-tier punishment: growth slows, then stops, then kills.
function tick(plant, species, deltaMs) {
  if (plant.isDead || plant.harvested) return plant;

  const deltaMin = deltaMs / 60000;
  const m = species.care.moisture;

  // (a) Environmental decay
  plant.moisture = clamp(plant.moisture - m.decayPerMinute * deltaMin, 0, 100);

  // (b) Stress accumulation / recovery
  let stressDelta = 0;
  if (plant.moisture <= m.lethal_low || plant.moisture >= m.lethal_high) {
    stressDelta += 10 * deltaMin;   // lethal
  } else if (plant.moisture < m.stress_low || plant.moisture > m.stress_high) {
    stressDelta += 3 * deltaMin;    // stress
    fireJournal(plant, species, plant.moisture < m.stress_low ? 'underwater' : 'overwater');
  } else {
    stressDelta -= 1 * deltaMin;    // optimal — recovery
  }
  if (species.care.light.isStressed(plant.light)) {
    stressDelta += 2 * deltaMin;
  }
  plant.stress = clamp(plant.stress + stressDelta, 0, 100);

  // (c) Health erosion — only when stress is sustained high
  if (plant.stress > 70) {
    plant.health -= (plant.stress - 70) * 0.1 * deltaMin;
  } else if (plant.stress < 30) {
    plant.health = Math.min(100, plant.health + 0.5 * deltaMin);
  }
  if (plant.health <= 0) {
    plant.isDead = true;
    return plant;
  }

  // (d) Growth progression — speed scales with stress
  const growthMultiplier =
    plant.stress < 50 ? 1.0 :
    plant.stress < 80 ? 0.3 :
    0.0;

  plant.timeInStageMs += deltaMs * growthMultiplier;

  const currentStage = species.stages[plant.stageIndex];
  const isLastStage  = plant.stageIndex >= species.stages.length - 1;

  if (!isLastStage && plant.timeInStageMs >= currentStage.durationMs) {
    plant.stageIndex++;
    plant.timeInStageMs = 0;
    if (species.stages[plant.stageIndex].id === 'blooming') {
      fireJournal(plant, species, 'firstBloom');
    }
  }

  return plant;
}

// Chunked offline catch-up so stress dynamics behave naturally.
// Cap at 24h to prevent a month-away surprise death.
function catchUp(plant, species) {
  const now = Date.now();
  const elapsed = now - plant.lastUpdated;
  const capped = Math.min(elapsed, 24 * 60 * 60 * 1000);
  const CHUNK = 60 * 1000;
  let remaining = capped;
  while (remaining > 0 && !plant.isDead) {
    const step = Math.min(CHUNK, remaining);
    tick(plant, species, step);
    remaining -= step;
  }
  plant.lastUpdated = now;
  return plant;
}

function water(plant, amount = 30) {
  plant.moisture = clamp(plant.moisture + amount, 0, 100);
}

function setLight(plant, location) {
  plant.light = location;
}

// Returns coin value. 0 if not harvestable. Scales with health.
function harvest(plant, species) {
  const stage = species.stages[plant.stageIndex].id;
  if (stage !== 'blooming' || plant.harvested) return 0;
  plant.harvested = true;
  fireJournal(plant, species, 'harvest');
  return Math.round(species.sellValue * (plant.health / 100));
}

// ---- helpers ----

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function fireJournal(plant, species, trigger) {
  if (plant.journalFlags[trigger]) return;
  const entry = species.journal.find(j => j.trigger === trigger);
  if (!entry) return;
  plant.journalFlags[trigger] = Date.now();
}

// ---- persistence ----

function save(plant) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(plant)); } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : newPlant('marigold');
  } catch (e) {
    return newPlant('marigold');
  }
}
