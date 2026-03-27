import { fetchExercises } from "./convexAdminClient.js";

const exercises = await fetchExercises();
const withVideoUrl = exercises.filter((ex) => !!ex.videoUrl).length;

console.log(
  JSON.stringify(
    {
      total: exercises.length,
      withVideoUrl,
      sample: exercises[0]
        ? { _id: exercises[0]._id, name: exercises[0].name, videoUrl: exercises[0].videoUrl }
        : null,
    },
    null,
    2,
  ),
);
