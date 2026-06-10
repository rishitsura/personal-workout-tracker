// Default workout plan — 6-day split from trainer
// This is used during onboarding when "Use Recommended Plan" is selected

export const DEFAULT_PLAN = {
  days: [
    {
      key: 'day1',
      label: 'Day 1',
      name: 'Chest & Triceps',
      emoji: '🏋️',
      color: '#f97316',
      exercises: [
        { id: 'flat_bench_rod', name: 'Flat Bench (Rod)', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'inclined_db_press', name: 'Inclined DB Press', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'high_low_cable_fly', name: 'High to Low Cable Fly', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'chest_press_machine', name: 'Chest Press Machine', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'pec_deck_flys', name: 'Pec Deck Flys', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'tricep_pressdown', name: 'Triceps Press Down', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'overhead_extension', name: 'Overhead Extension', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'heavy_db_kickback', name: 'Heavy DB + DB Kickback', defaultSets: 3, defaultReps: 12, unit: 'kg' },
      ],
    },
    {
      key: 'day2',
      label: 'Day 2',
      name: 'Back & Biceps',
      emoji: '💪',
      color: '#3b82f6',
      exercises: [
        { id: 'lat_pulldown', name: 'Lats Pull Down', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'db_rowing', name: 'DB Rowing', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'seated_rowing', name: 'Seated Rowing', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'v_cut_pulling', name: 'V-Cut Pulling', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'bend_over_rod_rowing', name: 'Bend Over Rod Rowing', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'bicep_rod', name: 'Bicep Rod', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'db_curls', name: 'DB Curls', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'hammer_rope', name: 'Hammer Rope', defaultSets: 3, defaultReps: 12, unit: 'kg' },
      ],
    },
    {
      key: 'day3',
      label: 'Day 3',
      name: 'Shoulders & Legs',
      emoji: '🦵',
      color: '#10b981',
      exercises: [
        { id: 'front_shoulder_press_rod', name: 'Front Shoulder Press (Rod)', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'db_press_seated', name: 'DB Press Seated', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'db_lateral_fly', name: 'DB Lateral Fly', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'upright_row', name: 'Upright Row', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'face_pulls', name: 'Face Pulls', defaultSets: 3, defaultReps: 15, unit: 'kg' },
        { id: 'db_shrugs_arnold', name: 'DB Shrugs + Arnold Press', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'weighted_squats', name: 'Weighted Squats', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'leg_press', name: 'Leg Press', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'leg_extension', name: 'Leg Extension', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'sumo_squats', name: 'Sumo Squats', defaultSets: 3, defaultReps: 12, unit: 'kg' },
      ],
    },
    {
      key: 'day4',
      label: 'Day 4',
      name: 'Upper Body Giant Set',
      emoji: '🔥',
      color: '#ef4444',
      exercises: [
        { id: 'flat_db_press', name: 'Flat DB Press', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'lat_pulldown_d4', name: 'Lats Pull Down', defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'shoulder_db_flys', name: 'Shoulder DB Flys', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'bicep_curls_d4', name: 'Bicep Curls (Rod/DB/Cable)', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'tricep_pressdown_d4', name: 'Triceps Press Down', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'deadlift', name: 'Deadlift', defaultSets: 3, defaultReps: 8, unit: 'kg' },
      ],
    },
    {
      key: 'day5',
      label: 'Day 5',
      name: 'Lower Body',
      emoji: '🦿',
      color: '#8b5cf6',
      exercises: [
        { id: 'leg_extension_d5', name: 'Leg Extension', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'lunges', name: 'Lunges', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'goblet_squats', name: 'Goblet Squats', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'leg_curls', name: 'Leg Curls', defaultSets: 3, defaultReps: 12, unit: 'kg' },
        { id: 'rdl_db', name: "RDL's DB", defaultSets: 3, defaultReps: 10, unit: 'kg' },
        { id: 'calf_raises_seated', name: 'Calf Raises Seated', defaultSets: 3, defaultReps: 15, unit: 'kg' },
        { id: 'calf_raises_standing', name: 'Calf Raises Standing', defaultSets: 3, defaultReps: 15, unit: 'kg' },
      ],
    },
    {
      key: 'day6',
      label: 'Day 6',
      name: 'Cardio & Mobility',
      emoji: '🏃',
      color: '#ec4899',
      exercises: [],
    },
  ],
}

/**
 * Get a day from the plan by its key
 */
export function getDayByKey(plan, dayKey) {
  return plan?.days?.find(d => d.key === dayKey) || null
}

/**
 * Get the color for a day key
 */
export function getDayColor(dayKey) {
  const colors = {
    day1: '#f97316',
    day2: '#3b82f6',
    day3: '#10b981',
    day4: '#ef4444',
    day5: '#8b5cf6',
    day6: '#ec4899',
  }
  return colors[dayKey] || '#f97316'
}

/**
 * Get the emoji for a day key
 */
export function getDayEmoji(dayKey) {
  const emojis = {
    day1: '🏋️',
    day2: '💪',
    day3: '🦵',
    day4: '🔥',
    day5: '🦿',
    day6: '🏃',
  }
  return emojis[dayKey] || '💪'
}

/**
 * FITNESS_GOALS options for the dropdown
 */
export const FITNESS_GOALS = [
  'Build Muscle',
  'Lose Fat',
  'Improve Strength',
  'General Fitness',
  'Athletic Performance',
]
