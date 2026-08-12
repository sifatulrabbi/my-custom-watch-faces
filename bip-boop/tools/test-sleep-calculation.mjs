import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../watchface/sleep-calculation.js", import.meta.url),
  "utf8",
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { calculateSleepMinutes } = await import(moduleUrl);

assert.equal(
  calculateSleepMinutes(
    414,
    [
      { model: 1, start: 1320, stop: 1380 },
      { model: 0, start: 1380, stop: 1398 },
      { model: 2, start: 1398, stop: 294 },
    ],
    0,
  ),
  396,
  "6H54 total minus 18 awake minutes must display as 6H36",
);

assert.equal(
  calculateSleepMinutes(420, [{ model: 0, start: 1435, stop: 5 }], 0),
  410,
  "awake stages crossing midnight must be calculated correctly",
);

assert.equal(
  calculateSleepMinutes(396, [{ model: 1, start: 0, stop: 18 }], 0),
  396,
  "non-awake stages must not reduce sleep time",
);

assert.equal(
  calculateSleepMinutes(396, [], 0),
  396,
  "the sensor total must remain the fallback when stage data is unavailable",
);

console.log("sleep calculation tests passed");
