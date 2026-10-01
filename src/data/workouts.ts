/**
 * Weekly plan built for:
 * - 2 dumbbells + bodyweight only, at home
 * - "skinny-fat" body recomposition: build muscle and lose belly fat together
 * - anterior pelvic tilt (lower back arches, belly pushes forward): strengthen
 *   glutes and deep core, stretch hip flexors. That fixes how the belly *looks*
 *   while the diet and training remove the fat itself.
 *
 * Note: you can't spot-reduce belly fat with crunches. It comes off with an
 * overall calorie deficit, enough protein, strength training and daily steps.
 */

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  cue: string;
  kind: 'dumbbell' | 'bodyweight' | 'cardio' | 'mobility';
};

export type WorkoutDay = {
  title: string;
  focus: string;
  minutes: number;
  type: 'strength' | 'conditioning' | 'recovery' | 'rest';
  exercises: Exercise[];
};

export const PUSHUP_GOAL = 100;

/** Daily 10-minute anterior pelvic tilt fix. Do it every day, even rest days. */
export const POSTURE: Exercise[] = [
  { id: 'pt-couch', name: 'Couch stretch (hip flexors)', sets: 2, reps: '45 s / side', cue: 'Back knee on a pillow against the wall, squeeze the glute of that leg, and keep your ribs down. This is the #1 fix for the arch.', kind: 'mobility' },
  { id: 'pt-tilt', name: 'Posterior pelvic tilt hold', sets: 3, reps: '20 s', cue: 'Lie on your back with knees bent. Flatten your lower back into the floor by tucking your tailbone. Learn this feeling, then use it when standing.', kind: 'mobility' },
  { id: 'pt-deadbug', name: 'Dead bug', sets: 3, reps: '8 / side', cue: 'Keep your lower back glued to the floor the whole time. Exhale fully as you extend the arm and leg. Go slow.', kind: 'mobility' },
  { id: 'pt-bridge', name: 'Glute bridge', sets: 2, reps: '15', cue: 'Tuck your pelvis first, then drive up through your heels. Squeeze your glutes for 2 s at the top. Feel it in the glutes, not the lower back.', kind: 'mobility' },
  { id: 'pt-birddog', name: 'Bird dog', sets: 2, reps: '8 / side', cue: 'Keep your back flat like a table. Reach long with your arm and leg, and don’t let the lower back sag.', kind: 'mobility' },
];

