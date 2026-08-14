import Training from '../models/Training.js';

export const resolveTrainingScope = async (query, names = {}) => {
  const training = query[names.training || 'training'];
  const event = query[names.event || 'event'];
  const eventDay = query[names.eventDay || 'eventDay'];
  if (training) return training;
  if (!event && !eventDay) return null;
  const filter = {};
  if (event) filter.event = event;
  if (eventDay) filter.eventDay = eventDay;
  return { $in: await Training.find(filter).distinct('_id') };
};
