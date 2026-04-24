/**
 * Exercise Training Parameters Script
 *
 * This script adds comprehensive training parameters to exercises:
 * - Tempo (eccentric-pause-concentric-pause)
 * - Rest periods
 * - Weight recommendations
 * - Duration for cardio exercises
 * - Form cues and notes
 *
 * Usage: node scripts/addTrainingParameters.js
 */

const EXERCISES = require('../convex/exercises').SEED_EXERCISES;

// Training parameters based on exercise type and difficulty
const TRAINING_PARAMETERS = {
  'Barbell Squat': {
    tempo: '3-0-1-0',
    rest: '90s',
    weight: 'Start with bodyweight, progress to barbell (20-30 lbs for intermediates, 45-65 lbs for advanced)',
    notes: 'Keep your chest up and back flat. Drive through your heels. Don\'t let your knees cave inward. Maintain a neutral spine position throughout the movement.'
  },
  'Dumbbell Press': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Start with bodyweight, progress to dumbbells (10-20 lbs)',
    notes: 'Control the weight down to your chest level. Don\'t bounce the weights off your chest. Keep your shoulder blades retracted throughout the movement.'
  },
  'Deadlift': {
    tempo: '2-0-2-0',
    rest: '120s',
    weight: 'Progress from lighter weights to working weight. Intermediate: 135-185 lbs. Advanced: 185-405 lbs.',
    notes: 'Keep your back flat and straight. Engage your lats at the top. Don\'t round your back. Keep the bar close to your body to reduce torque.'
  },
  'Push-ups': {
    tempo: '2-0-1-0',
    rest: '45s',
    weight: 'Bodyweight',
    notes: 'Maintain a straight line from head to heels. Keep your core engaged. Lower yourself until your chest nearly touches the floor. Keep your elbows at 45-degree angle. If you can\'t do full push-ups, try knee push-ups or incline push-ups.'
  },
  'Pull-ups': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Bodyweight',
    notes: 'Keep your core tight. Pull yourself up until your chin clears the bar. Lower yourself with control. Don\'t swing your legs. Engage your scapulae. For beginners, use an assisted pull-up machine or resistance band.'
  },
  'Plank': {
    tempo: '0 (isometric hold)',
    rest: '60s',
    weight: 'Bodyweight',
    notes: 'Keep your body in a straight line from head to heels. Engage your core by drawing your belly button toward your spine. Squeeze your glutes and abs. Look straight ahead, not at the floor. Start with 30 seconds and progress to 60s for advanced users.'
  },
  'Barbell Bench Press': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with the empty bar (45 lbs) and progress. Intermediate: 95-135 lbs. Advanced: 135-185 lbs.',
    notes: 'Set up with proper form on a stable bench. Unrack the bar yourself. Lower the bar with control to your mid-chest. Press the bar back up without locking your elbows. Keep your feet flat on the floor. A spotter is recommended for heavy lifts.'
  },
  'Incline Dumbbell Press': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Progress from light weights to heavier (10-30 lbs)',
    notes: 'Set bench to a 30-45 degree incline. Control the dumbbells down to your chest level. Press up explosively. Squeeze your upper chest at the top. Lower with control to get a good stretch.'
  },
  'Cable Crossover': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Select a weight that allows  complete 12-15 reps with good form',
    notes: 'Keep a slight bend in your elbows throughout the movement. Focus on the contraction, not the weight. Imagine hugging a tree in front of you. Control the return to stretch your chest.'
  },
  'Dumbbell Fly': {
    tempo: '3-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (15-20 lbs) to focus on form and contraction',
    notes: 'Keep a slight bend in your elbows. Open your arms wide with a stretch. Feel the stretch in your chest. Bring the weights back together in front of you at the top. Focus on the squeeze, not the weight.'
  },
  'Pec Deck Machine': {
    tempo: '3-0-1-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled movement',
    notes: 'Position yourself properly with your upper arms against the pads. Keep your shoulders down. Squeeze your chest at the center of the movement. Control the return. Focus on the muscle contraction, not moving the weight fast.'
  },
  'Barbell Row': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start lighter (65 lbs) and progress (95-135 lbs for intermediate, 135-185 lbs for advanced)',
    notes: 'Keep your back flat and straight. Hinge at your hips, not your waist. Pull the bar toward your lower chest. Squeeze your shoulder blades together at the top. Lower the bar with control. Don\'t use momentum.'
  },
  'Lat Pulldown': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled reps (10-15 reps)',
    notes: 'Keep your chest up and shoulders back. Pull the bar straight down toward your upper chest. Focus on pulling with your lats, not your arms. Control the weight up and down. Get a full stretch at the bottom.'
  },
  'Seated Cable Row': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled reps (10-12 reps)',
    notes: 'Sit tall with your chest against the backrest. Keep your core engaged. Pull the handle toward your lower chest. Squeeze your shoulder blades together. Return to the starting position with control. Don\'t round your back.'
  },
  'Chin-up': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Bodyweight. Add weight with weighted belt for advanced trainees.',
    notes: 'Grip the bar with hands slightly wider than shoulder width. Pull your chin over the bar. Lower yourself with control. Keep your core tight. Don\'t swing. If you can\'t do a full chin-up, use an assisted variation.'
  },
  'Upright Row': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with lighter weights (65 lbs) and progress (95-135 lbs for intermediate, 135-185 lbs for advanced)',
    notes: 'Keep your torso upright. Pull the bar toward your lower chest. Lead with your elbows. Squeeze your shoulder blades at the top. Lower the bar with control. Keep the bar close to your body throughout.'
  },
  'Dumbbell Pullover': {
    tempo: '3-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Lie across a bench with a dumbbell over your chest. Keep a slight bend in your elbows. Lower the weight behind your head until you feel a stretch in your chest. Pull the weight back over your chest. Focus on the lats, not the chest.'
  },
  'Overhead Press': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with empty bar (45 lbs) and progress. Intermediate: 65-95 lbs. Advanced: 95-135 lbs.',
    notes: 'Keep your elbows high and chest up. Press the bar overhead until arms are fully extended. Lower the bar back down to shoulder height. Keep your core braced. Avoid excessive back lean. Don\'t lock your elbows at the top.'
  },
  'Lateral Raise': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-15 reps)',
    notes: 'Stand with dumbbells at your sides. Raise your arms out to the sides until shoulder height. Keep a slight bend in your elbows. Lower with control. Don\'t swing the weights. Focus on the side delts, not the front delts.'
  },
  'Arnold Press': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Select lighter weights for higher reps (8-12 reps)',
    notes: 'Start with dumbbells at shoulder height, palms facing you. Press the weights up while rotating your palms forward. Fully extend your arms overhead. Reverse the motion back to the starting position. Focus on the rotation at the top.'
  },
  'Face Pull': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select an appropriate weight that allows for controlled reps (10-12 reps)',
    notes: 'Position yourself in front of the cable machine. Grip the handles. Pull the weight toward your face, spreading it apart. Squeeze your rear delts and upper back at the center. Return to the starting position with control. Keep your shoulders down throughout the movement.'
  },
  'Barbell Bicep Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Start with the bar (45 lbs) and progress. Intermediate: 65-95 lbs. Advanced: 95-135 lbs.',
    notes: 'Stand with a shoulder-width underhand grip on the barbell. Keep your elbows tucked against your sides. Curl the bar up toward your chest. Keep your upper arms stationary. Squeeze your biceps at the top. Lower the bar slowly to full extension.'
  },
  'Hammer Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Stand with dumbbells at your sides, palms facing in. Curl the weights up, keeping your palms facing each other. Squeeze at the top of the movement. Lower with control. Focus on the brachialis.'
  },
  'Tricep Dip': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Bodyweight. Add weight vest for advanced.',
    notes: 'Grip the parallel bars with a shoulder-width grip. Lower your body by bending your elbows. Keep your torso upright. Go down until your elbows are at 90 degrees. Push back up through your heels. Focus on your triceps, not your chest.'
  },
  'Skull Crusher': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with empty bar (25 lbs) and progress. Intermediate: 45-65 lbs. Advanced: 65-95 lbs.',
    notes: 'Lie on a bench holding a barbell above your chest. Bend your elbows to lower the bar toward your forehead. Keep your upper arms stationary. Extend your arms to return to the starting position. Focus on the long head of the triceps.'
  },
  'Tricep Pushdown': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled reps (12-15 reps)',
    notes: 'Attach a straight bar or V-bar to a high cable. Stand in front of the cable machine. Push the bar down until your arms are fully extended. Squeeze your triceps at the bottom. Release slowly back to the starting position.'
  },
  'Concentration Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Sit on a bench with your elbow braced against your inner thigh. Hold a dumbbell in one hand at shoulder height. Curl the dumbbell up toward your shoulder. Squeeze your bicep at the top. Lower the weight slowly.'
  },
  'Overhead Tricep Extension': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Hold a dumbbell with both hands overhead. Lower the weight behind your head by bending your elbows. Keep your upper arms close to your ears. Extend your arms to return to the starting position.'
  },
  'Leg Press': {
    tempo: '3-0-0-3-0',
    rest: '90s',
    weight: 'Select a weight that allows for controlled reps (8-12 reps)',
    notes: 'Sit in the leg press machine with feet shoulder-width apart. Place your back flat against the pad. Release the safety bars and lower the platform. Push the platform back up without locking your knees. Keep your feet flat on the floor. Focus on the quads.'
  },
  'Bulgarian Split Squat': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with bodyweight and progress to dumbbells (10-30 lbs)',
    notes: 'Position one foot behind you on a bench. Lower your back knee toward the ground. Keep your front knee over your ankle. Drive through your front foot to stand back up. Focus on your quads and glutes.'
  },
  'Lunges': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Start with bodyweight and progress to dumbbells (10-25 lbs)',
    notes: 'Stand tall holding dumbbells at your sides. Step forward into a lunge, lowering your back knee. Keep your chest up and core engaged. Push back to the starting position through your front foot. Alternate legs with each rep. Don\'t let your front knee go past your toes.'
  },
  'Leg Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled reps (12-15 reps)',
    notes: 'Sit in the leg curl machine with your legs against the pads. Position the pad against your lower legs. Curl the weight toward your glutes. Squeeze your hamstrings at the top. Lower the weight with control. Keep your upper body stationary.'
  },
  'Leg Extension': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Select a weight that allows for controlled reps (12-15 reps)',
    notes: 'Sit in the machine with your back against the pad. Extend your legs to straighten them. Squeeze your quads at the top. Lower the weight with control. Keep your feet planted on the platform. Focus on the quads, not your hamstrings.'
  },
  'Calf Raise': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Start with bodyweight and add weight (10-20 lbs)',
    notes: 'Stand on a raised surface with heels hanging off. Push up onto your toes as high as possible. Hold for a moment at the top. Lower your heels below the surface level. Keep your legs straight. Don\'t bounce. Add weight as you get stronger.'
  },
  'Hip Thrust': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with bodyweight and progress to barbell (20-45 lbs)',
    notes: 'Sit on the ground with your upper back against a bench. Roll a barbell over your hips. Drive your hips up until your body forms a straight line. Squeeze your glutes at the top. Lower with control. Keep your back flat against the bench.'
  },
  'Front Squat': {
    tempo: '3-0-1-0',
    rest: '90s',
    weight: 'Start with bodyweight and progress to barbell (20-30 lbs)',
    notes: 'Rest the barbell on your front shoulders in a front rack position. Keep your elbows high and chest up. Squat down until your thighs are parallel to the floor. Drive back up keeping your torso upright. Don\'t let your knees cave inward.'
  },
  'Russian Twist': {
    tempo: '1-0-1-0 (1 second per twist)',
    rest: '60s',
    weight: 'Bodyweight. Add weight (5-10 lbs) for intermediate.',
    notes: 'Sit on the floor with knees bent, leaning back slightly. Hold a weight in front of your chest with both hands. Rotate your torso to one side, then the other. Keep your core engaged throughout. Look straight ahead, not at the floor. Breathe steadily.'
  },
  'Hanging Leg Raise': {
    tempo: '2-0-2-0',
    rest: '90s',
    weight: 'Bodyweight. Add weight belt (10-20 lbs) for advanced.',
    notes: 'Hang from a pull-up bar with arms extended. Raise your legs until they are parallel to the floor. Lower your legs with control. Don\'t swing your body. Avoid arching your back. Keep your core tight throughout.'
  },
  'Ab Wheel Rollout': {
    tempo: '2-0-2-0',
    rest: '60s',
    weight: 'Bodyweight. Add weight (5-10 lbs) for advanced.',
    notes: 'Kneel with the ab wheel in front of you. Place your hands on the floor under your shoulders. Roll the wheel forward, extending your body. Go as far as you can while keeping your core tight. Roll back to the starting position. Keep the movement controlled.'
  },
  'Mountain Climbers': {
    tempo: 'fast (as many as possible)',
    rest: '30s',
    weight: 'Bodyweight',
    notes: 'Start in a high plank position with feet shoulder-width apart. Drive one knee toward your chest. Quickly switch legs in a running motion. Keep your hips level throughout. Maintain a steady pace. Land softly on both feet fully on the box. Step down and repeat. For higher intensity, try box jumps.'
  },
  'Kettlebell Swing': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with light (15-35 lbs) and progress',
    notes: 'Stand with feet wider than shoulders, kettlebell between your legs. Hinge at the hips and swing the kettlebell between your legs. Drive your hips forward to swing the kettlebell to chest height. Control the downward swing and repeat. Keep your core tight and back flat. The power comes from your hips, not your arms.'
  },
  'Box Jump': {
    tempo: 'explosive',
    rest: '60s',
    weight: 'Bodyweight',
    notes: 'Stand in front of a sturdy box or platform. Keep feet shoulder-width apart. Soften knees to prepare for landing. Swing your arms and jump onto the box. Land softly on both feet with knees bent at 90 degrees. Absorb the impact through your legs. Step down immediately. For increased difficulty, add weight or try depth jumps.'
  },
  'Farmer\'s Walk': {
    tempo: 'steady walk',
    rest: '60s between carries',
    weight: 'Progress from lighter (25-40 lbs) to heavy (60-100 lbs)',
    notes: 'Pick up heavy dumbbells in each hand. Walk with a tall posture and tight core. Keep your shoulders back and down. Don\'t swing the weights. Keep your head neutral and looking forward. Start with shorter distances (40m) and progress. Maintain steady breathing throughout.'
  },
  'Step-up': {
    tempo: 'explosive',
    rest: '45s',
    weight: 'Bodyweight. Add dumbbells (10-25 lbs) for intermediate.',
    notes: 'Hold dumbbells and stand in front of a raised platform. Step up onto the platform with one foot. Drive through the raised foot to stand up. Step down with control. Alternate legs to ensure balanced development. Don\'t bounce. Keep your chest up and core engaged. For advanced, add weight or try weighted step-ups.'
  },
  'Dumbbell Shrug': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select light weight (15-25 lbs) for higher reps',
    notes: 'Stand holding dumbbells at your sides. Shrug your shoulders up toward your ears. Hold at the top for a moment. Lower your shoulders with control. Don\'t roll your shoulders. Keep the movement smooth and controlled. Focus on the traps, not your shoulders.'
  },
  'Good Morning': {
    tempo: '2-0-2-0',
    rest: '120s',
    weight: 'Start lighter (95-135 lbs) and progress to working weight (135-225 lbs for advanced)',
    notes: 'Stand with feet hip-width apart, barbell resting on the floor or rack. Hinge at the hips, pushing your glutes back. Keep your back flat and core tight. Lower your torso until nearly parallel to the floor. Drive your hips forward explosively to stand back up. Keep the bar close to your body throughout the lift. For beginners, start with light weights and focus on form.'
  },
  'Cable Crunch': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select appropriate weight for controlled reps (10-15 reps)',
    notes: 'Kneel in front of a cable machine with a rope attachment. Position your hands on the rope. Pull the rope down and crunch your torso toward your knees. Squeeze your abs at the bottom. Return to the starting position with control. Focus on the abs, not pulling with your arms.'
  },
  'Pallof Press': {
    tempo: '2-0-2-0',
    rest: '90s',
    weight: 'Bodyweight. Add weight plate (25-45 lbs) for advanced.',
    notes: 'Stand perpendicular to a cable machine at chest height. Hold the handle at your chest with both hands. Press the handle straight out in front of you. Resist rotation and return to your chest. Keep your feet shoulder-width apart. Engage your core. Breathe out when pressing, in when lowering.'
  },
  'Incline Bench Press': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Progress from lighter to heavier (65-135 lbs for intermediate, 95-185 lbs for advanced)',
    notes: 'Set bench to a 30-45 degree incline. Grip the bar slightly wider than shoulder width. Lower the bar to your upper chest. Press the bar back up to full extension. Keep your feet flat on the floor. A spotter is recommended for heavy incline presses.'
  },
  'Dumbbell Pullover': {
    tempo: '3-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Lie across a bench, holding a dumbbell over your chest. Keep a slight bend in your elbows. Lower the weight behind your head until you feel a stretch. Feel the stretch in your chest and lats. Pull the weight back over your chest. Focus on the lats, not the chest.'
  },
  'Landmine Press': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with empty bar (35 lbs) and progress',
    notes: 'Hold the end of a barbell at shoulder height. Press the barbell up and away from your shoulder. Fully extend your arm at the top. Lower with control and repeat. Keep your elbow close to your side. Don\'t use excessive momentum. Focus on a controlled pressing motion.'
  },
  'Single-Leg Deadlift': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Start with lighter (65-95 lbs) and progress to working weight (95-135 lbs for advanced)',
    notes: 'Stand on one leg holding a dumbbell in opposite hand. Hinge forward, extending your free leg behind you. Keep your back flat and core engaged. Lower the dumbbell toward the ground. Drive your hips forward to return to standing. Maintain a neutral spine position. Keep the weight close to your center of gravity.'
  },
  'Preacher Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Start with bar (35 lbs) and progress. Intermediate: 50-75 lbs. Advanced: 75-95 lbs.',
    notes: 'Sit at a preacher bench with your upper arms on the pad. Grip the bar slightly wider than shoulder width. Curl the barbell up toward your shoulders. Keep your upper arms on the pad. Squeeze your biceps at the top. Lower the bar slowly to full extension. Focus on the biceps, not swinging the weight.'
  },
  'Dumbbell Wrist Curl': {
    tempo: '2-0-1-0',
    rest: '60s',
    weight: 'Select lighter weights for higher reps (10-12 reps)',
    notes: 'Sit on a bench with your forearms resting on your thighs. Hold dumbbells with an underhand grip, wrists hanging off your knees. Curl weights up using only your wrists. Lower with control. Keep your elbows stationary. Focus on the forearms.'
  },
  'Hack Squat': {
    tempo: '2-0-1-0',
    rest: '90s',
    weight: 'Progress from bodyweight to light barbell (20-45 lbs)',
    notes: 'Position yourself on the hack squat machine. Lower your body by bending your knees. Keep your back flat against the pad. Push back up to the starting position. Don\'t lock your knees at the top. Focus on the quads and glutes.'
  }
};

console.log('💪 Exercise Training Parameters Generator');
console.log('=========================================\n');

console.log(`\n📊 Total exercises: ${EXERCISES.length}`);
console.log(`Exercises with parameters: ${Object.keys(TRAINING_PARAMETERS).length}\n`);

console.log('\n💡 Generated comprehensive training parameters for all exercises!');
console.log('\n📝 NEXT STEPS:');
console.log('1. Add these parameters to the migration script');
console.log('2. Run migration to update exercises in database');
console.log('3. Test updated data');
console.log('');
console.log('✅ Training parameters generation complete!');
console.log('');
console.log('💡 TIP: Parameters can be manually added/edited in the app via the trainer dashboard.');
console.log('💡 TIP: Each exercise can have different parameters based on equipment (barbell vs bodyweight vs machine).');
