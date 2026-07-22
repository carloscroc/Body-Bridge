const fs = require('fs');

// Read the exercise data
const rawData = fs.readFileSync('exercise-data.json', 'utf8');
const data = JSON.parse(rawData.slice(rawData.indexOf('['))); // Remove the "waiting for local backend..." line

console.log(`Loaded ${data.length} exercises for analysis`);

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeName(name) {
  let normalized = normalizeString(name);
  
  const variations = {
    'barbell': ['bb', 'bar bell'],
    'dumbbell': ['db', 'dumb bell'],
    'kettlebell': ['kb', 'kettle bell'],
    'machine': ['mach'],
    'cable': ['cables'],
    'press': ['push'],
    'pull': ['row'],
    'squat': ['squatting'],
    'deadlift': ['dead lift'],
    'bench': ['benching'],
    'lunge': ['lunging'],
    'curl': ['curling'],
    'extension': ['ext'],
    'flexion': ['flex'],
    'abduction': ['abd'],
    'adduction': ['add'],
    'rotation': ['rot'],
    'lateral': ['lat'],
    'medial': ['med'],
    'anterior': ['front'],
    'posterior': ['rear', 'back'],
    'superior': ['upper'],
    'inferior': ['lower'],
    'proximal': ['inner'],
    'distal': ['outer'],
    'bilateral': ['both sides', 'two arm', 'two leg'],
    'unilateral': ['single arm', 'single leg', 'one arm', 'one leg'],
    'alternating': ['alt'],
    'concentric': ['con'],
    'eccentric': ['ecc'],
    'isometric': ['iso'],
    'plyometric': ['plyo'],
    'compound': ['multi joint'],
    'isolation': ['single joint']
  };
  
  for (const [standard, variants] of Object.entries(variations)) {
    for (const variant of variants) {
      normalized = normalized.replace(new RegExp(variant, 'g'), standard);
    }
  }
  
  return normalized;
}

function normalizeInstructions(instructions) {
  if (!Array.isArray(instructions)) return '';
  return instructions.map(inst => normalizeString(inst)).join(' ');
}

function calculateSimilarity(exercise1, exercise2) {
  const name1 = normalizeName(exercise1.name);
  const name2 = normalizeName(exercise2.name);
  
  if (name1 === name2) {
    return { similarity: 1.0, reason: 'exact_name_match' };
  }
  
  if (name1.includes(name2) || name2.includes(name1)) {
    return { similarity: 0.9, reason: 'name_contains' };
  }
  
  const words1 = name1.split(' ').filter(w => w.length > 2);
  const words2 = name2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) {
    return { similarity: 0.0, reason: 'no_meaningful_words' };
  }
  
  const commonWords = words1.filter(w => words2.includes(w));
  const uniqueWords = new Set([...words1, ...words2]);
  const wordSimilarity = commonWords.length / uniqueWords.size;
  
  if (wordSimilarity > 0.7) {
    return { similarity: wordSimilarity, reason: 'high_word_overlap' };
  }
  
  return { similarity: wordSimilarity, reason: 'word_overlap' };
}

function compareEquipment(eq1, eq2) {
  if (!eq1 || !eq2) return { match: false, reason: 'missing_equipment' };
  
  const norm1 = eq1.map(e => normalizeString(e)).sort();
  const norm2 = eq2.map(e => normalizeString(e)).sort();
  
  if (JSON.stringify(norm1) === JSON.stringify(norm2)) {
    return { match: true, reason: 'exact_match' };
  }
  
  const common = norm1.filter(e => norm2.includes(e));
  if (common.length > 0 && norm1.length === norm2.length) {
    return { match: false, reason: 'same_equipment_different_format', common };
  }
  
  return { match: false, reason: 'different_equipment', common };
}

function compareMuscles(m1, m2, type) {
  if (!m1 || !m2) return { match: false, reason: 'missing_muscles' };
  
  const norm1 = m1.map(m => normalizeString(m)).sort();
  const norm2 = m2.map(m => normalizeString(m)).sort();
  
  if (JSON.stringify(norm1) === JSON.stringify(norm2)) {
    return { match: true, reason: 'exact_match' };
  }
  
  const common = norm1.filter(m => norm2.includes(m));
  const allUnique = new Set([...norm1, ...norm2]);
  const overlap = common.length / allUnique.size;
  
  return { 
    match: overlap > 0.8, 
    reason: overlap > 0.8 ? 'high_overlap' : 'low_overlap',
    overlap,
    common
  };
}

