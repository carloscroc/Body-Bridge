
import React from 'react';
import { Home, Dumbbell, Zap, Utensils, Users, Calendar, Settings } from 'lucide-react';
import { Tab, Workout, Meal, Exercise, Post, Member, UserSettings } from './types';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  units: {
    weight: 'kg',
    height: 'cm',
    distance: 'km'
  },
  notifications: {
    workoutReminders: true,
    workoutReminderTime: '08:00',
    mealPrepAlerts: true,
    communityUpdates: false,
    coachMessages: true
  },
  privacy: {
    visibility: 'Public',
    shareStats: true,
    showOnlineStatus: true
  },
  training: {
    goal: 'Hypertrophy',
    experienceLevel: 'Intermediate',
    trainingDaysPerWeek: 4,
    equipmentAccess: ['Full Gym'],
    injuries: 'None',
    preferredWorkoutTime: 'Morning'
  },
  integrations: {
    appleHealth: false,
    googleFit: false,
    calendarSync: true
  }
};

export const COLORS = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  accent: '#FFFFFF',
  muted: '#8E8E93',
  stroke: 'rgba(255, 255, 255, 0.1)'
};

export const TABS = [
  { id: Tab.HOME, icon: <Home size={20} /> },
  { id: Tab.EXERCISES, icon: <Dumbbell size={20} /> },
  { id: Tab.WORKOUTS, icon: <Zap size={20} /> },
  { id: Tab.MEALS, icon: <Utensils size={20} /> },
  { id: Tab.COMMUNITY, icon: <Users size={20} /> },
];

