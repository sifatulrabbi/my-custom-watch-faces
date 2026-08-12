const MINUTES_PER_DAY = 24 * 60;

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const stageDuration = (start, stop) => {
  if (!isNonNegativeNumber(start) || !isNonNegativeNumber(stop)) return 0;

  const duration = stop - start;
  return duration >= 0 ? duration : duration + MINUTES_PER_DAY;
};

export const calculateSleepMinutes = (totalTime, stages, wakeStage) => {
  const totalMinutes = isNonNegativeNumber(totalTime) ? totalTime : 0;
  if (!Array.isArray(stages) || typeof wakeStage !== "number") {
    return totalMinutes;
  }

  let awakeMinutes = 0;
  stages.forEach((stage) => {
    if (stage && stage.model === wakeStage) {
      awakeMinutes += stageDuration(stage.start, stage.stop);
    }
  });

  return Math.max(totalMinutes - awakeMinutes, 0);
};
