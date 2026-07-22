#!/usr/bin/env python3
"""
Canonical Exercise Audit - Phase 1: READ-ONLY analysis
Identifies duplicates, probable duplicates, and legitimate variants
"""
import json
import re
from collections import defaultdict
from typing import Dict, List, Set, Tuple
from difflib import SequenceMatcher
import sys

# Load all exercises
exercises = []
with open('temp_export_dir/exercises/documents.jsonl', 'r') as f:
    for line in f:
        if line.strip():
            exercises.append(json.loads(line))

print(f"Loaded {len(exercises)} exercises")

def normalize_name(name: str) -> str:
    """Normalize exercise name for comparison"""
    if not name:
        return ""
    # Lowercase, trim, remove extra spaces
    normalized = name.lower().strip()
    # Remove common variations/punctuation
    normalized = re.sub(r'[^\w\s-]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    # Common word replacements
    replacements = {
        'dumbell': 'dumbbell',
        'barbell': 'barbell',
        'kettlebell': 'kettlebell',
        'db': 'dumbbell',
        'bb': 'barbell',
        'kb': 'kettlebell',
    }
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    return normalized

def normalize_instructions(instructions: List[str]) -> str:
    """Normalize instructions for comparison"""
    if not instructions:
        return ""
    text = ' '.join(instructions)
    # Lowercase, remove punctuation, normalize whitespace
    normalized = text.lower().strip()
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized

def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate text similarity using SequenceMatcher"""
    if not text1 or not text2:
        return 0.0
    return SequenceMatcher(None, text1, text2).ratio()

def normalize_equipment(equipment: List[str]) -> Set[str]:
    """Normalize equipment list for comparison"""
    if not equipment:
        return set()
    normalized = set()
    for item in equipment:
        normalized_item = item.lower().strip()
        normalized.add(normalized_item)
    return normalized

def normalize_muscles(muscles: List[str]) -> Set[str]:
    """Normalize muscle list for comparison"""
    if not muscles:
        return set()
    normalized = set()
    for muscle in muscles:
        normalized_item = muscle.lower().strip()
        normalized.add(normalized_item)
    return normalized

def extract_movement_pattern(name: str, instructions: List[str]) -> str:
    """Extract movement pattern from name and instructions"""
    if not name and not instructions:
        return ""
    
    text = f"{name} {' '.join(instructions)}".lower()
    
    # Common movement patterns
    patterns = {
        'squat': ['squat', 'leg press'],
        'push': ['bench', 'press', 'push', 'dip'],
        'pull': ['row', 'pull', 'chin', 'lat'],
        'hinge': ['deadlift', 'hip thrust', 'good morning'],
        'lunge': ['lunge', 'split'],
        'rotation': ['twist', 'rotation', 'russian twist'],
        'plank': ['plank', 'hold'],
        'carry': ['carry', 'walk'],
        'jump': ['jump', 'hop'],
        'crunch': ['crunch', 'sit up', 'abdominal'],
    }
    
    detected_patterns = []
    for pattern, keywords in patterns.items():
        if any(keyword in text for keyword in keywords):
            detected_patterns.append(pattern)
    
    return ', '.join(detected_patterns) if detected_patterns else 'unknown'

def is_unilateral(exercise: Dict) -> bool:
    """Determine if exercise is unilateral (single-limb)"""
    name = exercise.get('name', '').lower()
    instructions = ' '.join(exercise.get('instructions', [])).lower()
    text = f"{name} {instructions}"
    
    unilateral_indicators = [
        'single', 'unilateral', 'one arm', 'one leg', 'alternating',
        'one-arm', 'one-leg', 'single-leg', 'single-arm'
    ]
    
    return any(indicator in text for indicator in unilateral_indicators)

def get_exercise_key(exercise: Dict) -> str:
    """Generate a comparison key for an exercise"""
    normalized_name = normalize_name(exercise.get('name', ''))
    equipment = normalize_equipment(exercise.get('equipment', []))
    muscles = normalize_muscles(exercise.get('primaryMuscles', []))
    category = exercise.get('category', '').lower()
    
    # Create a tuple-based key
    return f"{normalized_name}|{sorted(equipment)}|{sorted(muscles)}|{category}"

def compare_exercises(ex1: Dict, ex2: Dict) -> Tuple[str, float, List[str]]:
    """
    Compare two exercises and return:
    - similarity type (exact_name, high_similarity, low_similarity)
    - similarity score (0-1)
    - list of differences
    """
    differences = []
    
    # Compare names
    name1 = normalize_name(ex1.get('name', ''))
    name2 = normalize_name(ex2.get('name', ''))
    name_similarity = calculate_similarity(name1, name2)
    
    if name1 == name2:
        similarity_type = 'exact_name'
    elif name_similarity > 0.8:
        similarity_type = 'high_name_similarity'
    else:
        similarity_type = 'low_name_similarity'
    
    # Compare equipment
    equipment1 = normalize_equipment(ex1.get('equipment', []))
    equipment2 = normalize_equipment(ex2.get('equipment', []))
    if equipment1 != equipment2:
        differences.append(f"equipment: {sorted(equipment1)} vs {sorted(equipment2)}")
    
    # Compare muscles
    muscles1 = normalize_muscles(ex1.get('primaryMuscles', []))
    muscles2 = normalize_muscles(ex2.get('primaryMuscles', []))
    if muscles1 != muscles2:
        differences.append(f"primaryMuscles: {sorted(muscles1)} vs {sorted(muscles2)}")
    
    secondary_muscles1 = normalize_muscles(ex1.get('secondaryMuscles', []))
    secondary_muscles2 = normalize_muscles(ex2.get('secondaryMuscles', []))
    if secondary_muscles1 != secondary_muscles2:
        differences.append(f"secondaryMuscles: {sorted(secondary_muscles1)} vs {sorted(secondary_muscles2)}")
    
    # Compare category
    category1 = ex1.get('category', '').lower()
    category2 = ex2.get('category', '').lower()
    if category1 != category2:
        differences.append(f"category: {category1} vs {category2}")
    
    # Compare muscle group
    muscle_group1 = ex1.get('muscleGroup', '').lower()
    muscle_group2 = ex2.get('muscleGroup', '').lower()
    if muscle_group1 != muscle_group2:
        differences.append(f"muscleGroup: {muscle_group1} vs {muscle_group2}")
    
    # Compare instructions
    instructions1 = normalize_instructions(ex1.get('instructions', []))
    instructions2 = normalize_instructions(ex2.get('instructions', []))
    instruction_similarity = calculate_similarity(instructions1, instructions2)
    if instruction_similarity < 0.8:
        differences.append(f"instructions: {instruction_similarity:.2f} similarity")
    
    # Compare movement pattern
    pattern1 = extract_movement_pattern(ex1.get('name', ''), ex1.get('instructions', []))
    pattern2 = extract_movement_pattern(ex2.get('name', ''), ex2.get('instructions', []))
    if pattern1 != pattern2:
        differences.append(f"movement pattern: {pattern1} vs {pattern2}")
    
    # Compare unilateral vs bilateral
    unilateral1 = is_unilateral(ex1)
    unilateral2 = is_unilateral(ex2)
    if unilateral1 != unilateral2:
        differences.append(f"unilateral: {unilateral1} vs {unilateral2}")
    
    # Calculate overall similarity score
    base_similarity = name_similarity
    if not differences:
        overall_similarity = base_similarity
    else:
        # Reduce similarity score based on number of differences
        overall_similarity = base_similarity * (1 - len(differences) * 0.1)
    
    return similarity_type, max(0, overall_similarity), differences

# Build similarity map
print("Building similarity map...")
similarity_map = defaultdict(list)

# Group by normalized name for initial comparison
name_groups = defaultdict(list)
for exercise in exercises:
    normalized_name = normalize_name(exercise.get('name', ''))
    name_groups[normalized_name].append(exercise)

print(f"Found {len(name_groups)} unique normalized names")

# Compare exercises within same name group first
confirmed_duplicates = []
probable_duplicates = []
legitimate_variants = []
unique_exercises = []
processed_ids = set()

for normalized_name, group in name_groups.items():
    if len(group) == 1:
        # Only one exercise with this name - likely unique
        unique_exercises.append(group[0])
        processed_ids.add(group[0]['_id'])
        continue
    
    # Multiple exercises with same/similar name - need detailed comparison
    group_similarities = []
    
    for i, ex1 in enumerate(group):
        for j, ex2 in enumerate(group):
            if i >= j:
                continue
            
            similarity_type, similarity_score, differences = compare_exercises(ex1, ex2)
            group_similarities.append({
                'ex1': ex1,
                'ex2': ex2,
                'similarity_type': similarity_type,
                'similarity_score': similarity_score,
                'differences': differences
            })
    
    # Analyze the group
    if not group_similarities:
        # Shouldn't happen, but handle gracefully
        for exercise in group:
            unique_exercises.append(exercise)
            processed_ids.add(exercise['_id'])
        continue
    
    # Check if all are very similar (confirmed duplicates)
    high_similarity_count = sum(1 for s in group_similarities if s['similarity_score'] > 0.9)
    
    if high_similarity_count == len(group_similarities) and len(group_similarities) > 0:
        # All highly similar - confirmed duplicates
        canonical = max(group, key=lambda x: (
            len(x.get('instructions', [])),
            len(x.get('benefits', [])),
            x.get('workoutCount', 0)
        ))
        
        duplicate_ids = [ex['_id'] for ex in group if ex['_id'] != canonical['_id']]
        
        # Check for trainer-specific URLs
        trainer_urls = {}
        for ex in group:
            video_url = ex.get('videoUrl')
            if video_url:
                trainer_urls[ex['_id']] = video_url
        
        confirmed_duplicates.append({
            'canonicalCandidateId': canonical['_id'],
            'duplicateIds': duplicate_ids,
            'reason': similarity_type,
            'differences': group_similarities[0]['differences'],
            'trainerSpecificUrls': trainer_urls,
            'confidence': 'confirmed'
        })
        
        processed_ids.update([ex['_id'] for ex in group])
    
    elif high_similarity_count > 0:
        # Some are similar - probable duplicates
        # Find the most similar pairs
        high_sim_pairs = [s for s in group_similarities if s['similarity_score'] > 0.75]
        
        if high_sim_pairs:
            # Group the similar exercises
            similar_group = set()
            for pair in high_sim_pairs:
                similar_group.add(pair['ex1']['_id'])
                similar_group.add(pair['ex2']['_id'])
            
            probable_duplicates.append({
                'ids': list(similar_group),
                'reason': 'similar name with high similarity scores',
                'whyProbable': f"Name normalized to same, average similarity: {sum(s['similarity_score'] for s in high_sim_pairs)/len(high_sim_pairs):.2f}",
                'confidence': 'medium' if any(s['similarity_score'] > 0.85 for s in high_sim_pairs) else 'low'
            })
            
            processed_ids.update(similar_group)

# Check for cross-name similarities (probable duplicates with different names)
print("Checking cross-name similarities...")
remaining_exercises = [ex for ex in exercises if ex['_id'] not in processed_ids]

for i, ex1 in enumerate(remaining_exercises):
    if ex1['_id'] in processed_ids:
        continue
    
    name1 = normalize_name(ex1.get('name', ''))
    similar_exercises = []
    
    for ex2 in remaining_exercises[i+1:]:
        if ex2['_id'] in processed_ids:
            continue
        
        similarity_type, similarity_score, differences = compare_exercises(ex1, ex2)
        
        # High similarity but different names - probable duplicate
        if similarity_score > 0.75 and similarity_type != 'exact_name':
            similar_exercises.append({
                'exercise': ex2,
                'similarity_score': similarity_score,
                'differences': differences
            })
    
    if similar_exercises:
        ids = [ex1['_id']] + [ex['exercise']['_id'] for ex in similar_exercises]
        avg_similarity = sum(ex['similarity_score'] for ex in similar_exercises) / len(similar_exercises)
        
        probable_duplicates.append({
            'ids': ids,
            'reason': f"different names but high similarity: {name1} vs {[normalize_name(ex['exercise'].get('name', '')) for ex in similar_exercises]}",
            'whyProbable': f"Average similarity: {avg_similarity:.2f}, likely same exercise with different naming",
            'confidence': 'medium' if avg_similarity > 0.85 else 'low'
        })
        
        processed_ids.update(ids)

# Check for legitimate variants (same movement, different equipment)
print("Checking for legitimate variants...")
remaining_exercises = [ex for ex in exercises if ex['_id'] not in processed_ids]

# Group by movement pattern and muscles
movement_muscle_groups = defaultdict(list)
for exercise in remaining_exercises:
    if exercise['_id'] in processed_ids:
        continue
    
    pattern = extract_movement_pattern(exercise.get('name', ''), exercise.get('instructions', []))
    muscles = normalize_muscles(exercise.get('primaryMuscles', []))
    key = f"{pattern}|{sorted(muscles)}"
    movement_muscle_groups[key].append(exercise)

for key, group in movement_muscle_groups.items():
    if len(group) < 2:
        continue
    
    # Check if they differ only by equipment
    equipments = [normalize_equipment(ex.get('equipment', [])) for ex in group]
    unique_equipments = [frozenset(eq) for eq in equipments]
    
    if len(set(unique_equipments)) > 1:
        # Same movement/muscles but different equipment - legitimate variants
        legitimate_variants.append({
            'ids': [ex['_id'] for ex in group],
            'reason': 'different equipment produces distinct movement',
            'whyDistinct': f"Same movement pattern and muscles, but equipment varies: {[list(eq) for eq in set(unique_equipments)]}"
        })
        
        processed_ids.update([ex['_id'] for ex in group])

# Remaining exercises are truly unique
final_unique = [ex for ex in exercises if ex['_id'] not in processed_ids]
unique_exercises.extend(final_unique)

# Generate report
report = {
    "summary": {
        "totalExercises": len(exercises),
        "uniqueExercises": len(unique_exercises),
        "confirmedDuplicates": len(confirmed_duplicates),
        "probableDuplicates": len(probable_duplicates),
        "legitimateVariants": len(legitimate_variants)
    },
    "duplicateGroups": confirmed_duplicates,
    "probableGroups": probable_duplicates,
    "legitimateVariants": legitimate_variants,
    "uniqueExercisesCount": len(unique_exercises),
    "recommendations": []
}

# Generate recommendations
if confirmed_duplicates:
    report["recommendations"].append(f"Merge {len(confirmed_duplicates)} confirmed duplicate groups into canonical exercises")

if probable_duplicates:
    report["recommendations"].append(f"Review {len(probable_duplicates)} probable groups manually")

if legitimate_variants:
    report["recommendations"].append(f"Keep {len(legitimate_variants)} legitimate variant groups separate")

report["recommendations"].append(f"Preserve {len(unique_exercises)} unique exercises")

# Print summary
print("\n" + "="*50)
print("CANONICAL EXERCISE AUDIT - PHASE 1")
print("="*50)
print(f"Total exercises analyzed: {report['summary']['totalExercises']}")
print(f"Unique exercises: {report['summary']['uniqueExercises']}")
print(f"Confirmed duplicate groups: {report['summary']['confirmedDuplicates']}")
print(f"Probable duplicate groups: {report['summary']['probableDuplicates']}")
print(f"Legitimate variant groups: {report['summary']['legitimateVariants']}")
print("="*50)

# Detailed analysis
print("\nCONFIRMED DUPLICATES:")
for group in confirmed_duplicates:
    print(f"  - {group['canonicalCandidateId']}: {len(group['duplicateIds'])} duplicates")
    if group['trainerSpecificUrls']:
        print(f"    Trainer URLs: {len(group['trainerSpecificUrls'])} found")

print("\nPROBABLE DUPLICATES:")
for group in probable_duplicates:
    print(f"  - {len(group['ids'])} exercises: {group['reason']}")

print("\nLEGITIMATE VARIANTS:")
for group in legitimate_variants:
    print(f"  - {len(group['ids'])} exercises: {group['whyDistinct']}")

print("\nRECOMMENDATIONS:")
for rec in report["recommendations"]:
    print(f"  - {rec}")

# Save full report
with open('exercise_audit_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print("\nFull report saved to exercise_audit_report.json")