export const MOCK_EXERCISES: Exercise[] = [
  {
    "id": "lib-264j65otj",
    "name": "3/4 Sit-Up",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lie down on the floor and secure your feet. Your legs should be bent at the knees.",
      "Place your hands behind or to the side of your head. You will begin with your back on the ground. This will be your starting position.",
      "Flex your hips and spine to raise your torso toward your knees.",
      "At the top of the contraction your torso should be perpendicular to the ground. Reverse the motion, going only  of the way down.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-i5zxq1j7x",
    "name": "90/90 Hamstring",
    "category": "stretching",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lie on your back, with one leg extended straight out.",
      "With the other leg, bend the hip and knee to 90 degrees. You may brace your leg with your hands if necessary. This will be your starting position.",
      "Extend your leg straight into the air, pausing briefly at the top. Return the leg to the starting position.",
      "Repeat for 10-20 repetitions, and then switch to the other leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-bddemw8dx",
    "name": "Machine Crunch",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "machine",
    "difficulty": "Beginner",
    "instructions": [
      "Select a light resistance and sit down on the ab machine placing your feet under the pads provided and grabbing the top handles. Your arms should be bent at a 90 degree angle as you rest the triceps on the pads provided. This will be your starting position.",
      "At the same time, begin to lift the legs up as you crunch your upper torso. Breathe out as you perform this movement. Tip: Be sure to use a slow and controlled motion. Concentrate on using your abs to move the weight while relaxing your legs and feet.",
      "After a second pause, slowly return to the starting position as you breathe in.",
      "Repeat the movement for the prescribed amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-0ud5tmmxy",
    "name": "Ab Roller",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Hold the Ab Roller with both hands and kneel on the floor.",
      "Now place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.",
      "Slowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.",
      "After a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-fr4u0brwq",
    "name": "Adductor",
    "category": "stretching",
    "muscleGroup": "adductors",
    "agonistMuscles": [
      "adductors"
    ],
    "equipment": "foam roll",
    "difficulty": "Beginner",
    "instructions": [
      "Lie face down with one leg on a foam roll.",
      "Rotate the leg so that the foam roll contacts against your inner thigh. Shift as much weight onto the foam roll as can be tolerated.",
      "While trying to relax the muscles if the inner thigh, roll over the foam between your hip and knee, holding points of tension for 10-30 seconds. Repeat with the other leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-lwx2xik5w",
    "name": "Adductor/Groin",
    "category": "stretching",
    "muscleGroup": "adductors",
    "agonistMuscles": [
      "adductors"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lie on your back with your feet raised towards the ceiling.",
      "Have your partner hold your feet or ankles. Abduct your legs as far as you can. This will be your starting position.",
      "Attempt to squeeze your legs together for 10 or more seconds, while your partner prevents you from doing so.",
      "Now, relax the muscles in your legs as your partner pushes your feet apart, stretching as far as is comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-cp3g6jzz4",
    "name": "Advanced Kettlebell Windmill",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Clean and press a kettlebell overhead with one arm.",
      "Keeping the kettlebell locked out at all times, push your butt out in the direction of the locked out kettlebell. Keep the non-working arm behind your back and turn your feet out at a forty-five degree angle from the arm with the kettlebell.",
      "Lower yourself as far as possible.",
      "Pause for a second and reverse the motion back to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-h7cavvqjb",
    "name": "Air Bike",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put your hands beside your head. Be careful however to not strain with the neck as you perform it. Now lift your shoulders into the crunch position.",
      "Bring knees up to where they are perpendicular to the floor, with your lower legs parallel to the floor. This will be your starting position.",
      "Now simultaneously, slowly go through a cycle pedal motion kicking forward with the right leg and bringing in the knee of the left leg. Bring your right elbow close to your left knee by crunching to the side, as you breathe out.",
      "Go back to the initial position as you breathe in.",
      "Crunch to the opposite side as you cycle your legs and bring closer your left elbow to your right knee and exhale.",
      "Continue alternating in this manner until all of the recommended repetitions for each side have been completed."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-xc1966mq9",
    "name": "All Fours Quad Stretch",
    "category": "stretching",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Start off on your hands and knees, then lift your leg off the floor and hold the foot with your hand.",
      "Use your hand to hold the foot or ankle, keeping the knee fully flexed, stretching the quadriceps and hip flexors.",
      "Focus on extending your hips, thrusting them towards the floor. Hold for 10-20 seconds and then switch sides."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-n0tl49szj",
    "name": "Alternate Hammer Curl",
    "category": "strength",
    "muscleGroup": "biceps",
    "agonistMuscles": [
      "biceps",
      "brachialis"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso.",
      "The palms of the hands should be facing your torso. This will be your starting position.",
      "While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.",
      "Slowly begin to bring the dumbbells back to starting position as your breathe in.",
      "Repeat the movement with the left hand. This equals one repetition.",
      "Continue alternating in this manner for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-g2c3jg1ci",
    "name": "Alternate Heel Touchers",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lie on the floor with the knees bent and the feet on the floor around 18-24 inches apart. Your arms should be extended by your side. This will be your starting position.",
      "Crunch over your torso forward and up about 3-4 inches to the right side and touch your right heel as you hold the contraction for a second. Exhale while performing this movement.",
      "Now go back slowly to the starting position as you inhale.",
      "Now crunch over your torso forward and up around 3-4 inches to the left side and touch your left heel as you hold the contraction for a second. Exhale while performing this movement and then go back to the starting position as you inhale. Now that both heels have been touched, that is considered 1 repetition.",
      "Continue alternating sides in this manner until all prescribed repetitions are done."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-u5y6nrik5",
    "name": "Alternate Incline Dumbbell Curl",
    "category": "strength",
    "muscleGroup": "biceps",
    "agonistMuscles": [
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Sit down on an incline bench with a dumbbell in each hand being held at arms length. Tip: Keep the elbows close to the torso.This will be your starting position.",
      "While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. As you do so, rotate the hand so that the palm is facing up. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.",
      "Slowly begin to bring the dumbbell back to starting position as your breathe in.",
      "Repeat the movement with the left hand. This equals one repetition.",
      "Continue alternating in this manner for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-7uqoia40x",
    "name": "Alternate Leg Diagonal Bound",
    "category": "plyometrics",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Assume a comfortable stance with one foot slightly in front of the other.",
      "Begin by pushing off with the front leg, driving the opposite knee forward and as high as possible before landing. Attempt to cover as much distance to each side with each bound.",
      "It may help to use a line on the ground to guage distance from side to side.",
      "Repeat the sequence with the other leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-tohubbw2c",
    "name": "Alternating Cable Shoulder Press",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "cable",
    "difficulty": "Beginner",
    "instructions": [
      "Move the cables to the bottom of the tower and select an appropriate weight.",
      "Grasp the cables and hold them at shoulder height, palms facing forward. This will be your starting position.",
      "Keeping your head and chest up, extend through the elbow to press one side directly over head.",
      "After pausing at the top, return to the starting position and repeat on the opposite side."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-oowev515t",
    "name": "Alternating Deltoid Raise",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "In a standing position, hold a pair of dumbbells at your side.",
      "Keeping your elbows slightly bent, raise the weights directly in front of you to shoulder height, avoiding any swinging or cheating.",
      "Return the weights to your side.",
      "On the next repetition, raise the weights laterally, raising them out to your side to about shoulder height.",
      "Return the weights to the starting position and continue alternating to the front and side."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-nxzj25rxk",
    "name": "Alternating Floor Press",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Lie on the floor with two kettlebells next to your shoulders.",
      "Position one in place on your chest and then the other, gripping the kettlebells on the handle with the palms facing forward.",
      "Extend both arms, so that the kettlebells are being held above your chest. Lower one kettlebell, bringing it to your chest and turn the wrist in the direction of the locked out kettlebell.",
      "Raise the kettlebell and repeat on the opposite side."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-lzpm6wx8f",
    "name": "Alternating Hang Clean",
    "category": "strength",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Place two kettlebells between your feet. To get in the starting position, push your butt back and look straight ahead.",
      "Clean one kettlebell to your shoulder and hold on to the other kettlebell in a hanging position. Clean the kettlebell to your shoulder by extending through the legs and hips as you pull the kettlebell towards your shoulders. Rotate your wrist as you do so.",
      "Lower the cleaned kettlebell to a hanging position and clean the alternate kettlebell. Repeat."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-uro7wessm",
    "name": "Alternating Kettlebell Press",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Clean two kettlebells to your shoulders. Clean the kettlebells to your shoulders by extending through the legs and hips as you pull the kettlebells towards your shoulders. Rotate your wrists as you do so.",
      "Press one directly overhead by extending through the elbow, turning it so the palm faces forward while holding the other kettlebell stationary .",
      "Lower the pressed kettlebell to the starting position and immediately press with your other arm."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-vabv9mzr6",
    "name": "Alternating Kettlebell Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Place two kettlebells in front of your feet. Bend your knees slightly and push your butt out as much as possible. As you bend over to get into the starting position grab both kettlebells by the handles.",
      "Pull one kettlebell off of the floor while holding on to the other kettlebell. Retract the shoulder blade of the working side, as you flex the elbow, drawing the kettlebell towards your stomach or rib cage.",
      "Lower the kettlebell in the working arm and repeat with your other arm."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-u3yla5ey8",
    "name": "Alternating Renegade Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Place two kettlebells on the floor about shoulder width apart. Position yourself on your toes and your hands as though you were doing a pushup, with the body straight and extended. Use the handles of the kettlebells to support your upper body. You may need to position your feet wide for support.",
      "Push one kettlebell into the floor and row the other kettlebell, retracting the shoulder blade of the working side as you flex the elbow, pulling it to your side.",
      "Then lower the kettlebell to the floor and begin the kettlebell in the opposite hand. Repeat for several reps."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-dmgasgqoy",
    "name": "Ankle Circles",
    "category": "stretching",
    "muscleGroup": "calves",
    "agonistMuscles": [
      "calves"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Use a sturdy object like a squat rack to hold yourself.",
      "Lift the right leg in the air (just around 2 inches from the floor) and perform a circular motion with the big toe. Pretend that you are drawing a big circle with it. Tip: One circle equals 1 repetition. Breathe normally as you perform the movement.",
      "When you are done with the right foot, then repeat with the left leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-nzgglyyyt",
    "name": "Ankle On The Knee",
    "category": "stretching",
    "muscleGroup": "glutes",
    "agonistMuscles": [
      "glutes"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "From a lying position, bend your knees and keep your feet on the floor.",
      "Place your ankle of one foot on your opposite knee.",
      "Grasp the thigh or knee of the bottom leg and pull both of your legs into the chest. Relax your neck and shoulders. Hold for 10-20 seconds and then switch sides."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-6ycarhvvl",
    "name": "Anterior Tibialis-SMR",
    "category": "stretching",
    "muscleGroup": "calves",
    "agonistMuscles": [
      "calves"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Begin seated on the ground with your legs bent and your feet on the floor.",
      "Using a Muscle Roller or a rolling pin, apply pressure to the muscles on the outside of your shins. Work from just below the knee to above the ankle, pausing at points of tension for 10-30 seconds. Repeat on the other leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-ff3vb2d5l",
    "name": "Anti-Gravity Press",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Place a bar on the ground behind the head of an incline bench.",
      "Lay on the bench face down. With a pronated grip, pick the barbell up from the floor. Flex the elbows, performing a reverse curl to bring the bar near your chest. This will be your starting position.",
      "To begin, press the barbell out in front of your head by extending your elbows. Keep your arms parallel to the ground throughout the movement.",
      "Return to the starting position and repeat to complete the set."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-jeq24n937",
    "name": "Arm Circles",
    "category": "stretching",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up and extend your arms straight out by the sides. The arms should be parallel to the floor and perpendicular (90-degree angle) to your torso. This will be your starting position.",
      "Slowly start to make circles of about 1 foot in diameter with each outstretched arm. Breathe normally as you perform the movement.",
      "Continue the circular motion of the outstretched arms for about ten seconds. Then reverse the movement, going the opposite direction."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-q8zv3zfj2",
    "name": "Arnold Dumbbell Press",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.",
      "Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.",
      "Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.",
      "After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-5bd924swi",
    "name": "Around The Worlds",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Lay down on a flat bench holding a dumbbell in each hand with the palms of the hands facing towards the ceiling. Tip: Your arms should be parallel to the floor and next to your thighs. To avoid injury, make sure that you keep your elbows slightly bent. This will be your starting position.",
      "Now move the dumbbells by creating a semi-circle as you displace them from the initial position to over the head. All of the movement should happen with the arms parallel to the floor at all times. Breathe in as you perform this portion of the movement.",
      "Reverse the movement to return the weight to the starting position as you exhale."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-h4qr4yikp",
    "name": "Atlas Stone Trainer",
    "category": "strongman",
    "muscleGroup": "lower back",
    "agonistMuscles": [
      "lower back"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "This trainer is effective for developing Atlas Stone strength for those who don't have access to stones, and are typically made from bar ends or heavy pipe.",
      "Begin by loading the desired weight onto the bar. Straddle the weight, wrapping your arms around the implement, bending at the hips.",
      "Begin by pulling the weight up past the knees, extending through the hips. As the weight clears the knees, it can be lapped by resting it on your thighs and sitting back, hugging it tightly to your chest.",
      "Finish the movement by extending through your hips and knees to raise the weight as high as possible. The weight can be returned to the lap or to the ground for successive repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-qswk3qnz9",
    "name": "Atlas Stones",
    "category": "strongman",
    "muscleGroup": "lower back",
    "agonistMuscles": [
      "lower back"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Begin with the atlas stone between your feet. Bend at the hips to wrap your arms vertically around the Atlas Stone, attempting to get your fingers underneath the stone. Many stones will have a small flat portion on the bottom, which will make the stone easier to hold.",
      "Pulling the stone into your torso, drive through the back half of your feet to pull the stone from the ground.",
      "As the stone passes the knees, lap it by sitting backward, pulling the stone on top of your thighs.",
      "Sit low, getting the stone high onto your chest as you change your grip to reach over the stone. Stand, driving through with your hips. Close distance to the loading platform, and lean back, extending the hips to get the stone as high as possible."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-5b4gfc5kh",
    "name": "Axle Deadlift",
    "category": "strongman",
    "muscleGroup": "lower back",
    "agonistMuscles": [
      "lower back"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Approach the bar so that it is centered over your feet. You feet should be about hip width apart. Bend at the hip to grip the bar at shoulder width, allowing your shoulder blades to protract. Typically, you would use an over/under grip.",
      "With your feet and your grip set, take a big breath and then lower your hips and flex the knees until your shins contact the bar. Look forward with your head, keep your chest up and your back arched, and begin driving through the heels to move the weight upward.",
      "After the bar passes the knees, aggressively pull the bar back, pulling your shoulder blades together as you drive your hips forward into the bar.",
      "Lower the bar by bending at the hips and guiding it to the floor."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-s3apj9k4x",
    "name": "Back Flyes - With Bands",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Run a band around a stationary post like that of a squat rack.",
      "Grab the band by the handles and stand back so that the tension in the band rises.",
      "Extend and lift the arms straight in front of you. Tip: Your arms should be straight and parallel to the floor while perpendicular to your torso. Your feet should be firmly planted on the floor spread at shoulder width. This will be your starting position.",
      "As you exhale, move your arms to the sides and back. Keep your arms extended and parallel to the floor. Continue the movement until the arms are extended to your sides.",
      "After a pause, go back to the original position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-wwuef90ya",
    "name": "Backward Drag",
    "category": "strongman",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Load a sled with the desired weight, attaching a rope or straps to the sled that you can hold onto.",
      "Begin the exercise by moving backwards for a given distance. Leaning back, extend through the legs for short steps to move as quickly as possible."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-q3eeza6us",
    "name": "Backward Medicine Ball Throw",
    "category": "plyometrics",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "medicine ball",
    "difficulty": "Beginner",
    "instructions": [
      "This exercise is best done with a partner. If you lack a partner, the ball can be thrown and retrieved or thrown against a wall.",
      "Begin standing a few meters in front of your partner, both facing the same direction. Begin holding the ball between your legs.",
      "Squat down and then forcefully reverse direction, coming to full extension and you toss the ball over your head to your partner.",
      "Your partner can then roll the ball back to you. Repeat for the desired number of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-bvsxkdpos",
    "name": "Balance Board",
    "category": "strength",
    "muscleGroup": "calves",
    "agonistMuscles": [
      "calves"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Place a balance board in front of you.",
      "Stand up on it and try to balance yourself.",
      "Hold the balance for as long as desired."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-2fvpidc8a",
    "name": "Ball Leg Curl",
    "category": "strength",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "exercise ball",
    "difficulty": "Beginner",
    "instructions": [
      "Begin on the floor laying on your back with your feet on top of the ball.",
      "Position the ball so that when your legs are extended your ankles are on top of the ball. This will be your starting position.",
      "Raise your hips off of the ground, keeping your weight on the shoulder blades and your feet.",
      "Flex the knees, pulling the ball as close to you as you can, contracting the hamstrings.",
      "After a brief pause, return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-ozqqffvz3",
    "name": "Band Assisted Pull-Up",
    "category": "strength",
    "muscleGroup": "lats",
    "agonistMuscles": [
      "lats"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Choke the band around the center of the pullup bar. You can use different bands to provide varying levels of assistance.",
      "Pull the end of the band down, and place one bent knee into the loop, ensuring it won't slip out. Take a medium to wide grip on the bar. This will be your starting position.",
      "Pull yourself upward by contracting the lats as you flex the elbow. The elbow should be driven to your side. Pull to the front, attempting to get your chin over the bar. Avoid swinging or jerking movements.",
      "After a brief pause, return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-e0q4974pa",
    "name": "Band Good Morning",
    "category": "strength",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Using a 41 inch band, stand on one end, spreading your feet a small amount. Bend at the hips to loop the end of the band behind your neck. This will be your starting position.",
      "Keeping your legs straight, extend through the hips to come to a near vertical position.",
      "Ensure that you do not round your back as you go down back to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-y02ijwk0a",
    "name": "Band Good Morning (Pull Through)",
    "category": "strength",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Loop the band around a post. Standing a little ways away, loop the opposite end around the neck. Your hands can help hold the band in position.",
      "Begin by bending at the hips, getting your butt back as far as possible. Keep your back flat and bend forward to about 90 degrees. Your knees should be only slightly bent.",
      "Return to the starting position be driving through with the hips to come back to a standing position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-8zglx9ym2",
    "name": "Band Hip Adductions",
    "category": "strength",
    "muscleGroup": "adductors",
    "agonistMuscles": [
      "adductors"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Anchor a band around a solid post or other object.",
      "Stand with your left side to the post, and put your right foot through the band, getting it around the ankle.",
      "Stand up straight and hold onto the post if needed. This will be your starting position.",
      "Keeping the knee straight, raise your right legs out to the side as far as you can.",
      "Return to the starting position and repeat for the desired rep count.",
      "Switch sides."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-uerxetpw2",
    "name": "Band Pull Apart",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Begin with your arms extended straight out in front of you, holding the band with both hands.",
      "Initiate the movement by performing a reverse fly motion, moving your hands out laterally to your sides.",
      "Keep your elbows extended as you perform the movement, bringing the band to your chest. Ensure that you keep your shoulders back during the exercise.",
      "Pause as you complete the movement, returning to the starting position under control."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-wwegp8nfx",
    "name": "Band Skullcrusher",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "bands",
    "difficulty": "Beginner",
    "instructions": [
      "Secure a band to the base of a rack or the bench. Lay on the bench so that the band is lined up with your head.",
      "Take hold of the band, raising your elbows so that the upper arm is perpendicular to the floor. With the elbow flexed, the band should be above your head. This will be your starting position.",
      "Extend through the elbow to straighten your arm, keeping your upper arm in place. Pause at the top of the motion, and return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-e9ctsozc4",
    "name": "Dumbbell Skullcrusher",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "dumbbell, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Hold the dumbbells and lay down on a flat bench in such a way that around 1/4 of your head is over the edge.",
      "Stretch your arms with the weights and bend them so that the dumbbells are lowered (make sure they don't touch each other).",
      "Just before they touch your forehead, push them up."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-3qfnqvrwa",
    "name": "Barbell Ab Rollout",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "For this exercise you will need to get into a pushup position, but instead of having your hands of the floor, you will be grabbing on to an Olympic barbell (loaded with 5-10 lbs on each side) instead. This will be your starting position.",
      "While keeping a slight arch on your back, lift your hips and roll the barbell towards your feet as you exhale. Tip: As you perform the movement, your glutes should be coming up, you should be keeping the abs tight and should maintain your back posture at all times. Also your arms should be staying perpendicular to the floor throughout the movement. If you don't, you will work out your shoulders and back more than the abs.",
      "After a second contraction at the top, start to roll the barbell back forward to the starting position slowly as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-msfb9xdv2",
    "name": "Barbell Ab Rollout - On Knees",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Hold an Olympic barbell loaded with 5-10lbs on each side and kneel on the floor.",
      "Now place the barbell on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.",
      "Slowly roll the barbell straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.",
      "After a second pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-hiwy4ct1e",
    "name": "Barbell Bench Press",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "barbell, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
      "From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.",
      "After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-nhn6204mi",
    "name": "Barbell Curl",
    "category": "strength",
    "muscleGroup": "biceps",
    "agonistMuscles": [
      "biceps"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
      "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
      "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
      "Slowly begin to bring the bar back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-mvki1osmy",
    "name": "Barbell Curls Lying Against An Incline",
    "category": "strength",
    "muscleGroup": "biceps",
    "agonistMuscles": [
      "biceps"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Lie against an incline bench, with your arms holding a barbell and hanging down in a horizontal line. This will be your starting position.",
      "While keeping the upper arms stationary, curl the weight up as high as you can while squeezing the biceps. Breathe out as you perform this portion of the movement. Tip: Only the forearms should move. Do not swing the arms.",
      "After a second contraction, slowly go back to the starting position as you inhale. Tip: Make sure that you go all of the way down.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-xrsx1y0z9",
    "name": "Barbell Deadlift",
    "category": "strength",
    "muscleGroup": "lower back",
    "agonistMuscles": [
      "lower back"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand in front of a loaded barbell.",
      "While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.",
      "While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.",
      "Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.",
      "Perform the amount of repetitions prescribed in the program."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-uyhlyddob",
    "name": "Barbell Full Squat",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position.",
      "Begin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-9syjvh4ft",
    "name": "Barbell Glute Bridge",
    "category": "strength",
    "muscleGroup": "glutes",
    "agonistMuscles": [
      "glutes"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.",
      "Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.",
      "Extend as far as possible, then reverse the motion to return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-sef2d9hua",
    "name": "Barbell Guillotine Bench Press",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "barbell, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over your neck with your arms locked. This will be your starting position.",
      "As you breathe in, bring the bar down slowly until it is about 1 inch from your neck.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. It should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-qji2y5zc0",
    "name": "Barbell Hack Squat",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a barbell behind you at arms length and your feet at shoulder width. Tip: A shoulder width grip is best with the palms of your hands facing back. You can use wrist wraps for this exercise for a better grip. This will be your starting position.",
      "While keeping your head and eyes up and back straight, squat until your upper thighs are parallel to the floor. Breathe in as you slowly go down.",
      "Pressing mainly with the heel of the foot and squeezing the thighs, go back up as you breathe out.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-233n3fqia",
    "name": "Barbell Hip Thrust",
    "category": "strength",
    "muscleGroup": "glutes",
    "agonistMuscles": [
      "glutes"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.",
      "Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.",
      "Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-vi8wjexbj",
    "name": "Barbell Incline Bench Press",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "barbell, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
      "As you breathe in, come down slowly until you feel the bar on you upper chest.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-h38ug0zfl",
    "name": "Barbell Incline Shoulder Raise",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Lie back on an Incline Bench. Using a medium width grip (a grip that is slightly wider than shoulder width), lift the bar from the rack and hold it straight over you with your arms straight. This will be your starting position.",
      "While keeping the arms straight, lift the bar by protracting your shoulder blades, raising the shoulders from the bench as you breathe out.",
      "Bring back the bar to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-p9ii8qfrn",
    "name": "Barbell Lunge",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and step forward with your right leg and squat down through your hips, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: Do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. ",
      "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
      "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-lh1pa6nq4",
    "name": "Barbell Rear Delt Row",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a barbell using a wide (higher than shoulder width) and overhand (palms facing your body) grip.",
      "Bend knees slightly and bend over as you keep the natural arch of your back. Let the arms hang in front of you as they hold the bar. Once your torso is parallel to the floor, flare the elbows out and away from your body. Tip: Your torso and your arms should resemble the letter T. Now you are ready to begin the exercise.",
      "While keeping the upper arms perpendicular to the torso, pull the barbell up towards your upper chest as you squeeze the rear delts and you breathe out. Tip: When performed correctly, this exercise should resemble a bench press in reverse. Also, refrain from using your biceps to do the work. Focus on targeting the rear delts; the arms should only act as hooks.",
      "Slowly go back to the initial position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-r6omfsx9o",
    "name": "Barbell Rollout from Bench",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Place a loaded barbell on the ground, near the end of a bench. Kneel with both legs on the bench, and take a medium to narrow grip on the barbell. This will be your starting position.",
      "To begin, extend through the hips to slowly roll the bar forward. As you roll out, flex the shoulder to roll the bar above your head. Ensure that your arms remain extended throughout the movement.",
      "When the bar has been moved as far forward as possible, return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-6dv4bt0qu",
    "name": "Barbell Seated Calf Raise",
    "category": "strength",
    "muscleGroup": "calves",
    "agonistMuscles": [
      "calves"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Place a block about 12 inches in front of a flat bench.",
      "Sit on the bench and place the ball of your feet on the block.",
      "Have someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position.",
      "Raise up on your toes as high as possible as you squeeze the calves and as you breathe out.",
      "After a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-pruqwcgsj",
    "name": "Barbell Shoulder Press",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward).",
      "Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.",
      "Lower the bar down to the shoulders slowly as you inhale.",
      "Lift the bar back up to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-fni9ceowu",
    "name": "Barbell Shrug",
    "category": "strength",
    "muscleGroup": "traps",
    "agonistMuscles": [
      "traps"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position.",
      "Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps.",
      "Slowly return to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-syjtjrwh7",
    "name": "Barbell Shrug Behind The Back",
    "category": "strength",
    "muscleGroup": "traps",
    "agonistMuscles": [
      "traps"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight with your feet at shoulder width as you hold a barbell with both hands behind your back using a pronated grip (palms facing back). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for better grip. This will be your starting position.",
      "Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps. The arms should remain stretched out at all times.",
      "Slowly return to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-mqvqebzjt",
    "name": "Barbell Side Bend",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be shoulder width apart. This will be your starting position.",
      "While keeping your back straight and your head up, bend only at the waist to the right as far as possible. Breathe in as you bend to the side. Then hold for a second and come back up to the starting position as you exhale. Tip: Keep the rest of the body stationary.",
      "Now repeat the movement but bending to the left instead. Hold for a second and come back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-z5nj54qk8",
    "name": "Barbell Side Split Squat",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck). Your feet should be placed wide apart with the foot of the lead leg angled out to the side. This will be your starting position.",
      "Lower your body towards the side of your angled foot by bending the knee and hip of your lead leg and while keeping the opposite leg only slightly bent. Breathe in as you lower your body.",
      "Return to the starting position by extending the hip and knee of the lead leg. Breathe out as you perform this movement.",
      "After performing the recommended amount of reps, repeat the movement with the opposite leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-dysj0zxbv",
    "name": "Barbell Squat",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-wudg45syq",
    "name": "Barbell Squat To A Bench",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first place a flat bench or a box behind you. The flat bench is used to teach you to set your hips back and to hit depth.",
      "",
      "Then, set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and sitting your hips back as you maintain a straight posture with the head up. Continue down until you slightly touch the bench behind you. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs and extend the hips to go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-zlguw3nqs",
    "name": "Barbell Step Ups",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck) and stand upright behind an elevated platform (such as the one used for spotting behind a flat bench). This is your starting position.",
      "Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.",
      "Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.",
      "Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-198q9plbo",
    "name": "Barbell Walking Lunge",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Begin standing with your feet shoulder width apart and a barbell across your upper back.",
      "Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.",
      "Drive through the heel of your lead foot and extend both knees to raise yourself back up.",
      "Step forward with your rear foot, repeating the lunge on the opposite leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-buxtznhj7",
    "name": "Battling Ropes",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "For this exercise you will need a heavy rope anchored at its center 15-20 feet away. Standing in front of the rope, take an end in each hand with your arms extended at your side. This will be your starting position.",
      "Initiate the movement by rapidly raising one arm to shoulder level as quickly as you can.",
      "As you let that arm drop to the starting position, raise the opposite side.",
      "Continue alternating your left and right arms, whipping the ropes up and down as fast as you can."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-z9sm8vfop",
    "name": "Bear Crawl Sled Drags",
    "category": "strongman",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Wearing either a harness or a loose weight belt, attach the chain to the back so that you will be facing away from the sled. Bend down so that your hands are on the ground. Your back should be flat and knees bent. This is your starting position.",
      "Begin by driving with legs, alternating left and right. Use your hands to maintain balance and to help pull. Try to keep your back flat as you move over a given distance."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-18ztvjv8g",
    "name": "Behind Head Chest Stretch",
    "category": "stretching",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Sit upright on the floor with your partner behind you.",
      "Place your hands behind your hand, and push your elbows back as far as you can. Your partner should hold your elbows. This will be your starting position.",
      "Gently attempt to pull your elbows forward with your hands still behind your head for 10 or more seconds. Your partner should prevent your elbows from moving.",
      "Now, relax your muscles and have your partner gently pull the elbows back as far as it comfortable for you. Be sure to let your partner know when the stretch is adequate to prevent overstretching or injury."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-czncio68n",
    "name": "Bench Dips",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "bench",
    "difficulty": "Beginner",
    "instructions": [
      "For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.",
      "Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.",
      "Using your triceps to bring your torso up again, lift yourself back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-qe97v5avb",
    "name": "Bench Jump",
    "category": "plyometrics",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Begin with a box or bench 1-2 feet in front of you. Stand with your feet shoulder width apart. This will be your starting position.",
      "Perform a short squat in preparation for the jump; swing your arms behind you.",
      "Rebound out of this position, extending through the hips, knees, and ankles to jump as high as possible. Swing your arms forward and up.",
      "Jump over the bench, landing with the knees bent, absorbing the impact through the legs.",
      "Turn around and face the opposite direction, then jump back over the bench."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-33g59cuc5",
    "name": "Band Bench Press",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "bands, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Using a flat bench secure a band under the leg of the bench that is nearest to your head.",
      "Once the band is secure, grab it by both handles and lie down on the bench.",
      "Extend your arms so that you are holding the band handles in front of you at shoulder width.",
      "Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
      "Bring down the handles slowly until your elbow forms a 90 degree angle. Keep full control at all times.",
      "As you breathe out, bring the handles up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly.",
      "Repeat the movement for the prescribed amount of repetitions of your training program."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-lqnd48ci2",
    "name": "Barbell Bench Press with Chains",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest",
      "triceps"
    ],
    "equipment": "barbell, bench",
    "difficulty": "Beginner",
    "instructions": [
      "Adjust the leader chain, shortening it to the desired length.Place the chains on the sleeves of the bar.",
      "Lying on the bench, get your head beyond the bar if possible. Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement. However wide your grip, it should cover the ring on the bar.",
      "Pull the bar out of the rack without protracting your shoulders. Focus on squeezing the bar and trying to pull it apart. Lower the bar to your lower chest or upper stomach. The bar, wrist, and elbow should stay in line at all times.",
      "Pause when the barbell touches your torso, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-9vtpg96s4",
    "name": "Bench Sprint",
    "category": "plyometrics",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Stand on the ground with one foot resting on a bench or box with your heel close to the edge.",
      "Push off with your foot on top of the bench, extending through the hip and knee.",
      "Land with the opposite foot on top of the box, returning your other foot back to the start position.",
      "Continue alternating from one foot to another to complete the set."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-4cpzyfyuh",
    "name": "Bent-Arm Barbell Pullover",
    "category": "strength",
    "muscleGroup": "lats",
    "agonistMuscles": [
      "lats"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Lie on a flat bench with a barbell using a shoulder grip width.",
      "Hold the bar straight over your chest with a bend in your arms. This will be your starting position.",
      "While keeping your arms in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.",
      "At that point, bring the barbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.",
      "Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-xsqx3ijht",
    "name": "Bent-Arm Dumbbell Pullover",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Place a dumbbell standing up on a flat bench.",
      "Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well.",
      "Grasp the dumbbell with both hands and hold it straight over your chest with a bend in your arms. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position. Caution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face.",
      "While keeping your arms locked in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.",
      "At that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.",
      "Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-ggzumv4kr",
    "name": "Bent-Knee Hip Raise",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Lay flat on the floor with your arms next to your sides.",
      "Now bend your knees at around a 75 degree angle and lift your feet off the floor by around 2 inches.",
      "Using your lower abs, bring your knees in towards you as you maintain the 75 degree angle bend in your legs. Continue this movement until you raise your hips off of the floor by rolling your pelvis backward. Breathe out as you perform this portion of the movement. Tip: At the end of the movement your knees will be over your chest.",
      "Squeeze your abs at the top of the movement for a second and then return to the starting position slowly as you breathe in. Tip: Maintain a controlled motion at all times.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-ocmfd0sh0",
    "name": "Bent Over Barbell Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
      "Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.",
      "Then inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-ehxtzckkn",
    "name": "Bent Over Dumbbell Rear Delt Raise With Head On Bench",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "Stand up straight while holding a dumbbell in each hand and with an incline bench in front of you.",
      "While keeping your back straight and maintaining the natural arch of your back, lean forward until your forehead touches the bench in front of you. Let the arms hang in front of you perpendicular to the ground. The palms of your hands should be facing each other and your torso should be parallel to the floor. This will be your starting position.",
      "Keeping your torso forward and stationary, and the arms straight with a slight bend at the elbows, lift the dumbbells straight to the side until both arms are parallel to the floor. Exhale as you lift the weights. Caution: avoid swinging the torso or bringing the arms back as opposed to the side.",
      "After a one second contraction at the top, slowly lower the dumbbells back to the starting position.",
      "Repeat the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-nncvfm92e",
    "name": "Bent Over Low-Pulley Side Lateral",
    "category": "strength",
    "muscleGroup": "shoulders",
    "agonistMuscles": [
      "shoulders"
    ],
    "equipment": "cable",
    "difficulty": "Beginner",
    "instructions": [
      "Select a weight and hold the handle of the low pulley with your right hand.",
      "Bend at the waist until your torso is nearly parallel to the floor. Your legs should be slightly bent with your left hand placed on your lower left thigh. Your right arm should be hanging from your shoulder in front of you and with a slight bend at the elbow. This will be your starting position.",
      "Raise your right arm, elbow slightly bent, to the side until the arm is parallel to the floor and in line with your right ear. Breathe out as you perform this step.",
      "Slowly lower the weight back to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions and repeat the movement with the other arm."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-iqrq97u4d",
    "name": "Bent Over One-Arm Long Bar Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Put weight on one of the ends of an Olympic barbell. Make sure that you either place the other end of the barbell in the corner of two walls; or put a heavy object on the ground so the barbell cannot slide backward.",
      "Bend forward until your torso is as close to parallel with the floor as you can and keep your knees slightly bent.",
      "Now grab the bar with one arm just behind the plates on the side where the weight was placed and put your other hand on your knee. This will be your starting position.",
      "Pull the bar straight up with your elbow in (to maximize back stimulation) until the plates touch your lower chest. Squeeze the back muscles as you lift the weight up and hold for a second at the top of the movement. Breathe out as you lift the weight. Tip: Do not allow for any swinging of the torso. Only the arm should move.",
      "Slowly lower the bar to the starting position getting a nice stretch on the lats. Tip: Do not let the plates touch the floor. To ensure the best range of motion, I recommend using small plates (25-lb ones) as opposed to larger plates (like 35-45lb ones).",
      "Repeat for the recommended amount of repetitions and switch arms."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-xvpfn6y9j",
    "name": "Bent Over Two-Arm Long Bar Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Put weight on one of the ends of an Olympic barbell. Make sure that you either place the other end of the barbell in the corner of two walls; or put a heavy object on the ground so the barbell cannot slide backward.",
      "Bend forward until your torso is as close to parallel with the floor as you can and keep your knees slightly bent.",
      "Now grab the bar with both arms just behind the plates on the side where the weight was placed and put your other hand on your knee. This will be your starting position.",
      "Pull the bar straight up with your elbows in (to maximize back stimulation) until the plates touch your lower chest. Squeeze the back muscles as you lift the weight up and hold for a second at the top of the movement. Breathe out as you lift the weight. Tip: Use a stirrup or double handle cable attachment by hooking it under the end of the bar.",
      "Slowly lower the bar to the starting position getting a nice stretch on the lats. Tip: Do not let the plates touch the floor. To ensure the best range of motion, I recommend using small plates (25-lb ones) as opposed to larger plates (like 35-45lb ones).",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-1xnob1ev0",
    "name": "Bent Over Two-Dumbbell Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "With a dumbbell in each hand (palms facing your torso), bend your knees slightly and bring your torso forward by bending at the waist; as you bend make sure to keep your back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
      "While keeping the torso stationary, lift the dumbbells to your side (as you breathe out), keeping the elbows close to the body (do not exert any force with the forearm other than holding the weights). On the top contracted position, squeeze the back muscles and hold for a second.",
      "Slowly lower the weight again to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-fzv0nxq3z",
    "name": "Bent Over Two-Dumbbell Row With Palms In",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "dumbbell",
    "difficulty": "Beginner",
    "instructions": [
      "With a dumbbell in each hand (palms facing each other), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The weights should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
      "While keeping the torso stationary, lift the dumbbells to your side as you breathe out, squeezing your shoulder blades together. On the top contracted position, squeeze the back muscles and hold for a second.",
      "Slowly lower the weight again to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-c0e5vvu5j",
    "name": "Bent Press",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Clean a kettlebell to your shoulder. Clean the kettlebell to your shoulders by extending through the legs and hips as you raise the kettlebell towards your shoulder. The wrist should rotate as you do so. This will be your starting position.",
      "Begin my leaning to the side opposite the kettlebell, continuing until you are able to touch the ground with your free hand, keeping your eyes on the kettlebell. As you do so, press the weight vertically be extending through the elbow, keeping your arm perpendicular to the ground.",
      "Return to an upright position, with the kettlebell above your head. Return the kettlebell to the shoulder and repeat for the desired number of repetitions."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-g49t63s8q",
    "name": "Bicycling",
    "category": "cardio",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "To begin, seat yourself on the bike and adjust the seat to your height."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-9rbv0ay7l",
    "name": "Bicycling, Stationary",
    "category": "cardio",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "machine",
    "difficulty": "Beginner",
    "instructions": [
      "To begin, seat yourself on the bike and adjust the seat to your height.",
      "Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-nud90w27l",
    "name": "Board Press",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "barbell",
    "difficulty": "Beginner",
    "instructions": [
      "Begin by lying on the bench, getting your head beyond the bar if possible. One to five boards, made out of 2x6's, can be screwed together and held in place by a training partner, bands, or just tucked under your shirt.",
      "Tuck your feet underneath you and arch your back. Using the bar to help support your weight, lift your shoulder off the bench and retract them, squeezing the shoulder blades together. Use your feet to drive your traps into the bench. Maintain this tight body position throughout the movement.",
      "You can take a standard bench grip, or shoulder width to focus on the triceps. Pull the bar out of the rack without protracting your shoulders. The bar, wrist, and elbow should stay in line at all times. Focus on squeezing the bar and trying to pull it apart.",
      "Lower the bar to the boards, and then drive the bar up with as much force as possible. The elbows should be tucked in until lockout."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-mam2fmaz4",
    "name": "Body-Up",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Assume a plank position on the ground. You should be supporting your bodyweight on your toes and forearms, keeping your torso straight. Your forearms should be shoulder-width apart. This will be your starting position.",
      "Pressing your palms firmly into the ground, extend through the elbows to raise your body from the ground. Keep your torso rigid as you perform the movement.",
      "Slowly lower your forearms back to the ground by allowing the elbows to flex.",
      "Repeat."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-lizm31nhy",
    "name": "Body Tricep Press",
    "category": "strength",
    "muscleGroup": "triceps",
    "agonistMuscles": [
      "triceps"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Position a bar in a rack at chest height.",
      "Standing, take a shoulder width grip on the bar and step a yard or two back, feet together and arms extended so that you are leaning on the bar. This will be your starting position.",
      "Begin by flexing the elbow, lowering yourself towards the bar.",
      "Pause, and then reverse the motion by extending the elbows.",
      "Progress from bodyweight by adding chains over your shoulders."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-4c7z040qf",
    "name": "Bodyweight Flyes",
    "category": "strength",
    "muscleGroup": "chest",
    "agonistMuscles": [
      "chest"
    ],
    "equipment": "ez curl bar",
    "difficulty": "Beginner",
    "instructions": [
      "Position two equally loaded EZ bars on the ground next to each other. Ensure they are able to roll.",
      "Assume a push-up position over the bars, supporting your weight on your toes and hands with your arms extended and body straight.",
      "Place your hands on the bars. This will be your starting position.",
      "Using a slow and controlled motion, move your hands away from the midline of your body, rolling the bars apart. Inhale during this portion of the motion.",
      "After moving the bars as far apart as you can, return to the starting position by pulling them back together. Exhale as you perform this movement."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-pgvcyqa7x",
    "name": "Bodyweight Mid Row",
    "category": "strength",
    "muscleGroup": "middle back",
    "agonistMuscles": [
      "middle back"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Begin by taking a medium to wide grip on a pull-up apparatus with your palms facing away from you. From a hanging position, tuck your knees to your chest, leaning back and getting your legs over your side of the pull-up apparatus. This will be your starting position.",
      "Beginning with your arms straight, flex the elbows and retract the shoulder blades to raise your body up until your legs contact the pull-up apparatus.",
      "After a brief pause, return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-tzrxhx0lj",
    "name": "Bodyweight Squat",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.",
      "Begin the movement by flexing your knees and hips, sitting back with your hips.",
      "Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-vu0wny2w5",
    "name": "Bodyweight Walking Lunge",
    "category": "strength",
    "muscleGroup": "quads",
    "agonistMuscles": [
      "quads"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Begin standing with your feet shoulder width apart and your hands on your hips.",
      "Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.",
      "Drive through the heel of your lead foot and extend both knees to raise yourself back up.",
      "Step forward with your rear foot, repeating the lunge on the opposite leg."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-pusfa2k1d",
    "name": "Bosu Ball Cable Crunch With Side Bends",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "cable",
    "difficulty": "Beginner",
    "instructions": [
      "Connect a standard handle to each arm of a cable machine, and position them in the most downward position.",
      "Grab a Bosu Ball and position it in front and center of the cable machine.",
      "Lie down on the Bosu Ball with the small of your back arched around the ball. Your rear end should be close to the floor without touching it.",
      "With both hands, reach back and grab the handle of each cable.",
      "With your feet positioned in a wide stance, extend your arms straight out in front of you and in between your knees. Your hands should be at knee level.",
      "Keep your arms straight and in-line with the upward angle of the cable. Elevate your torso in a crunching motion without dropping or bending your arms.",
      "Maintain the rigid position with your arms. Slowly descend back to the starting position with your back arched around the Bosu Ball and your abdominals elongated.",
      "Repeat the same series of movements to failure.",
      "Once you reach failure, keep your abs tight and raise your torso into plank position so your back is elevated off the Bosu Ball.",
      "Lower your arms down to your side; keep them straight. Start doing alternating side bends; reach for your heels! This finishing movement will focus on your obliques."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-dzc6eabkf",
    "name": "Bottoms-Up Clean From The Hang Position",
    "category": "strength",
    "muscleGroup": "forearms",
    "agonistMuscles": [
      "forearms"
    ],
    "equipment": "kettlebell",
    "difficulty": "Beginner",
    "instructions": [
      "Initiate the exercise by standing upright with a kettlebell in one hand.",
      "Swing the kettlebell back forcefully and then reverse the motion forcefully. Crush the kettlebell handle as hard as possible and raise the kettlebell to your shoulder."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-93fjq09qr",
    "name": "Bottoms Up",
    "category": "strength",
    "muscleGroup": "abs",
    "agonistMuscles": [
      "abs"
    ],
    "equipment": "none",
    "difficulty": "Beginner",
    "instructions": [
      "Begin by lying on your back on the ground. Your legs should be straight and your arms at your side. This will be your starting position.",
      "To perform the movement, tuck the knees toward your chest by flexing the hips and knees. Following this, extend your legs directly above you so that they are perpendicular to the ground. Rotate and elevate your pelvis to raise your glutes from the floor.",
      "After a brief pause, return to the starting position."
    ],
    "reps": "10-12",
    "image": ""
  },
  {
    "id": "lib-3c8iqq386",
    "name": "Box Jump (Multiple Response)",
    "category": "plyometrics",
    "muscleGroup": "hamstrings",
    "agonistMuscles": [
      "hamstrings"
    ],
    "equipment": "other",
    "difficulty": "Beginner",
    "instructions": [
      "Assume a relaxed stance facing the box or platform approximately an arm's length away. Arms should be down at the sides and legs slightly bent.",
      "Using the arms to aid in the initial burst, jump upward and forward, landing with feet simultaneously on top of the box or platform.",
      "Immediately drop or jump back down to the original starting place; then repeat the sequence."
    ],
    "reps": "10-12",
    "image": ""
  }
];

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: '1',
    title: '20 Minutes, Practicing Punches As Fast As The Wind',
    coach: 'Zaire Septimus',
    duration: '20 min',
    intensity: 'Hard',
    kcal: 320,
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80&w=800',
    description: 'Master the art of rapid-fire combinations in this high-intensity boxing masterclass.',
    focus: ['Total-Body Strength', 'Core', 'Stability'],
    equipment: ['Boxing Gloves', 'Heavy Bag', 'Hand Wraps'],
    coachNotes: 'Focus on hip rotation and breath timing. Your power comes from the ground, not just your shoulders. Stay light on your toes during transitions.',
    exercises: [
      { ...MOCK_EXERCISES[3], name: 'Dynamic Warmup', duration: '3:00' },
      { ...MOCK_EXERCISES[4], name: 'Speed Bag Drills', duration: '2:00' },
      { ...MOCK_EXERCISES[1], name: 'Iso-Chest Press', reps: '15 Reps' },
      { ...MOCK_EXERCISES[3], name: 'Shadow Boxing Phase', duration: '5:00' },
      { ...MOCK_EXERCISES[4], name: 'Heavy Bag Finisher', duration: '4:00' }
    ]
  },
  {
    id: '2',
    title: '30 Minutes Training The Thigh Muscles',
    coach: 'Sarah Power',
    duration: '30 min',
    intensity: 'Medium',
    kcal: 280,
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&q=80&w=800',
    description: 'Sculpt and strengthen your lower body with explosive movements designed to build functional leg power.',
    focus: ['Lower Body', 'Glutes', 'Quadriceps'],
    equipment: ['Barbell', 'Weight Plates', 'Squat Rack'],
    coachNotes: 'Keep your chest up and heels planted. Depth is key, but maintain a flat back at all times. Squeeze glutes at the top of every rep.',
    exercises: [
      { ...MOCK_EXERCISES[0], name: 'Barbell Back Squats', reps: '12 Reps' },
      { ...MOCK_EXERCISES[2], name: 'Conventional Deadlift', reps: '8 Reps' },
      { ...MOCK_EXERCISES[0], name: 'Tempo Squats', reps: '10 Reps' },
      { ...MOCK_EXERCISES[2], name: 'Romanian Deadlift', reps: '12 Reps' }
    ]
  },
  {
    id: '3',
    title: '40-Minute Core and Mobility Flow',
    coach: 'Nova',
    duration: '40 min',
    intensity: 'Medium',
    kcal: 260,
    image: 'https://images.unsplash.com/photo-1551039155-0a017db9a7f5?auto=format&fit=crop&q=80&w=800',
    description: 'A flow-based session focusing on core strength and flexible mobility.',
    focus: ['Core', 'Mobility'],
    equipment: ['Yoga Mat'],
    coachNotes: 'Breath with movement. Move through transitions smoothly and control tempo to build durability.',
    exercises: [
      { ...MOCK_EXERCISES[3], name: 'Core Activation', duration: '4:00' },
      { ...MOCK_EXERCISES[0], name: 'Goblet Squat Warmup', duration: '3:00' },
      { ...MOCK_EXERCISES[4], name: 'Dynamic Stretch', duration: '4:00' }
    ]
  }
];

export const MOCK_MEALS: Meal[] = [
  {
    id: '1',
    title: 'Grilled Salmon with Quinoa',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800',
    calories: 450,
    protein: 35,
    carbs: 42,
    fats: 18,
    prepTime: '25 min',
    tags: ['High Protein', 'Gluten Free'],
    ingredients: ['Salmon fillet', 'Quinoa', 'Asparagus', 'Lemon', 'Olive oil'],
    instructions: ['Rinse quinoa', 'Grill salmon for 6 mins per side', 'Steam asparagus'],
    servings: 1
  },
  {
    id: '2',
    title: 'Avocado Energy Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    calories: 380,
    protein: 12,
    carbs: 55,
    fats: 22,
    prepTime: '15 min',
    tags: ['Vegan', 'Heart Healthy'],
    ingredients: ['Avocado', 'Brown rice', 'Black beans', 'Corn', 'Lime'],
    instructions: ['Slice avocado', 'Mix warm rice with beans', 'Squeeze lime over top'],
    servings: 1
  },
  {
    id: '3',
    title: 'Mediterranean Chickpea Bowl',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
    calories: 420,
    protein: 18,
    carbs: 60,
    fats: 14,
    prepTime: '20 min',
    tags: ['Vegan', 'High Fiber'],
    ingredients: ['Chickpeas', 'Cucumber', 'Cherry tomatoes', 'Hummus', 'Tahini'],
    instructions: ['Drain chickpeas', 'Chop vegetables', 'Drizzle with tahini'],
    servings: 1
  },
  {
    id: '4',
    title: 'Herbed Chicken Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800',
    calories: 480,
    protein: 40,
    carbs: 42,
    fats: 14,
    prepTime: '30 min',
    tags: ['Gluten Free', 'High Protein'],
    ingredients: ['Chicken breast', 'Quinoa', 'Kale', 'Garlic', 'Rosemary'],
    instructions: ['Sauté chicken with herbs', 'Cook quinoa', 'Massage kale with olive oil'],
    servings: 1
  },
  {
    id: '5',
    title: 'Tofu Stir-Fry with Veggies',
    image: 'https://images.unsplash.com/photo-1552566620-8a69a6058b2c?auto=format&fit=crop&q=80&w=800',
    calories: 360,
    protein: 22,
    carbs: 48,
    fats: 8,
    prepTime: '25 min',
    tags: ['Vegetarian', 'Dairy Free'],
    ingredients: ['Firm tofu', 'Broccoli', 'Bell peppers', 'Ginger', 'Soy sauce'],
    instructions: ['Press tofu to remove water', 'Stir fry veggies', 'Toss with soy sauce'],
    servings: 2
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
    content: 'Just smashed my 5K PB! Feeling incredible. Consistency is key guys! 🔥',
    likes: 24,
    comments: 5,
    time: '2h ago'
  },
  {
    id: '2',
    author: 'Elena Smith',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    content: 'Which protein powder do you all recommend? Looking for something that actually tastes good.',
    likes: 12,
    comments: 18,
    time: '4h ago'
  }
];

// Mock members for the Members feature
export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Alex Carter',
    avatar: 'https://i.pravatar.cc/150?img=11',
    role: 'Coach',
    joinedDate: '2021-03-12',
    lastActive: '2026-02-10',
    status: 'online',
    bio: 'Seasoned trainer focused on mobility and strength with a data-driven approach.',
    location: 'Chicago, IL',
    stats: {
      workoutsCompleted: 540,
      streakDays: 120,
      weightLiftedKg: 1800,
    },
    goals: ['Athlete Optimization', 'Yoga for Mobility'],
    settings: DEFAULT_SETTINGS,
    badges: ['Early Bird', 'Team Leader'],
  },
  {
    id: 'm2',
    name: 'Mira Patel',
    avatar: 'https://i.pravatar.cc/150?img=22',
    role: 'Admin',
    joinedDate: '2019-11-01',
    lastActive: '2026-02-09',
    status: 'online',
    bio: 'Operations lead and community organizer ensuring everything runs smoothly.',
    location: 'Austin, TX',
    stats: {
      workoutsCompleted: 820,
      streakDays: 200,
      weightLiftedKg: 0,
    },
    goals: ['Community Growth', 'Platform Reliability'],
    settings: DEFAULT_SETTINGS,
    badges: ['Admin Core'],
  },
  {
    id: 'm3',
    name: 'Luis Romero',
    avatar: 'https://i.pravatar.cc/150?img=33',
    role: 'Member',
    joinedDate: '2024-06-20',
    lastActive: '2026-02-07',
    status: 'offline',
    bio: 'Runner who loves interval training and timeboxing for peak performance.',
    location: 'Madrid, ES',
    stats: {
      workoutsCompleted: 210,
      streakDays: 34,
      weightLiftedKg: 120,
    },
    goals: ['Run 5K under 20 min'],
    settings: DEFAULT_SETTINGS,
    badges: ['Consistency King'],
  },
  {
    id: 'm4',
    name: 'Jin Park',
    avatar: 'https://i.pravatar.cc/150?img=44',
    role: 'Coach',
    joinedDate: '2022-02-15',
    lastActive: '2026-02-10',
    status: 'training',
    bio: 'Kettlebell guru prioritizing grip strength and hip hinge mechanics.',
    location: 'Seoul, KR',
    stats: {
      workoutsCompleted: 350,
      streakDays: 68,
      weightLiftedKg: 1600,
    },
    goals: ['Master Swing', 'Technique Master'],
    settings: DEFAULT_SETTINGS,
    badges: ['Heavy Lifters'],
  },
  {
    id: 'm5',
    name: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/150?img=55',
    role: 'Member',
    joinedDate: '2020-08-30',
    lastActive: '2026-02-08',
    status: 'online',
    bio: 'Yoga and mindful movement advocate exploring balance and flexibility.',
    location: 'Bengaluru, IN',
    stats: {
      workoutsCompleted: 500,
      streakDays: 90,
      weightLiftedKg: 0,
    },
    goals: ['Improve flexibility'],
    settings: DEFAULT_SETTINGS,
    badges: ['Mindful Mover'],
  },
  {
    id: 'm6',
    name: 'Daniel Kim',
    avatar: 'https://i.pravatar.cc/150?img=66',
    role: 'Coach',
    joinedDate: '2021-01-22',
    lastActive: '2026-02-06',
    status: 'online',
    bio: 'Strength and conditioning coach with a data-driven approach to training.',
    location: 'Vancouver, CA',
    stats: {
      workoutsCompleted: 1200,
      streakDays: 300,
      weightLiftedKg: 2100,
    },
    goals: ['S&C for endurance'],
    settings: DEFAULT_SETTINGS,
    badges: ['Coach of the Year'],
  },
  {
    id: 'm7',
    name: 'Ava Rossi',
    avatar: 'https://i.pravatar.cc/150?img=7',
    role: 'Admin',
    joinedDate: '2018-05-14',
    lastActive: '2026-02-09',
    status: 'online',
    bio: 'Community manager and events lead driving engagement and challenges.',
    location: 'Rome, IT',
    stats: {
      workoutsCompleted: 760,
      streakDays: 150,
      weightLiftedKg: 0,
    },
    goals: ['Community Growth'],
    settings: DEFAULT_SETTINGS,
    badges: ['Event Pro'],
  },
  {
    id: 'm8',
    name: 'Noah Williams',
    avatar: 'https://i.pravatar.cc/150?img=8',
    role: 'Member',
    joinedDate: '2021-11-02',
    lastActive: '2026-02-10',
    status: 'online',
    bio: 'CrossFit enthusiast who loves interval runs and metcon workouts.',
    location: 'New York, NY',
    stats: {
      workoutsCompleted: 190,
      streakDays: 20,
      weightLiftedKg: 170,
    },
    goals: ['RX Elite'],
    settings: DEFAULT_SETTINGS,
    badges: ['Rookie'],
  },
  {
    id: 'm9',
    name: 'Emma Chen',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'Member',
    joinedDate: '2025-01-09',
    lastActive: '2026-02-10',
    status: 'online',
    bio: 'Triathlete focusing on cycling training and brick workouts.',
    location: 'Singapore',
    stats: {
      workoutsCompleted: 75,
      streakDays: 12,
      weightLiftedKg: 60,
    },
    goals: ['Finish Ironman'],
    settings: DEFAULT_SETTINGS,
    badges: ['Newbie Minute'],
  },
  {
    id: 'm10',
    name: 'Carlos Ruiz',
    avatar: 'https://i.pravatar.cc/150?img=13',
    role: 'Member',
    joinedDate: '2022-09-18',
    lastActive: '2026-02-05',
    status: 'training',
    bio: 'Weekend warrior who loves outdoor bootcamps and trail runs.',
    location: 'Madrid, ES',
    stats: {
      workoutsCompleted: 340,
      streakDays: 95,
      weightLiftedKg: 95,
    },
    goals: ['Outdoor Bootcamps'],
    settings: DEFAULT_SETTINGS,
    badges: ['Outdoor Lover'],
  },
  {
    id: 'm11',
    name: 'Sophie Laurent',
    avatar: 'https://i.pravatar.cc/150?img=14',
    role: 'Coach',
    joinedDate: '2020-02-11',
    lastActive: '2026-02-10',
    status: 'online',
    bio: 'Mobility and progressive overload specialist helping athletes move better.',
    location: 'Paris, FR',
    stats: {
      workoutsCompleted: 680,
      streakDays: 210,
      weightLiftedKg: 0,
    },
    goals: ['Mobility Flow'],
    settings: DEFAULT_SETTINGS,
    badges: ['Mobility Master'],
  },
  {
    id: 'm12',
    name: 'Kai Nakamura',
    avatar: 'https://i.pravatar.cc/150?img=15',
    role: 'Member',
    joinedDate: '2021-07-04',
    lastActive: '2026-02-10',
    status: 'offline',
    bio: 'Calisthenics lover focusing on bodyweight skills and mobility.',
    location: 'Tokyo, JP',
    stats: {
      workoutsCompleted: 240,
      streakDays: 60,
      weightLiftedKg: 0,
    },
    goals: ['Handstand Pro'],
    settings: DEFAULT_SETTINGS,
    badges: ['Calisthenics'],
  },
  {
    id: 'm13',
    name: 'Yara Haddad',
    avatar: 'https://i.pravatar.cc/150?img=16',
    role: 'Member',
    joinedDate: '2023-04-12',
    lastActive: '2026-02-09',
    status: 'online',
    bio: 'Nutrition nerd and meal-prep enthusiast who loves healthy meals.',
    location: 'Beirut, LBN',
    stats: {
      workoutsCompleted: 150,
      streakDays: 18,
      weightLiftedKg: 0,
    },
    goals: ['Protein Pixel'],
    settings: DEFAULT_SETTINGS,
    badges: ['Nutrition Nerd'],
  },
  {
    id: 'm14',
    name: 'Liam Oconnor',
    avatar: 'https://i.pravatar.cc/150?img=17',
    role: 'Member',
    joinedDate: '2019-09-01',
    lastActive: '2026-02-08',
    status: 'offline',
    bio: 'Boxing and cardio enthusiast tracking VO2 max with regular runs.',
    location: 'Dublin, IE',
    stats: {
      workoutsCompleted: 920,
      streakDays: 240,
      weightLiftedKg: 0,
    },
    goals: ['Cardio King'],
    settings: DEFAULT_SETTINGS,
    badges: ['Endurance Fan'],
  },
  {
    id: 'm15',
    name: 'Zoe Martins',
    avatar: 'https://i.pravatar.cc/150?img=18',
    role: 'Admin',
    joinedDate: '2017-03-22',
    lastActive: '2026-02-08',
    status: 'online',
    bio: 'Community and content lead who runs monthly challenges and events.',
    location: 'Lisbon, PT',
    stats: {
      workoutsCompleted: 1100,
      streakDays: 400,
      weightLiftedKg: 0,
    },
    goals: ['Challenge Creator'],
    settings: DEFAULT_SETTINGS,
    badges: ['Community Hero'],
  },
];
