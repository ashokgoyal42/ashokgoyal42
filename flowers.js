/* =============================================================
   FLOWERS — pure data. Add new species by adding entries here;
   no logic changes required.
   ============================================================= */

const SPECIES = {
  marigold: {
    id: 'marigold',
    name: 'French Marigold',
    scientific: 'Tagetes patula',
    rarity: 'common',
    seedCost: 5,
    sellValue: 20,

    // Lifecycle stages, in order. Each advances when its duration
    // elapses AND the plant isn't too stressed (see tick()).
    stages: [
      { id: 'seed',        durationMs:  0,              sprite: 'seed'       },
      { id: 'germinating', durationMs:  2 * 60 * 1000,  sprite: 'soil_crack' },
      { id: 'sprout',      durationMs:  3 * 60 * 1000,  sprite: 'sprout'     },
      { id: 'vegetative',  durationMs:  5 * 60 * 1000,  sprite: 'leafy'      },
      { id: 'budding',     durationMs:  3 * 60 * 1000,  sprite: 'bud'        },
      { id: 'blooming',    durationMs: 10 * 60 * 1000,  sprite: 'flower'     }, // harvest window
      { id: 'faded',       durationMs: Infinity,        sprite: 'faded'      }  // missed it
    ],

    // Care tolerances. Six-zone model: lethal / stress / optimal / stress / lethal.
    care: {
      moisture: {
        lethal_low:  0,   stress_low:  20,
        optimal_low: 40,  optimal_high: 70,
        stress_high: 85,  lethal_high: 100,
        decayPerMinute: 1.5
      },
      light: {
        optimal:   ['window', 'direct'],
        tolerated: ['shade'],
        isStressed: (light) => light === 'shade'
      }
    },

    // Learning, embedded in play. Fires when triggered in-game.
    journal: [
      { trigger: 'firstBloom', text: 'Marigolds repel aphids — natural companion for tomatoes.' },
      { trigger: 'overwater',  text: 'Marigolds prefer drying out between waterings. Let the topsoil go dry.' },
      { trigger: 'underwater', text: 'Wilted marigolds usually recover within hours of watering.' },
      { trigger: 'harvest',    text: 'Petals are edible — peppery, faintly citrus. Used in Mexican cooking.' }
    ]
  }
};
