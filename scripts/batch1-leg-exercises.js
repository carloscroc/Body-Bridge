// Batch 1: Leg Exercises Image Generation
const legImageGenerations = [
  {
    id: "barbell-squat",
    name: "Barbell Squat",
    imageKeywords: "barbell squat proper form professional gym fitness",
    imageUrl: "https://images.unsplash.com/photo-1571019640819-6588568e295?w=800&q=barbell+squat+proper+form+gym&auto=format&fit=crop",
    imageRequirements: "Front view: athlete in squat position with barbell on shoulders, knees slightly bent, thighs parallel to ground. Equipment visible: barbell, squat rack, weight plates. Background: gym setting or professional studio. Model: athletic fitness type demonstrating proper form and full range of motion."
  },
  {
    id: "deadlift",
    name: "Deadlift",
    imageKeywords: "deadlift proper form professional fitness strength",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=deadlift+proper+form+strength&auto=format&fit=crop",
    imageRequirements: "Side view: athlete lifting barbell from floor with flat back, proper hip hinge. Equipment visible: barbell, weight plates. Background: gym setting with professional lighting. Model: athletic fitness type showing starting and finishing position with emphasis on posterior chain activation."
  },
  {
    id: "front-squat",
    name: "Front Squat",
    imageKeywords: "front squat proper form professional gym fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=front+squat+proper+form+gym&auto=format&fit=crop",
    imageRequirements: "Side view: athlete in front squat position with barbell on front shoulders, maintaining upright torso. Equipment visible: barbell, front squat rack. Background: gym setting. Model: athletic fitness type showing proper quad activation and depth."
  },
  {
    id: "lunges",
    name: "Lunges",
    imageKeywords: "lunge exercise proper form professional fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=lunge+proper+form+fitness&auto=format&fit=crop",
    imageRequirements: "Side view: athlete in mid-lunge position with front knee at 90 degrees and back knee nearly touching ground, holding dumbbells at sides. Equipment visible: dumbbells. Background: gym or fitness studio. Model: athletic fitness type demonstrating proper lunge mechanics and balance."
  },
  {
    id: "leg-press",
    name: "Leg Press",
    imageKeywords: "leg press machine exercise professional fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=leg+press+machine+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete seated at leg press machine with feet shoulder-width apart, pressing weight platform upward. Equipment visible: machine, weight stack. Background: professional gym setting. Model: athletic fitness type showing quad engagement and proper form."
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    imageKeywords: "bulgarian split squat exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=bulgarian+split+squat+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete with one foot behind you on bench, other foot on ground in split squat position. Equipment visible: bench, dumbbells. Background: gym setting. Model: athletic fitness type demonstrating unilateral leg strength and glute activation."
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    imageKeywords: "leg curl machine exercise professional fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=leg+curl+machine+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete sitting at leg curl machine with pad against lower legs, curling weight toward glutes. Equipment visible: machine. Background: professional gym setting. Model: athletic fitness type showing hamstring isolation and proper form."
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    imageKeywords: "leg extension machine exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=leg+extension+machine&exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete sitting at leg extension machine with pad against shins, extending legs to straight position. Equipment visible: machine. Background: gym setting. Model: athletic fitness type showing quad development and full range of motion."
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    imageKeywords: "calf raise exercise professional fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=calf+raise+exercise&fitness&auto=format&fit=crop",
    imageRequirements: "Side view: athlete standing on raised platform with heels hanging off, pushing up onto toes as high as possible. Equipment visible: platform or step. Background: gym setting. Model: athletic fitness type showing calf isolation and full range of motion."
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    imageKeywords: "hip thrust exercise professional fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=hip+thrust+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete sitting on ground with upper back against bench, rolling barbell over hips. Equipment visible: barbell, bench. Background: gym setting. Model: athletic fitness type showing glute activation and hip extension."
  },
  {
    id: "front-squat-2",
    name: "Front Squat (duplicate)",
    imageKeywords: "front squat proper form fitness alternative",
    imageUrl: "https://images.unsplash.com/photo-1571019640819-6588568e295?w=800&q=front+squat+fitness&auto=format&fit=crop",
    imageRequirements: "Side view: athlete performing front squat variation."
  },
  {
    id: "good-morning",
    name: "Good Morning",
    imageKeywords: "good morning exercise proper form fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=good+morning+exercise+auto=format&fit=crop",
    imageRequirements: "Side view: athlete with barbell on upper back as for squat, hinging at hips, lowering torso. Equipment visible: barbell. Background: gym setting or outdoor fitness location. Model: athletic fitness type showing posterior chain engagement and proper hip mechanics."
  },
  {
    id: "single-leg-deadlift",
    name: "Single-Leg Deadlift",
    imageKeywords: "single leg deadlift exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=single+leg+deadlift+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete standing on one leg, holding dumbbell in opposite hand, performing unilateral deadlift."
  },
  {
    id: "box-jump",
    name: "Box Jump",
    imageKeywords: "box jump plyometric exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=box+jump+plyometric+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete standing in front of sturdy box or platform, swinging arms and jumping onto box with both feet. Equipment visible: box or platform. Background: gym setting. Model: athletic fitness type showing explosive power and proper landing mechanics."
  },
  {
    id: "farmers-walk",
    name: "Farmer's Walk",
    imageKeywords: "farmers walk exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=farmers+walk+fitness&auto=format&fit=crop",
    imageRequirements: "Side view: athlete walking with heavy dumbbells in each hand, maintaining tall posture and tight core. Equipment visible: dumbbells. Background: gym or outdoor track. Model: athletic fitness type showing grip strength and functional carrying."
  },
  {
    id: "step-up",
    name: "Step-up",
    imageKeywords: "step up exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=step+up+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete holding dumbbells and standing in front of raised platform, stepping up onto it. Equipment visible: platform or box. Background: gym setting. Model: athletic fitness type showing unilateral leg strength and proper form."
  },
  {
    id: "dumbbell-shrug",
    name: "Dumbbell Shrug",
    imageKeywords: "dumbbell shrug exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=dumbbell+shrug+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete standing with dumbbells at sides, shrugging shoulders up toward ears. Equipment visible: dumbbells. Background: gym setting. Model: athletic fitness type showing trap activation and proper form."
  },
  {
    id: "preacher-curl",
    name: "Preacher Curl",
    imageKeywords: "preacher curl exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=preacher+curl+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete sitting at preacher bench with upper arms resting on pads, curling weight toward shoulders. Equipment visible: preacher bench, barbell or dumbbells. Background: gym setting. Model: athletic fitness type showing bicep isolation and peak development."
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    imageKeywords: "hack squat machine exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=hack+squat+machine+exercise&auto=format&fit=crop",
    imageRequirements: "Side view: athlete positioned on hack squat machine with shoulders under pads, lowering body by bending knees. Equipment visible: machine. Background: gym setting. Model: athletic fitness type showing quad isolation and controlled movement."
  },
  {
    id: "dumbbell-wrist-curl",
    name: "Dumbbell Wrist Curl",
    imageKeywords: "wrist curl exercise fitness",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=wrist+curl+exercise+auto=format&fit=crop",
    imageRequirements: "Side view: athlete sitting on bench with forearms resting on thighs, holding dumbbells with underhand grip, wrists hanging off knees. Equipment visible: bench, dumbbells. Background: professional gym setting. Model: athletic fitness type showing forearm isolation and proper form."
  }
];

console.log('=== Leg Exercises Batch 1 Generation ===');
console.log(`Total images to generate: ${legImageGenerations.length}`);
console.log('Image requirements defined for each exercise');
console.log('Unsplash URLs constructed with search keywords');
console.log('Batch saved for execution');

module.exports = { legImageGenerations };