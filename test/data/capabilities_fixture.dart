/// Backend capability contract fixture.
///
/// Copied from motionletics-backend convex/lib.ts @ af31ea5 — keep in sync.
const List<String> kBackendTiers = <String>['free', 'basic', 'advanced', 'enterprise'];

/// Copied from motionletics-backend convex/lib.ts @ af31ea5 — keep in sync.
const List<String> kBackendCapabilities = <String>[
  'workout_tracking',
  'recent_history',
  'full_history',
  'cloud_backup',
  'cloud_sync',
  'unlimited_routines',
  'progress_charts',
  'advanced_analytics',
  'personalized_programs',
  'premium_programs',
  'premium_videos',
  'trainer_features',
  'community_browse',
  'community_post',
  'community_media_upload',
  'organization_management',
];

/// Copied from motionletics-backend convex/lib.ts @ af31ea5 — keep in sync
/// (monotonic supersets).
const Map<String, List<String>> kBackendPlanCapabilities = <String, List<String>>{
  'free': <String>['workout_tracking', 'recent_history'],
  'basic': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
  ],
  'advanced': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
    'advanced_analytics',
    'personalized_programs',
    'premium_programs',
    'premium_videos',
    'trainer_features',
  ],
  'enterprise': <String>[
    'workout_tracking',
    'recent_history',
    'full_history',
    'cloud_backup',
    'cloud_sync',
    'unlimited_routines',
    'progress_charts',
    'community_browse',
    'community_post',
    'community_media_upload',
    'advanced_analytics',
    'personalized_programs',
    'premium_programs',
    'premium_videos',
    'trainer_features',
    'organization_management',
  ],
};
