const maxConcurrent = Math.max(1, Number(process.env.PDF_MAX_CONCURRENT) || 2);
const maxQueued = Math.max(maxConcurrent, Number(process.env.PDF_MAX_QUEUE) || 100);
let active = 0;
const waiting = [];

const acquire = () => new Promise((resolve, reject) => {
  if (active < maxConcurrent) {
    active += 1;
    resolve();
    return;
  }
  if (waiting.length >= maxQueued) {
    const error = new Error('Certificate generation is busy. Please try again shortly.');
    error.statusCode = 503;
    reject(error);
    return;
  }
  waiting.push(resolve);
});

const release = () => {
  const next = waiting.shift();
  if (next) next();
  else active = Math.max(0, active - 1);
};

export const withPdfGenerationLimit = async (generate) => {
  await acquire();
  try {
    return await generate();
  } finally {
    release();
  }
};