export const WEEK: WorkoutDay[] = [
  {
    title: 'Upper Push + Core',
    focus: 'Chest · Shoulders · Triceps',
    minutes: 40,
    type: 'strength',
    exercises: [
      { id: 'mon-floor-press', name: 'Dumbbell floor press', sets: 4, reps: '10–12', rest: '75 s', cue: 'Lie on the floor with knees bent and lower back flat. Lower until your elbows touch the floor, pause, then press.', kind: 'dumbbell' },
      { id: 'mon-ohp', name: 'Standing dumbbell shoulder press', sets: 3, reps: '8–12', rest: '75 s', cue: 'Squeeze your glutes and brace your abs so your back doesn’t arch as you press.', kind: 'dumbbell' },
      { id: 'mon-pike', name: 'Pike push-ups', sets: 3, reps: '6–10', rest: '60 s', cue: 'Hips high, head travels toward the floor between your hands. Builds shoulders for free.', kind: 'bodyweight' },
      { id: 'mon-skull', name: 'Dumbbell overhead triceps extension', sets: 3, reps: '12', rest: '60 s', cue: 'Hold one dumbbell with both hands. Keep your elbows pointing forward, ribs down.', kind: 'dumbbell' },
      { id: 'mon-rkc', name: 'RKC plank', sets: 3, reps: '20–30 s', rest: '45 s', cue: 'Squeeze glutes and quads hard and pull elbows toward toes. Harder than a normal plank and much better for your pelvic tilt.', kind: 'bodyweight' },
    ],
  },
  {
    title: 'Lower Body + Glutes',
    focus: 'Glutes · Hamstrings · Quads',
    minutes: 40,
    type: 'strength',
    exercises: [
      { id: 'tue-goblet', name: 'Goblet squat', sets: 4, reps: '10–12', rest: '75 s', cue: 'Hold one dumbbell at your chest. Sit between your heels and keep your chest tall.', kind: 'dumbbell' },
      { id: 'tue-rdl', name: 'Dumbbell Romanian deadlift', sets: 4, reps: '10–12', rest: '75 s', cue: 'Push your hips back with soft knees and a flat back. Stop when your hamstrings are stretched, then squeeze your glutes to stand.', kind: 'dumbbell' },
      { id: 'tue-lunge', name: 'Reverse lunge', sets: 3, reps: '10 / leg', rest: '60 s', cue: 'Step back, keep your torso slightly forward, and drive through the front heel.', kind: 'dumbbell' },
      { id: 'tue-hipthrust', name: 'Single-leg glute bridge', sets: 3, reps: '12 / leg', rest: '45 s', cue: 'Tuck your pelvis before lifting. Weak glutes are a big part of anterior pelvic tilt.', kind: 'bodyweight' },
      { id: 'tue-calf', name: 'Dumbbell calf raises', sets: 3, reps: '15–20', rest: '45 s', cue: 'Pause 1 s at the top and lower slowly.', kind: 'dumbbell' },
    ],
  },
  {
    title: 'Active Recovery',
    focus: 'Walk · Mobility',
    minutes: 45,
    type: 'recovery',
    exercises: [
      { id: 'wed-walk', name: 'Brisk walk', sets: 1, reps: '30–45 min', cue: 'Walk fast enough that talking takes some effort. Daily steps burn more belly fat than ab exercises do.', kind: 'cardio' },
      { id: 'wed-catcow', name: 'Cat-cow', sets: 2, reps: '10', cue: 'Slow and controlled. Spend extra time in the rounded “cat” position.', kind: 'mobility' },
      { id: 'wed-hang', name: 'Deep squat hold', sets: 3, reps: '30 s', cue: 'Hold onto a door frame if you need to. Opens up your hips and ankles.', kind: 'mobility' },
    ],
  },
  {
    title: 'Upper Pull + Core',
    focus: 'Back · Biceps · Rear delts',
    minutes: 40,
    type: 'strength',
    exercises: [
      { id: 'thu-row', name: 'One-arm dumbbell row', sets: 4, reps: '10–12 / arm', rest: '60 s', cue: 'Brace one hand on a chair. Pull the dumbbell to your hip, not your chest.', kind: 'dumbbell' },
      { id: 'thu-bentrow', name: 'Bent-over two-arm row', sets: 3, reps: '12', rest: '60 s', cue: 'Hinge forward with a flat back and squeeze your shoulder blades together at the top.', kind: 'dumbbell' },
      { id: 'thu-revfly', name: 'Rear delt fly', sets: 3, reps: '15', rest: '45 s', cue: 'Light weight. Fixes rounded shoulders, which often come with a forward-tilted pelvis.', kind: 'dumbbell' },
      { id: 'thu-curl', name: 'Hammer curls', sets: 3, reps: '10–12', rest: '45 s', cue: 'Elbows pinned to your sides, no swinging.', kind: 'dumbbell' },
      { id: 'thu-hollow', name: 'Hollow body hold', sets: 3, reps: '20–30 s', rest: '45 s', cue: 'Lower back pressed into the floor. If it lifts, bend your knees. Trains the exact core position your posture needs.', kind: 'bodyweight' },
    ],
  },
  {
    title: 'Lower Body + Core',
    focus: 'Single-leg · Glutes · Obliques',
    minutes: 40,
    type: 'strength',
    exercises: [
      { id: 'fri-bss', name: 'Bulgarian split squat', sets: 3, reps: '8–10 / leg', rest: '75 s', cue: 'Back foot on a chair or bed. Lean slightly forward to work the glutes more.', kind: 'dumbbell' },
      { id: 'fri-sldl', name: 'Single-leg Romanian deadlift', sets: 3, reps: '8–10 / leg', rest: '60 s', cue: 'Hips stay square to the floor. Use a wall for balance if needed.', kind: 'dumbbell' },
      { id: 'fri-sumo', name: 'Sumo squat', sets: 3, reps: '12–15', rest: '60 s', cue: 'Wide stance, toes out, push your knees out over your toes.', kind: 'dumbbell' },
      { id: 'fri-sideplank', name: 'Side plank', sets: 3, reps: '25 s / side', rest: '30 s', cue: 'Straight line from head to heels. Push your hips forward a little.', kind: 'bodyweight' },
      { id: 'fri-reverse-crunch', name: 'Reverse crunch', sets: 3, reps: '12', rest: '45 s', cue: 'Curl your pelvis off the floor toward your ribs. Works the lower abs that keep your pelvis tucked.', kind: 'bodyweight' },
    ],
  },
  {
    title: 'Fat-Burn Circuit',
    focus: 'Full body · Conditioning',
    minutes: 30,
    type: 'conditioning',
    exercises: [
      { id: 'sat-thruster', name: 'Dumbbell thrusters', sets: 4, reps: '40 s on / 20 s off', cue: 'Squat, then drive up into an overhead press in one smooth motion.', kind: 'dumbbell' },
      { id: 'sat-renegade', name: 'Renegade rows', sets: 4, reps: '40 s on / 20 s off', cue: 'Plank on the dumbbells, row one side at a time without twisting your hips.', kind: 'dumbbell' },
      { id: 'sat-climbers', name: 'Mountain climbers', sets: 4, reps: '40 s on / 20 s off', cue: 'Keep your hips level with your shoulders. Go fast but controlled.', kind: 'bodyweight' },
      { id: 'sat-swing', name: 'Dumbbell swings', sets: 4, reps: '40 s on / 20 s off', cue: 'Power comes from snapping your hips forward, not from lifting with your arms.', kind: 'dumbbell' },
      { id: 'sat-jacks', name: 'Jumping jacks', sets: 4, reps: '40 s on / 20 s off', cue: 'Land softly. Go through all 5 moves = 1 round; do 4 rounds and rest 1 min between rounds.', kind: 'cardio' },
    ],
  },
  {
    title: 'Rest Day',
    focus: 'Recover · Walk · Stretch',
    minutes: 20,
    type: 'rest',
    exercises: [
      { id: 'sun-walk', name: 'Easy walk', sets: 1, reps: '20–30 min', cue: 'Light movement helps you recover. Aim for 7,000+ steps.', kind: 'cardio' },
      { id: 'sun-prep', name: 'Meal prep for the week', sets: 1, reps: '1 hr', cue: 'Boil eggs, cook adobo, wash veggies. Prepping ahead is how you stay on budget.', kind: 'mobility' },
    ],
  },
];

export const PUSHUP_TIPS = [
  'Split them up: 5 sets of 20, or 10 sets of 10 through the day.',
  'Squeeze your glutes during every push-up. Your body should be one straight line with no sagging hips. This also trains the posture fix.',
  'On push days, do your 100 after the dumbbell work, or on a different part of the day.',
  'When 100 gets easy, slow down the lowering (3 s) instead of doing more reps.',
];
