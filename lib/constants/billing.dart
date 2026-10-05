// Capability + plan-config constants. Single home for everything billing /
// entitlement related at the app level.
//
// KEEP IN SYNC with motionletics-backend convex/lib.ts.

// --- Capability keys (mirror the 16 server capabilities) ---
const String kCapAiPlan = 'personalized_programs';
const String kCapUnlimitedRoutines = 'unlimited_routines';
const String kCapFullHistory = 'full_history';
const String kCapCustomExercises = 'trainer_features';

// --- Client-side FREE limits ---
const int kFreeRoutineCap = 3;
const int kFreeHistoryDays = 7;

/// Provider-agnostic paywall plan config. Placeholders: real billing is a
/// later project. NO Play Billing / Stripe references anywhere.
class PlanOption {
  const PlanOption({required this.id, required this.tier, required this.period, required this.priceLabel});

  final String id;
  final String tier; // 'basic' | 'advanced'
  final String period; // 'monthly' | 'yearly'
  final String priceLabel;
}

// KEEP IN SYNC with motionletics-backend convex/lib.ts (tier names).
const List<PlanOption> kPaywallPlans = <PlanOption>[
  PlanOption(id: 'basic-monthly', tier: 'basic', period: 'monthly', priceLabel: '\$2.99'),
  PlanOption(id: 'basic-yearly', tier: 'basic', period: 'yearly', priceLabel: '\$24.99'),
  PlanOption(id: 'advanced-monthly', tier: 'advanced', period: 'monthly', priceLabel: '\$5.99'),
  PlanOption(id: 'advanced-yearly', tier: 'advanced', period: 'yearly', priceLabel: '\$49.99'),
];