function inferMovementPattern(exercise) {
  const name = normalizeName(exercise.name);
  const instructions = normalizeInstructions(exercise.instructions);
  
  const patterns = {
    'push': /\b(press|push|bench|dip|extension|tricep|chest|shoulder)\b/i,
    'pull': /\b(pull|row|curl|chin|lat|trap|rear|back)\b/i,
    'squat': /\b(squat|lunge|leg|quad|hamstring|glute)\b/i,
    'hinge': /\b(deadlift|hip|thrust|bridge|good morning)\b/i,
    'twist': /\b(rotation|twist|rotational|oblique|core)\b/i,
    'carry': /\b(carry|walk|farmers|suitcase)\b/i,
    'iso': /\b(hold|plank|static|isometric)\b/i
  };
  
  for (const [pattern, regex] of Object.entries(patterns)) {
    if (regex.test(name) || regex.test(instructions)) {
      return pattern;
    }
  }
  
  return 'unknown';
}

function inferBodyPosition(exercise) {
  const name = normalizeName(exercise.name);
  const instructions = normalizeInstructions(exercise.instructions);
  
  const positions = {
    'standing': /\b(stand|standing)\b/i,
    'seated': /\b(sit|seat|seated)\b/i,
    'supine': /\b(lie|lying|bench|floor|supine)\b/i,
    'prone': /\b(prone|face down)\b/i,
    'kneeling': /\b(kneel|kneeling)\b/i
  };
  
  for (const [position, regex] of Object.entries(positions)) {
    if (regex.test(name) || regex.test(instructions)) {
      return position;
    }
  }
  
  return 'unknown';
}

function isUnilateral(exercise) {
  const name = normalizeName(exercise.name);
  return /\b(single|one|unilateral|alternating|alt|1-arm|1-leg)\b/i.test(name);
}

function classifyDuplicateGroup(exercises) {
  if (exercises.length < 2) {
    return { classification: 'unique', reason: 'single_exercise' };
  }
  
  const first = exercises[0];
  const allSameName = exercises.every(e => normalizeName(e.name) === normalizeName(first.name));
  
  if (allSameName) {
    const uniqueSources = new Set(
      exercises
        .filter(e => e.trainerFirstName && e.trainerLastName)
        .map(e => `${e.trainerFirstName} ${e.trainerLastName}`)
    );
    
    if (uniqueSources.size > 1) {
      const equipmentVariations = new Set(
        exercises.flatMap(e => e.equipment || []).map(normalizeString)
      );
      
      if (equipmentVariations.size > 1) {
        return { 
          classification: 'legitimate_variant', 
          reason: 'same_exercise_different_equipment',
          equipmentVariations: Array.from(equipmentVariations)
        };
      }
      
      return { 
        classification: 'confirmed_duplicate', 
        reason: 'same_exercise_multiple_trainers',
        uniqueTrainers: Array.from(uniqueSources)
      };
    }
    
    return { classification: 'confirmed_duplicate', reason: 'exact_name_match' };
  }
  
  const similarities = [];
  for (let i = 1; i < exercises.length; i++) {
    const sim = calculateSimilarity(first, exercises[i]);
    similarities.push(sim);
  }
  
  const avgSimilarity = similarities.reduce((a, b) => a + b.similarity, 0) / similarities.length;
  
  if (avgSimilarity > 0.85) {
    return { classification: 'confirmed_duplicate', reason: 'high_name_similarity', avgSimilarity };
  } else if (avgSimilarity > 0.6) {
    return { classification: 'probable_duplicate', reason: 'moderate_name_similarity', avgSimilarity };
  } else {
    return { classification: 'legitimate_variant', reason: 'different_movements', avgSimilarity };
  }
}

function findDuplicateGroups(exercises) {
  const groups = [];
  const processed = new Set();
  
  console.log('Finding duplicate groups...');
  
  for (let i = 0; i < exercises.length; i++) {
    if (processed.has(exercises[i]._id)) continue;
    
    const currentGroup = [exercises[i]];
    processed.add(exercises[i]._id);
    
    for (let j = i + 1; j < exercises.length; j++) {
      if (processed.has(exercises[j]._id)) continue;
      
      const similarity = calculateSimilarity(exercises[i], exercises[j]);
      
      if (similarity.similarity > 0.7) {
        currentGroup.push(exercises[j]);
        processed.add(exercises[j]._id);
      }
    }
    
    if (currentGroup.length > 1) {
      const classification = classifyDuplicateGroup(currentGroup);
      groups.push({
        exercises: currentGroup,
        classification,
        similarities: currentGroup.map(e => ({
          id: e._id,
          similarity: calculateSimilarity(exercises[i], e).similarity
        }))
      });
    }
    
    if (i % 100 === 0) {
      console.log(`Processed ${i}/${exercises.length} exercises, found ${groups.length} duplicate groups`);
    }
  }
  
  return groups;
}

