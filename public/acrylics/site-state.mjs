/** Pure color and export rules for the Acrylics design-system reference. */
export function schemeCss(scheme) {
  return `.ac-site {\n  color-scheme: ${scheme.colorScheme};\n${Object.entries(
    scheme.roles,
  )
    .map(([key, value]) => `  --ac-${key}: ${value};`)
    .join("\n")}\n}`;
}
export function digitalCoat(first, second, coverage) {
  const rgb = (hex) =>
    hex
      .slice(1)
      .match(/../g)
      .map((channel) => parseInt(channel, 16));
  const base = rgb(first),
    coat = rgb(second);
  const alpha = Math.max(0, Math.min(1, coverage));
  return (
    "#" +
    base
      .map((channel, index) =>
        Math.round(
          channel * (1 - alpha) + ((channel * coat[index]) / 255) * alpha,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}
