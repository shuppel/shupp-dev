import { Color, mix } from "./spectral.mjs";
import { schemeCss, digitalCoat } from "./site-state.mjs";
import { PRESSURE_PROFILES, strokeSvg } from "./pressure.mjs";

const pressureInputs = [
  ...document.querySelectorAll(".pressure-control input"),
];
function updatePressure() {
  const max = Number(document.querySelector("#pressure-width").value);
  const peak = Number(document.querySelector("#pressure-peak").value) / 100;
  const spread = Number(document.querySelector("#pressure-spread").value) / 100;
  document.querySelector("#pressure-width-value").value = `${max} units`;
  document.querySelector("#pressure-peak-value").value =
    `${Math.round(peak * 100)}%`;
  document.querySelector("#pressure-spread-value").value = spread.toFixed(2);
  document.querySelector("#pressure-stroke").innerHTML = strokeSvg({
    ...PRESSURE_PROFILES.swell,
    max,
    peak,
    spread,
  });
}
pressureInputs.forEach((input) => {
  input.addEventListener("input", updatePressure);
  input.disabled = false;
});

const root = document.documentElement;
let tokens;
let scheme;
const ratio = document.querySelector("#mix-ratio");
const pigmentMix = (first, second, proportion) => {
  if (proportion <= 0) return first;
  if (proportion >= 1) return second;
  return mix(
    [new Color(first), 1 - proportion],
    [new Color(second), proportion],
  ).toString();
};
function updateMix() {
  const a = scheme.roles.pigment,
    b = scheme.roles["pigment-2"];
  const fraction = Number(ratio.value) / 100;
  const paint = pigmentMix(a, b, fraction);
  const digital = digitalCoat(a, b, fraction);
  document.querySelector("#mix-percent").value = `${ratio.value}%`;
  document.querySelector("#pigment-result").style.background = paint;
  document.querySelector("#pigment-value").textContent = paint;
  document.querySelector("#digital-result").style.background = digital;
  document.querySelector("#digital-value").textContent = digital;
  const stops = Array.from({ length: 9 }, (_, index) => {
    const swatch = document.createElement("span");
    const value = pigmentMix(a, b, index / 8);
    swatch.style.background = value;
    swatch.title = `${Math.round((index / 8) * 100)}% pigment B: ${value}`;
    swatch.setAttribute("aria-label", swatch.title);
    return swatch;
  });
  document.querySelector("#mix-scale").replaceChildren(...stops);
}
function applyScheme(name, announce = true) {
  if (!Object.hasOwn(tokens.schemes, name)) return;
  scheme = tokens.schemes[name];
  root.dataset.scheme = name;
  root.style.colorScheme = scheme.colorScheme;
  Object.entries(scheme.roles).forEach(([key, value]) =>
    root.style.setProperty(`--ac-${key}`, value),
  );
  document.querySelector('meta[name="theme-color"]').content =
    scheme.roles.field;
  document
    .querySelectorAll("#scheme-options button")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.value === name),
      ),
    );
  document.querySelectorAll("[data-token]").forEach((node) => {
    node.textContent = scheme.roles[node.dataset.token];
  });
  document.querySelectorAll("[data-pigment]").forEach((node) => {
    node.textContent = scheme.roles[node.dataset.pigment];
  });
  document.querySelector("#scheme-description").textContent =
    scheme.description;
  document.querySelector("#scheme-css code").textContent = schemeCss(scheme);
  document.querySelector("#copy-status").textContent = "";
  document.querySelector("#action-status").textContent =
    "Apply color previews a local confirmation.";
  document.querySelector("#action-status").removeAttribute("data-state");
  updateMix();
  if (announce)
    document.querySelector("#scheme-status").textContent =
      `${scheme.label} scheme applied to the page. Swatches, component colors, and CSS tokens updated.`;
}
const materialCopy = {
  stroke: "Stroke: directional emphasis and selection.",
  blot: "Blot: a compact mark for a named signal or state.",
  layer: "Layer: related surfaces grouped through overlapping paint.",
};
document.querySelector("#scheme-options").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button && tokens) applyScheme(button.dataset.value);
});
ratio.addEventListener("input", updateMix);
document
  .querySelector("#material-options")
  .addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !Object.hasOwn(materialCopy, button.dataset.value)) return;
    document
      .querySelectorAll("#material-options button")
      .forEach((node) =>
        node.setAttribute("aria-pressed", String(node === button)),
      );
    document.querySelector("#selected-material").textContent =
      materialCopy[button.dataset.value];
  });
document.querySelector("#apply-example").addEventListener("click", () => {
  const status = document.querySelector("#action-status");
  status.textContent = `✓ ${scheme.label} action color applied: ${scheme.roles.accent}.`;
  status.dataset.state = "success";
});
document.querySelector("#pin-example").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const pinned = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(pinned));
  button.querySelector("span:last-child").textContent = pinned
    ? "✓ Pinned"
    : "+ Pin";
  document.querySelector("#pin-status").textContent = pinned
    ? "The toggle is selected. The check and label confirm the state."
    : "The toggle is unselected.";
});
document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () =>
    document.getElementById(button.dataset.open).showModal(),
  );
});
const email = document.querySelector("#example-email");
const feedback = document.querySelector("#field-feedback");
document.querySelector("#example-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const valid = email.checkValidity();
  email.setAttribute("aria-invalid", String(!valid));
  feedback.dataset.state = valid ? "success" : "error";
  feedback.textContent = valid
    ? "✓ Valid address. This is a local validation example; nothing was sent."
    : "Enter an email address such as name@example.com.";
  if (!valid) email.focus();
});
email.addEventListener("input", () => {
  email.removeAttribute("aria-invalid");
  feedback.removeAttribute("data-state");
  feedback.textContent = "Validate the example to check its format.";
});
document.querySelector("#copy-tokens").addEventListener("click", async () => {
  const content = schemeCss(scheme);
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(content);
    status.textContent = `${scheme.label} CSS copied.`;
  } catch {
    const pre = document.querySelector("#scheme-css");
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(pre);
    selection.removeAllRanges();
    selection.addRange(range);
    pre.focus();
    status.textContent =
      "Clipboard access is unavailable. The CSS is selected; copy it with your keyboard.";
  }
});
// Navigation is tied to the section being read, including unlinked sections.
const navigation = [...document.querySelectorAll(".main-nav a")];
const anchors = {
  colors: "#colors",
  material: "#colors",
  components: "#components",
  type: "#rules",
  rules: "#rules",
  use: "#rules",
};
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigation.forEach((link) => {
        const active = link.getAttribute("href") === anchors[entry.target.id];
        link.classList.toggle("nav-current", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  },
  { rootMargin: "-5% 0px -65% 0px" },
);
Object.keys(anchors).forEach((id) =>
  observer.observe(document.getElementById(id)),
);

try {
  const response = await fetch("/acrylics/acrylics.tokens.json");
  if (!response.ok) throw new Error("Tokens unavailable");
  tokens = await response.json();
  applyScheme(tokens.defaultScheme, false);
  document
    .querySelectorAll(
      "#scheme-options button, #material-options button, #mix-ratio, #apply-example, #pin-example, #validate-example, #copy-tokens, [data-open]",
    )
    .forEach((node) => {
      node.disabled = false;
    });
} catch {
  document.querySelector("#system-status").textContent =
    "Interactive examples could not load. The Market reference and downloads remain available; reload to try again.";
}
