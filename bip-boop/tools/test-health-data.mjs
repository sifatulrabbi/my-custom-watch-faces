import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../watchface/health-data.js", import.meta.url),
  "utf8",
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { getSuccessfulSpo2Value } = await import(moduleUrl);

assert.equal(
  getSuccessfulSpo2Value({ value: 98, retCode: 2 }),
  98,
  "a successful SpO2 measurement must be displayed",
);

for (const retCode of [0, 1, 3, 4, 5, 6, 7, 8, 9, 10]) {
  assert.equal(
    getSuccessfulSpo2Value({ value: 98, retCode }),
    null,
    `SpO2 retCode ${retCode} must not be displayed as a valid reading`,
  );
}

assert.equal(
  getSuccessfulSpo2Value({ value: 0, retCode: 2 }),
  null,
  "an impossible zero SpO2 value must use the empty state",
);

console.log("health data tests passed");
