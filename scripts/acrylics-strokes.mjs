import { writeFile } from "node:fs/promises";
import { PRESSURE_PROFILES, strokeSvg } from "../public/acrylics/pressure.mjs";

// Commit the generated masks so components work without browser JavaScript.
for (const [name, profile] of Object.entries(PRESSURE_PROFILES)) {
  const filename = name === "swell" ? "stroke.svg" : `stroke-${name}.svg`;
  await writeFile(
    new URL(`../public/acrylics/${filename}`, import.meta.url),
    strokeSvg(profile) + "\n",
  );
}
