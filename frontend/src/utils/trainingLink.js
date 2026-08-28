/**
 * Public URL for a training session.
 * Prefers the readable slug and falls back to the id for records created before slugs existed.
 */
export const trainingPath = (training) => `/trainings/${training?.slug || training?._id}`;
