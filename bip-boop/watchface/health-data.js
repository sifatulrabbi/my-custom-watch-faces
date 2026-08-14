const SPO2_MEASUREMENT_SUCCESS = 2;

const isPositiveFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const getSuccessfulSpo2Value = (result) => {
  if (
    !result ||
    result.retCode !== SPO2_MEASUREMENT_SUCCESS ||
    !isPositiveFiniteNumber(result.value)
  ) {
    return null;
  }

  return result.value;
};
