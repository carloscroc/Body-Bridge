
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
  { id: 'fitness-weighted-squat', name: 'Barbell Squat', image: 'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&q=80&w=400', category: 'Strength', muscleGroup: 'Legs', agonistMuscles: ['Quadriceps femoris', 'Gluteus maximus'], equipment: 'Barbell', difficulty: 'Intermediate', reps: '12 Reps' },
  { id: 'fitness-dumbbell-floor-press', name: 'Dumbbell Press', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400', category: 'Strength', muscleGroup: 'Chest', agonistMuscles: ['Pectoralis major', 'Anterior deltoid', 'Triceps brachii'], equipment: 'Dumbbell', difficulty: 'Beginner', reps: '10 Reps' },
  { id: 'fitness-sumo-deadlift', name: 'Deadlift', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=400', category: 'Power', muscleGroup: 'Back', agonistMuscles: ['Gluteus maximus', 'Erector spinae', 'Biceps femoris'], equipment: 'Barbell', difficulty: 'Advanced', reps: '8 Reps' },
  { id: 'fitness-rope-jumping', name: 'Shadow Boxing', image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=400', category: 'Cardio', muscleGroup: 'Full Body', agonistMuscles: ['Deltoid (anterior, lateral)', 'Pectoralis major'], equipment: 'None', difficulty: 'Beginner', duration: '3 Min' },
  { id: 'fitness-heavy-bag-thrust', name: 'Speed Bag', image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400', category: 'Power', muscleGroup: 'Shoulders', agonistMuscles: ['Deltoid (anterior, lateral)'], equipment: 'Speed Bag', difficulty: 'Beginner', duration: '2 Min' }
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
