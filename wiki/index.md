# Forge Project - LLM Wiki

**Interlinked Knowledge Base for the Forge Fitness Application**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [API Documentation](#api-documentation)
5. [Data Models](#data-models)
6. [Workflows](#workflows)
7. [Decisions](#decisions)
8. [Problems Solved](#problems-solved)
9. [Lessons Learned](#lessons-learned)

---

## Project Overview

### What is Forge?

Forge is a comprehensive fitness and workout application built with modern web technologies. It provides users with:

- **Personalized workout planning**
- **Exercise library and tracking**
- **Progress monitoring**
- **AI-powered coaching**
- **Community features**
- **Premium subscription features**

### Tech Stack

**Frontend**:
- React (TypeScript)
- Vite
- Tailwind CSS
- shadcn/ui components

**Backend**:
- Convex (backend-as-a-service)
- Real-time data synchronization
- Serverless functions

**Development**:
- Playwright (testing)
- Git (version control)

### Project Structure

```
Forge/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── hooks/          # Custom React hooks
│   └── players/        # Video player components
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   ├── auth.ts         # Authentication
│   ├── exercises.ts    # Exercise management
│   └── programs.ts     # Workout programs
├── public/             # Static assets
└── wiki/              # This documentation
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │    Hooks     │  │     UI       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Convex Client
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Convex Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Database   │  │  Functions   │  │   Auth       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → React Component
2. **Component** → Convex Client
3. **Convex Client** → Convex Backend
4. **Convex Backend** → Database/Functions
5. **Response** → Convex Client
6. **Update** → React Component

### Key Architectural Decisions

- **Convex for Backend**: Chosen for real-time sync and serverless simplicity
- **TypeScript**: For type safety across the stack
- **shadcn/ui**: For consistent, accessible UI components
- **Tailwind CSS**: For rapid styling and customization

---

## Components

### Core Components

#### WorkoutBuilder

**Purpose**: Allows users to create and customize workout routines

**Key Features**:
- Exercise selection
- Set and rep configuration
- Rest time management
- Workout preview

**Related Files**:
- `components/WorkoutBuilderWorkspace.tsx`
- `components/CreateWorkout.tsx`
- `components/ExercisePicker.tsx`

**See Also**: [Workflows](#workflows), [API Documentation](#api-documentation)

---

#### ProgramBuilder

**Purpose**: Creates multi-day workout programs

**Key Features**:
- Day-by-day planning
- Exercise progression
- Program templates
- Custom scheduling

**Related Files**:
- `components/ProgramBuilder.tsx`
- `convex/programs.ts`

**See Also**: [Data Models](#data-models), [Workflows](#workflows)

---

#### TrainingArchitect

**Purpose**: AI-powered workout planning and recommendations

**Key Features**:
- Intelligent exercise selection
- Personalized recommendations
- Progress tracking
- Adaptive planning

**Related Files**:
- `components/TrainingArchitect.tsx`
- `convex/aiChat.ts`

**See Also**: [API Documentation](#api-documentation), [Decisions](#decisions)

---

### UI Components

#### Premium Components

**Purpose**: Premium subscription features

**Components**:
- `PremiumExerciseCard.tsx`
- `PremiumHeader.tsx`
- `PremiumStreakCounter.tsx`
- `PremiumTimeline.tsx`
- `PremiumWeekStrip.tsx`

**See Also**: [Data Models](#data-models)

---

#### Modal Components

**Purpose**: Interactive dialogs and modals

**Components**:
- `AddToWorkoutModal.tsx`
- `CalendarPreviewModal.tsx`
- `EditWorkoutExerciseModal.tsx`

**See Also**: [Workflows](#workflows)

---

#### Utility Components

**Purpose**: Reusable utility components

**Components**:
- `ErrorBoundary.tsx`
- `LoadingSkeleton.tsx`
- `NotificationBell.tsx`
- `Toast.tsx`

---

### Custom Hooks

#### useSessionTimer

**Purpose**: Manages workout session timing

**Features**:
- Timer start/stop/pause
- Session tracking
- Progress calculation

**File**: `components/hooks/useSessionTimer.ts`

**See Also**: [Workflows](#workflows)

---

## API Documentation

### Convex Functions

#### Authentication

**File**: `convex/auth.ts`

**Functions**:
- `login`: User authentication
- `logout`: User logout
- `register`: User registration
- `resetPassword`: Password reset

**See Also**: [Data Models](#data-models), [Security](#security)

---

#### Exercises

**File**: `convex/exercises.ts`

**Functions**:
- `listExercises`: Get all exercises
- `getExercise`: Get specific exercise
- `createExercise`: Create new exercise
- `updateExercise`: Update exercise
- `deleteExercise`: Delete exercise

**See Also**: [Data Models](#data-models), [Components](#components)

---

#### Programs

**File**: `convex/programs.ts`

**Functions**:
- `listPrograms`: Get all programs
- `getProgram`: Get specific program
- `createProgram`: Create new program
- `updateProgram`: Update program
- `deleteProgram`: Delete program

**See Also**: [Data Models](#data-models), [Workflows](#workflows)

---

#### AI Chat

**File**: `convex/aiChat.ts`

**Functions**:
- `sendMessage`: Send message to AI
- `getChatHistory`: Get conversation history
- `getRecommendations`: Get AI recommendations

**See Also**: [TrainingArchitect](#trainingarchitect), [Decisions](#decisions)

---

#### Calendar API

**File**: `convex/calendar_api.ts`

**Functions**:
- `getSchedule`: Get workout schedule
- `updateSchedule`: Update workout schedule
- `getEvents`: Get calendar events

**See Also**: [Workflows](#workflows), [Data Models](#data-models)

---

## Data Models

### Core Data Structures

#### User

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  subscription: Subscription;
  createdAt: number;
}
```

**See Also**: [Authentication](#authentication), [API Documentation](#api-documentation)

---

#### Exercise

```typescript
interface Exercise {
  _id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
  difficulty: Difficulty;
  videoUrl?: string;
  imageUrl?: string;
}
```

**See Also**: [Exercises API](#exercises), [Components](#components)

---

#### Workout

```typescript
interface Workout {
  _id: string;
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  duration: number;
  difficulty: Difficulty;
  createdAt: number;
}
```

**See Also**: [WorkoutBuilder](#workoutbuilder), [Programs API](#programs)

---

#### Program

```typescript
interface Program {
  _id: string;
  name: string;
  description: string;
  workouts: ProgramWorkout[];
  duration: number;
  difficulty: Difficulty;
  createdAt: number;
}
```

**See Also**: [ProgramBuilder](#programbuilder), [Programs API](#programs)

---

#### WorkoutExercise

```typescript
interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  notes?: string;
}
```

**See Also**: [Workout](#workout), [Exercise](#exercise)

---

## Workflows

### Creating a Workout

**Steps**:
1. User opens WorkoutBuilder
2. Selects exercises from library
3. Configures sets, reps, and rest time
4. Preview workout
5. Save workout

**Components Involved**:
- `WorkoutBuilderWorkspace.tsx`
- `ExercisePicker.tsx`
- `CreateWorkout.tsx`

**API Calls**:
- `listExercises` - Get available exercises
- `createWorkout` - Save new workout

**See Also**: [WorkoutBuilder](#workoutbuilder), [API Documentation](#api-documentation)

---

### Creating a Program

**Steps**:
1. User opens ProgramBuilder
2. Selects workout duration
3. Adds workouts to each day
4. Configures progression
5. Preview program
6. Save program

**Components Involved**:
- `ProgramBuilder.tsx`
- `WorkoutBuilderWorkspace.tsx`

**API Calls**:
- `createProgram` - Save new program
- `updateProgram` - Update program

**See Also**: [ProgramBuilder](#programbuilder), [Data Models](#data-models)

---

### Starting a Workout Session

**Steps**:
1. User selects workout
2. Session timer starts
3. User completes each exercise
4. Progress is tracked
5. Session is saved

**Components Involved**:
- `WorkoutCard.tsx`
- `useSessionTimer.ts`
- `UserPacedPlayer.tsx`

**API Calls**:
- `getWorkout` - Get workout details
- `createSession` - Create workout session
- `updateSession` - Update session progress

**See Also**: [useSessionTimer](#usesessiontimer), [API Documentation](#api-documentation)

---

### Getting AI Recommendations

**Steps**:
1. User opens TrainingArchitect
2. User describes goals or preferences
3. AI analyzes user data
4. AI provides recommendations
5. User accepts or modifies

**Components Involved**:
- `TrainingArchitect.tsx`
- `aiChat.ts`

**API Calls**:
- `sendMessage` - Send user message
- `getRecommendations` - Get AI recommendations

**See Also**: [TrainingArchitect](#trainingarchitect), [Decisions](#decisions)

---

## Decisions

### Technology Decisions

#### Decision: Use Convex for Backend

**Date**: April 2026
**Context**: Needed a backend solution with real-time sync

**Options Considered**:
1. Firebase
2. Supabase
3. Convex
4. Custom Node.js backend

**Decision**: Convex

**Rationale**:
- Built-in real-time synchronization
- Serverless architecture
- TypeScript support
- Easy deployment
- Good free tier

**Impact**: Simplified backend development, enabled real-time features

**See Also**: [Architecture](#architecture), [API Documentation](#api-documentation)

---

#### Decision: Use shadcn/ui Components

**Date**: April 2026
**Context**: Needed consistent, accessible UI components

**Options Considered**:
1. Material-UI
2. Chakra UI
3. shadcn/ui
4. Custom components

**Decision**: shadcn/ui

**Rationale**:
- Built on Radix UI (accessible)
- Tailwind CSS integration
- Customizable
- Modern design
- Good documentation

**Impact**: Consistent UI, faster development, better accessibility

**See Also**: [Components](#components), [Architecture](#architecture)

---

#### Decision: Use TypeScript

**Date**: April 2026
**Context**: Wanted type safety across the stack

**Options Considered**:
1. JavaScript
2. TypeScript
3. Flow

**Decision**: TypeScript

**Rationale**:
- Type safety
- Better IDE support
- Easier refactoring
- Industry standard
- Convex supports it

**Impact**: Fewer runtime errors, better developer experience

**See Also**: [Project Overview](#project-overview), [Data Models](#data-models)

---

### Feature Decisions

#### Decision: Implement AI-Powered Coaching

**Date**: April 2026
**Context**: Users wanted personalized workout guidance

**Options Considered**:
1. Rule-based recommendations
2. AI-powered coaching
3. Community-driven tips

**Decision**: AI-powered coaching

**Rationale**:
- More personalized
- Can adapt to user progress
- Competitive advantage
- Scalable

**Impact**: Increased user engagement, premium feature

**See Also**: [TrainingArchitect](#trainingarchitect), [API Documentation](#api-documentation)

---

#### Decision: Premium Subscription Model

**Date**: April 2026
**Context**: Needed monetization strategy

**Options Considered**:
1. Free only
2. One-time purchase
3. Subscription model
4. Freemium

**Decision**: Freemium with premium subscription

**Rationale**:
- Recurring revenue
- Lower barrier to entry
- Upsell opportunities
- Industry standard

**Impact**: Sustainable business model, premium features

**See Also**: [Premium Components](#premium-components), [Data Models](#data-models)

---

## Problems Solved

### Problem: Real-Time Data Synchronization

**Issue**: Users needed to see updates across devices in real-time

**Solution**: Implemented Convex for real-time data sync

**Implementation**:
- Used Convex subscriptions
- Optimistic UI updates
- Conflict resolution

**Result**: Users see updates instantly across devices

**See Also**: [Architecture](#architecture), [Convex Decision](#decision-use-convex-for-backend)

---

### Problem: Complex Workout Planning

**Issue**: Users struggled to create effective workout routines

**Solution**: Built WorkoutBuilder with AI assistance

**Implementation**:
- Intuitive exercise selection
- AI-powered recommendations
- Visual workout preview
- Progress tracking

**Result**: Users can create effective workouts easily

**See Also**: [WorkoutBuilder](#workoutbuilder), [TrainingArchitect](#trainingarchitect)

---

### Problem: Exercise Video Playback

**Issue**: Users needed to see proper exercise form

**Solution**: Implemented video player with pacing controls

**Implementation**:
- Custom video player
- User-paced playback
- Exercise instructions
- Form tips

**Result**: Users can follow exercises correctly

**See Also**: [UserPacedPlayer](#userpacedplayer), [Components](#components)

---

### Problem: Mobile Responsiveness

**Issue**: App needed to work well on mobile devices

**Solution**: Implemented responsive design with Tailwind CSS

**Implementation**:
- Mobile-first approach
- Responsive breakpoints
- Touch-friendly UI
- Optimized performance

**Result**: Great mobile experience

**See Also**: [Architecture](#architecture), [Components](#components)

---

## Lessons Learned

### Lesson 1: Start with Core Features

**Experience**: Initially tried to build too many features at once

**Learning**: Focus on core features first, then expand

**Application**: Prioritized workout creation and tracking before adding advanced features

**See Also**: [Project Overview](#project-overview), [Decisions](#decisions)

---

### Lesson 2: Invest in Type Safety

**Experience**: Runtime errors were common with JavaScript

**Learning**: TypeScript prevents many errors at compile time

**Application**: Used TypeScript throughout the stack

**See Also**: [TypeScript Decision](#decision-use-typescript), [Data Models](#data-models)

---

### Lesson 3: Real-Time Sync is Complex

**Experience**: Implementing real-time sync was more complex than expected

**Learning**: Use established solutions rather than building from scratch

**Application**: Chose Convex for real-time sync instead of custom implementation

**See Also**: [Convex Decision](#decision-use-convex-for-backend), [Architecture](#architecture)

---

### Lesson 4: User Testing is Critical

**Experience**: Assumptions about user behavior were often wrong

**Learning**: Test with real users early and often

**Application**: Conducted user testing throughout development

**See Also**: [Problems Solved](#problems-solved), [Workflows](#workflows)

---

### Lesson 5: Performance Matters

**Experience**: Slow load times hurt user engagement

**Learning**: Optimize for performance from the start

**Application**: Used code splitting, lazy loading, and optimized assets

**See Also**: [Architecture](#architecture), [Components](#components)

---

## Security

### Authentication

**Implementation**: Convex authentication

**Features**:
- Secure password storage
- Session management
- Token-based authentication
- OAuth integration (planned)

**See Also**: [Authentication API](#authentication), [Data Models](#data-models)

---

### Data Privacy

**Implementation**:
- User data encryption
- Secure data transmission
- Privacy policy compliance
- Data retention policies

**See Also**: [Data Models](#data-models), [API Documentation](#api-documentation)

---

## Deployment

### Current Deployment

**Platform**: Convex hosting
**Status**: Development
**URL**: [To be determined]

### Deployment Pipeline

1. **Code Changes**: Git commits
2. **Build**: Vite build process
3. **Deploy**: Convex deployment
4. **Test**: Automated testing
5. **Monitor**: Error tracking

**See Also**: [Architecture](#architecture), [Project Overview](#project-overview)

---

## Future Plans

### Short Term

- [ ] Complete premium features
- [ ] Improve AI recommendations
- [ ] Add more exercises
- [ ] Enhance mobile experience

### Long Term

- [ ] Mobile apps (iOS/Android)
- [ ] Social features
- [ ] Advanced analytics
- [ ] Integration with wearables

**See Also**: [Decisions](#decisions), [Project Overview](#project-overview)

---

## Contributing

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Coding Standards

- Use TypeScript
- Follow existing code style
- Write tests for new features
- Update documentation

**See Also**: [Architecture](#architecture), [Components](#components)

---

## Support

### Getting Help

- Check this wiki first
- Review API documentation
- Look at component examples
- Check existing issues

### Reporting Issues

1. Check if issue already exists
2. Create detailed bug report
3. Include steps to reproduce
4. Provide environment details

**See Also**: [Problems Solved](#problems-solved), [API Documentation](#api-documentation)

---

## Glossary

- **Convex**: Backend-as-a-service platform
- **shadcn/ui**: UI component library
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Typed superset of JavaScript

---

## References

- [Convex Documentation](https://docs.convex.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Last Updated**: April 29, 2026
**Version**: 1.0.0
**Maintainers**: Forge Development Team
