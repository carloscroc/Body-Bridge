
// screens/Classroom/data.ts
import { Course, LiveSession } from './types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'forge-strength-lite',
    title: 'Forge Strength LITE',
    subtitle: 'The fundamental building blocks of movement.',
    description: 'Master the essential movement patterns before loading the bar. This course covers everything from breathing mechanics to the perfect hip hinge.',
    tag: 'LITE',
    tagColor: 'bg-yellow-400 text-black',
    accentColor: 'bg-blue-500',
    author: 'Coach Zaire',
    level: 'Beginner',
    totalDurationMin: 65,
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1: Foundations',
        lessons: [
          { id: 'fsl-01', title: 'Warm-Up: Joints + Breath', kind: 'Video', durationMin: 9, description: 'Learn how to prep your joints for load.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { id: 'fsl-02', title: 'Hip Hinge Mechanics', kind: 'Video', durationMin: 14, description: 'The most important movement in lifting.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        ]
      },
      {
        id: 'phase-2',
        title: 'Phase 2: Patterns',
        lessons: [
          { id: 'fsl-03', title: 'Squat Pattern: Depth + Bracing', kind: 'Video', durationMin: 18, description: 'Achieve full depth safely.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { 
            id: 'fsl-04', 
            title: 'Pressing: Shoulder-Safe Setup', 
            kind: 'Checklist', 
            durationMin: 5, 
            description: 'Checklist for pain-free pressing.',
            checklistItems: [
              'Retract and depress scapula',
              'Create a slight arch in lower back',
              'Plant feet firmly on the floor',
              'Grip the bar just outside shoulder width',
              'Tuck elbows at a 45-degree angle'
            ]
          },
          { id: 'fsl-05', title: 'Core: Anti-Rotation Basics', kind: 'Video', durationMin: 12, description: 'Build a bulletproof core.', locked: true, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        ]
      }
    ]
  },
  {
    id: 'master-files',
    title: 'MASTER FILES',
    subtitle: 'Unlock proprietary tracking spreadsheets.',
    description: 'Get access to the exact tools we use with pro athletes. Track volume, intensity, and recovery metrics.',
    tag: 'CURRICULUM',
    tagColor: 'bg-red-500 text-white',
    accentColor: 'bg-red-500',
    author: 'Head Coach',
    level: 'Advanced',
    totalDurationMin: 45,
    phases: [
      {
        id: 'mf-phase-1',
        title: 'Tracking Systems',
        lessons: [
          { id: 'mf-01', title: 'How To Track: The 4 Numbers', kind: 'Video', durationMin: 11, description: 'The metrics that actually matter.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { 
            id: 'mf-02', 
            title: 'Volume Landmarks (Simple)', 
            kind: 'Video', 
            durationMin: 13, 
            description: 'Find your MEV and MRV.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            resources: [
              { id: 'res-vol-1', title: 'Volume Landmarks PDF', type: 'PDF', url: '#', size: '1.2 MB' }
            ]
          },
          { 
            id: 'mf-03', 
            title: 'Weekly Review: What To Adjust', 
            kind: 'Checklist', 
            durationMin: 5, 
            description: 'Sunday ritual for progress.',
            checklistItems: [
              'Log body weight average for the week',
              'Rate sleep quality (1-10)',
              'Review training videos for form breakdown',
              'Adjust calorie target if weight is stalled',
              'Plan training days for next week'
            ]
          },
          { id: 'mf-04', title: 'Live Clinic: Programming Q&A', kind: 'Live', durationMin: 60, description: 'Recording of our last clinic.', locked: true },
        ]
      }
    ]
  },
  {
    id: 'nutrition-systems',
    title: 'Nutrition Systems',
    subtitle: 'Build a plan you can execute daily.',
    description: 'Stop guessing with your diet. Build a sustainable nutrition plan that fuels performance.',
    tag: 'FUEL',
    tagColor: 'bg-emerald-500 text-black',
    accentColor: 'bg-emerald-500',
    author: 'Dr. Mike',
    level: 'Intermediate',
    totalDurationMin: 90,
    phases: [
      {
        id: 'ns-phase-1',
        title: 'Macros & Energy',
        lessons: [
          { id: 'ns-01', title: 'Protein Targets (No Guessing)', kind: 'Video', durationMin: 9, description: 'Calculate your exact protein needs.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { id: 'ns-02', title: 'Carbs Around Training', kind: 'Video', durationMin: 12, description: 'Timing carbs for maximum output.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { 
            id: 'ns-03', 
            title: 'Meal Templates: 3-Min Setup', 
            kind: 'Checklist', 
            durationMin: 5, 
            description: 'Quick meals for busy days.',
            checklistItems: [
              'Protein source (Pre-cooked chicken/tofu)',
              'Carb source (Rice packet/Bread)',
              'Veggie source (Spinach/Frozen mix)',
              'Fat source (Olive oil/Avocado)',
              'Seasoning (Salt/Pepper/Sauce)'
            ]
          },
          { id: 'ns-04', title: 'Cutting: Hunger Control Playbook', kind: 'Video', durationMin: 14, description: 'How to diet without suffering.', locked: true, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        ]
      }
    ]
  },
  {
    id: 'mindset-strategy',
    title: 'Mindset Strategy',
    subtitle: 'Training focus, adherence, and identity.',
    description: 'The difference between good and great is between the ears.',
    tag: 'FOCUS',
    tagColor: 'bg-blue-600 text-white',
    accentColor: 'bg-blue-600',
    author: 'Coach Zaire',
    level: 'Beginner',
    totalDurationMin: 30,
    phases: [
      {
        id: 'mp-phase-1',
        title: 'Identity Shift',
        lessons: [
          { id: 'mp-01', title: 'Consistency Stack: The 2 Rules', kind: 'Video', durationMin: 8, description: 'Never miss two days in a row.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { id: 'mp-02', title: 'When Motivation Dies', kind: 'Video', durationMin: 11, description: 'Systems over feelings.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
          { 
            id: 'mp-03', 
            title: 'Weekly Reset Checklist', 
            kind: 'Checklist', 
            durationMin: 5, 
            description: 'Get back on track instantly.',
            checklistItems: [
              'Clean out gym bag',
              'Meal prep for Monday/Tuesday',
              'Review goals for the month',
              'Disconnect from screens for 1 hour',
              'Visualize a successful week'
            ]
          },
        ]
      }
    ]
  }
];

export const MOCK_LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'live-01',
    title: 'Q&A: Hypertrophy Blocks',
    instructor: 'Coach Zaire',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    durationMin: 60,
    topic: 'Programming',
    attendeeCount: 142
  },
  {
    id: 'live-02',
    title: 'Form Review: Squat Depth',
    instructor: 'Alex Rivera',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days
    durationMin: 45,
    topic: 'Technique',
    attendeeCount: 89
  }
];