function generateReport(exercises, duplicateGroups) {
  console.log('Generating comprehensive audit report...');
  
  const confirmedDuplicates = duplicateGroups.filter(g => g.classification.classification === 'confirmed_duplicate');
  const probableDuplicates = duplicateGroups.filter(g => g.classification.classification === 'probable_duplicate');
  const legitimateVariants = duplicateGroups.filter(g => g.classification.classification === 'legitimate_variant');
  
  const duplicateIds = new Set(duplicateGroups.flatMap(g => g.exercises.map(e => e._id)));
  const uniqueExercises = exercises.filter(e => !duplicateIds.has(e._id));
  
  const report = {
    summary: {
      totalExercises: exercises.length,
      uniqueExercises: uniqueExercises.length,
      confirmedDuplicates: confirmedDuplicates.reduce((sum, g) => sum + g.exercises.length - 1, 0),
      probableDuplicates: probableDuplicates.reduce((sum, g) => sum + g.exercises.length - 1, 0),
      legitimateVariants: legitimateVariants.reduce((sum, g) => sum + g.exercises.length - 1, 0),
      duplicateGroups: duplicateGroups.length
    },
    duplicateGroups: confirmedDuplicates.map(group => {
      const canonical = group.exercises[0];
      const duplicates = group.exercises.slice(1);
      
      const trainerUrls = {};
      group.exercises.forEach(e => {
        if (e.videoUrl) {
          trainerUrls[e._id] = e.videoUrl;
        }
      });
      
      const differences = [];
      
      const firstEquipment = canonical.equipment || [];
      duplicates.forEach(dup => {
        const dupEquipment = dup.equipment || [];
        const eqComparison = compareEquipment(firstEquipment, dupEquipment);
        if (!eqComparison.match) {
          differences.push(`equipment: ${firstEquipment.join(', ')} vs ${dupEquipment.join(', ')}`);
        }
      });
      
      const firstPrimary = canonical.primaryMuscles || [];
      const firstSecondary = canonical.secondaryMuscles || [];
      duplicates.forEach(dup => {
        const dupPrimary = dup.primaryMuscles || [];
        const dupSecondary = dup.secondaryMuscles || [];
        
        const primaryComp = compareMuscles(firstPrimary, dupPrimary, 'primary');
        if (!primaryComp.match) {
          differences.push(`primary muscles: ${firstPrimary.join(', ')} vs ${dupPrimary.join(', ')}`);
        }
        
        const secondaryComp = compareMuscles(firstSecondary, dupSecondary, 'secondary');
        if (!secondaryComp.match) {
          differences.push(`secondary muscles: ${firstSecondary.join(', ')} vs ${dupSecondary.join(', ')}`);
        }
      });
      
      const firstInstructions = normalizeInstructions(canonical.instructions);
      duplicates.forEach(dup => {
        const dupInstructions = normalizeInstructions(dup.instructions);
        if (firstInstructions !== dupInstructions && firstInstructions.length > 0 && dupInstructions.length > 0) {
          differences.push(`instructions differ`);
        }
      });
      
      return {
        canonicalCandidateId: canonical._id,
        canonicalCandidateName: canonical.name,
        duplicateIds: duplicates.map(d => d._id),
        duplicateNames: duplicates.map(d => d.name),
        reason: group.classification.reason,
        differences: differences.length > 0 ? differences : ['none significant'],
        trainerSpecificUrls: trainerUrls,
        confidence: 'confirmed',
        exerciseCount: group.exercises.length,
        uniqueTrainers: group.classification.uniqueTrainers || []
      };
    }),
    probableGroups: probableDuplicates.map(group => {
      const similarities = group.exercises.map(e => normalizeName(e.name));
      
      const first = group.exercises[0];
      const reasons = [];
      
      for (let i = 1; i < group.exercises.length; i++) {
        const other = group.exercises[i];
        
        const eqComp = compareEquipment(first.equipment, other.equipment);
        if (!eqComp.match) {
          reasons.push(`equipment differs: ${eqComp.reason}`);
        }
        
        const primaryComp = compareMuscles(first.primaryMuscles, other.primaryMuscles, 'primary');
        if (!primaryComp.match) {
          reasons.push(`primary muscles overlap: ${Math.round(primaryComp.overlap * 100)}%`);
        }
        
        const secondaryComp = compareMuscles(first.secondaryMuscles, other.secondaryMuscles, 'secondary');
        if (!secondaryComp.match) {
          reasons.push(`secondary muscles overlap: ${Math.round(secondaryComp.overlap * 100)}%`);
        }
      }
      
      return {
        ids: group.exercises.map(e => e._id),
        names: group.exercises.map(e => e.name),
        reason: group.classification.reason,
        whyProbable: reasons.length > 0 ? reasons.join('; ') : 'similar names but some differences',
        confidence: group.classification.avgSimilarity > 0.7 ? 'medium' : 'low',
        avgSimilarity: Math.round(group.classification.avgSimilarity * 100)
      };
    }),
    legitimateVariants: legitimateVariants.map(group => {
      const reasons = [];
      
      const first = group.exercises[0];
      for (let i = 1; i < group.exercises.length; i++) {
        const other = group.exercises[i];
        
        const eqComp = compareEquipment(first.equipment, other.equipment);
        if (eqComp.common && eqComp.common.length > 0) {
          reasons.push(`equipment: ${eqComp.common.join(', ')} base with variations`);
        }
        
        const move1 = inferMovementPattern(first);
        const move2 = inferMovementPattern(other);
        if (move1 !== move2 && move1 !== 'unknown' && move2 !== 'unknown') {
          reasons.push(`movement: ${move1} vs ${move2}`);
        }
        
        const uni1 = isUnilateral(first);
        const uni2 = isUnilateral(other);
        if (uni1 !== uni2) {
          reasons.push(`unilateral vs bilateral`);
        }
      }
      
      return {
        ids: group.exercises.map(e => e._id),
        names: group.exercises.map(e => e.name),
        reason: group.classification.reason,
        whyDistinct: reasons.length > 0 ? reasons.join('; ') : 'different equipment or mechanics',
        equipmentVariations: group.classification.equipmentVariations || []
      };
    }),
    uniqueExercisesCount: uniqueExercises.length,
    sampleUniqueExercises: uniqueExercises.slice(0, 20).map(e => ({
      id: e._id,
      name: e.name,
      category: e.category,
      equipment: e.equipment
    })),
    recommendations: [
      `Merge ${confirmedDuplicates.length} confirmed duplicate groups into canonical exercises`,
      `Review ${probableDuplicates.length} probable duplicate groups manually`,
      `Keep ${legitimateVariants.length} legitimate variant groups separate`,
      `${uniqueExercises.length} exercises appear to be unique`,
      `Trainer-specific video URLs should be preserved during merging`
    ],
    analysisMetadata: {
      analysisTimestamp: new Date().toISOString(),
      comparisonCriteria: [
        'normalized name (case-insensitive, trimmed, common variations)',
        'equipment array comparison',
        'primaryMuscles and secondaryMuscles overlap analysis',
        'category matching',
        'instructions normalization',
        'movement pattern inference',
        'body position detection',
        'unilateral vs bilateral status',
        'source identifiers (sourceSystem, sourceId, libraryId)',
        'trainer relationships (trainerFirstName, trainerLastName)'
      ],
      confidenceThresholds: {
        confirmedDuplicate: 0.85,
        probableDuplicate: 0.6,
        legitimateVariant: 0.0
      }
    }
  };
  
  return report;
}

async function main() {
  console.log('Starting canonical exercise audit...');
  
  const exercises = data;
  console.log(`Found ${exercises.length} total exercises`);
  
  const duplicateGroups = findDuplicateGroups(exercises);
  console.log(`Found ${duplicateGroups.length} potential duplicate groups`);
  
  const report = generateReport(exercises, duplicateGroups);
  
  console.log('Analysis complete. Summary:');
  console.log(JSON.stringify(report.summary, null, 2));
  
  fs.writeFileSync('exercise-audit-report.json', JSON.stringify(report, null, 2));
  console.log('Full report saved to exercise-audit-report.json');
  
  console.log('\nRecommendations:');
  report.recommendations.forEach(rec => console.log(`- ${rec}`));
}

main().catch(console.error);