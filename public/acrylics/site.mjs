import { Color, mix } from "./spectral.mjs";
import {
  restoreSelection,
  matchesProject,
  composeBrief,
} from "./site-state.mjs";

const root = document.documentElement;
const cards = [...document.querySelectorAll("[data-project]")];
const projects = cards.map((card) => ({
  id: card.dataset.project,
  title: card.querySelector("h3").textContent.replace("↗", "").trim(),
  href: card.querySelector("[data-project-link]").getAttribute("href"),
  description: card.querySelector("[data-description]").textContent,
  category: card.dataset.category,
  pigment: card.dataset.pigment,
  search: card.dataset.search,
  image: card.querySelector("img")?.getAttribute("src"),
  card,
}));
const validIds = new Set(projects.map((project) => project.id));
const storageKey = "shupp.acrylics.collection.v1";
let selected = new Set();
let storageAvailable = true;
try {
  selected = restoreSelection(localStorage.getItem(storageKey), validIds);
} catch {
  storageAvailable = false;
}
let filter = "all";
let query = "";
let noticeTimer;

// Enhancement-only controls stay hidden until their handlers are ready.
function notify(message) {
  const notice = document.querySelector("#save-notice");
  notice.textContent = message;
  notice.classList.add("is-visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.remove("is-visible"), 3000);
}
function selectedProjects() {
  return projects.filter((project) => selected.has(project.id));
}
function persistSelection() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...selected]));
  } catch {
    storageAvailable = false;
  }
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function updateCollection() {
  const saved = selectedProjects();
  const pigment = saved.length
    ? mix(
        ...saved.map((project) => [
          new Color(project.pigment),
          1 / saved.length,
        ]),
      ).toString()
    : "#e2b72d";
  root.style.setProperty("--collection-pigment", pigment);
  document.querySelectorAll("[data-saved-count]").forEach((node) => {
    node.textContent = String(saved.length);
  });
  document.querySelectorAll("[data-save]").forEach((button) => {
    const active = selected.has(button.dataset.save);
    const project = projects.find((item) => item.id === button.dataset.save);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      `${active ? "Unsave" : "Save"} ${project.title}`,
    );
    const symbol = button.querySelector(".save-symbol");
    const label = button.querySelector(".save-label");
    if (symbol) symbol.textContent = active ? "✓" : "+";
    if (label) label.textContent = active ? "Saved" : "Save";
    if (!label)
      button.textContent = active
        ? "Saved to collection ✓"
        : "Save to collection +";
  });
  document.querySelector("#collection-summary").textContent = saved.length
    ? `${saved.length} ${saved.length === 1 ? "piece" : "pieces"}. Your mix.`
    : "A fresh start.";
  document.querySelector("#collection-mixture").textContent = saved.length
    ? `${[...new Set(saved.map((project) => project.category))].join(" + ")} · one shared palette.`
    : "Save a project to begin your collection.";
  const list = document.querySelector("#saved-projects");
  list.replaceChildren(
    ...saved.map((project) => {
      const item = element("li");
      const link = element("a", project.title);
      link.href = project.href;
      const remove = element("button", "Remove");
      remove.type = "button";
      remove.dataset.remove = project.id;
      remove.setAttribute(
        "aria-label",
        `Remove ${project.title} from collection`,
      );
      item.append(link, remove);
      return item;
    }),
  );
  document.querySelector("#clear-collection").disabled = !saved.length;
  document.querySelector("#storage-note").textContent = storageAvailable
    ? "Saved in this browser. Yours to clear."
    : "Browser storage is unavailable. This collection lasts for this visit.";
}
function toggleSave(id) {
  if (!validIds.has(id)) return;
  const project = projects.find((item) => item.id === id);
  const removing = selected.has(id);
  if (removing) selected.delete(id);
  else selected.add(id);
  persistSelection();
  updateCollection();
  notify(
    `${project.title} ${removing ? "removed from" : "added to"} your collection.`,
  );
}
function applyFilter() {
  let count = 0;
  projects.forEach((project) => {
    const matches = matchesProject(project, filter, query);
    project.card.hidden = !matches;
    if (matches) count++;
  });
  document
    .querySelectorAll("[data-filter]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter),
      ),
    );
  document.querySelector("#result-status").textContent =
    `${count} ${count === 1 ? "project" : "projects"} / ${filter === "all" ? "all work" : filter.toLowerCase()}${query.trim() ? ` matching “${query.trim()}”` : ""}`;
  document.querySelector("#empty-results").hidden = count !== 0;
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog.open) dialog.showModal();
}
function showProject(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  const content = document.querySelector("#project-dialog-content");
  document.querySelector("#project-dialog-title").textContent = project.title;
  const nodes = [];
  if (project.image) {
    const image = element("img", undefined, "detail-image");
    image.src = project.image;
    image.alt = `${project.title} project preview`;
    nodes.push(image);
  }
  nodes.push(
    element("p", project.category, "detail-meta"),
    element("p", project.description),
  );
  const actions = element("div", undefined, "dialog-actions");
  const link = element(
    "a",
    "Explore the project ↗",
    "ac-button ac-button--ink",
  );
  link.href = project.href;
  const save = element(
    "button",
    "Save to collection +",
    "ac-button ac-button--cream",
  );
  save.type = "button";
  save.dataset.save = project.id;
  actions.append(link, save);
  nodes.push(actions);
  content.replaceChildren(...nodes);
  updateCollection();
  openDialog("project-dialog");
}
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.save) toggleSave(button.dataset.save);
  if (button.dataset.remove) {
    const oldButtons = [...document.querySelectorAll("[data-remove]")];
    const index = oldButtons.indexOf(button);
    toggleSave(button.dataset.remove);
    const nextButtons = [...document.querySelectorAll("[data-remove]")];
    (
      nextButtons[Math.min(index, nextButtons.length - 1)] ??
      document.querySelector("#collection-to-brief")
    ).focus();
  }
  if (button.dataset.filter) {
    filter = button.dataset.filter;
    applyFilter();
  }
  if (button.dataset.open) openDialog(button.dataset.open);
  if (button.dataset.details) showProject(button.dataset.details);
});
document.querySelector("#project-search").addEventListener("input", (event) => {
  query = event.target.value;
  applyFilter();
});
document.querySelector("#reset-search").addEventListener("click", () => {
  filter = "all";
  query = "";
  document.querySelector("#project-search").value = "";
  applyFilter();
  document.querySelector('[data-filter="all"]').focus();
});
document.querySelector("#clear-collection").addEventListener("click", () => {
  selected.clear();
  persistSelection();
  updateCollection();
  document.querySelector("#collection-to-brief").focus();
  notify("Collection cleared.");
});
document.querySelector("#collection-to-brief").addEventListener("click", () => {
  document.querySelector("#collection-dialog").close();
  const name = document.querySelector('#brief-form [name="name"]');
  document.querySelector("#contact").scrollIntoView();
  name.focus({ preventScroll: true });
});
document.querySelector("#brief-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const draft = composeBrief(data, selectedProjects());
  document.querySelector("#brief-preview").value = draft;
  const mail = new URL("mailto:erikk@shupp.dev");
  mail.searchParams.set("subject", `Let's make something: ${data.interest}`);
  mail.searchParams.set("body", draft);
  document.querySelector("#email-draft").href = mail.href.replace(/\+/g, "%20");
  document.querySelector("#copy-status").textContent = "";
  openDialog("brief-dialog");
});
document.querySelector("#copy-brief").addEventListener("click", async () => {
  const preview = document.querySelector("#brief-preview");
  try {
    await navigator.clipboard.writeText(preview.value);
    document.querySelector("#copy-status").textContent =
      "Draft copied. Ready when you are.";
  } catch {
    preview.focus();
    preview.select();
    document.querySelector("#copy-status").textContent =
      "Select and copy the draft above. Clipboard access is unavailable.";
  }
});
// Keep collections in sync when this portfolio is open in more than one tab.
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) {
    selected = restoreSelection(event.newValue, validIds);
    updateCollection();
  }
});
updateCollection();
document
  .querySelectorAll(
    ".work-toolbar, #result-status, #brief-form, [data-save], [data-details], [data-open]",
  )
  .forEach((node) => {
    node.hidden = false;
  });

// The painted navigation mark follows the section currently being read.
const navigation = [...document.querySelectorAll(".main-nav a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigation.forEach((link) => {
        const current = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("nav-current", current);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  },
  { rootMargin: "-5% 0px -65% 0px" },
);
for (const id of ["work", "about", "contact"])
  sectionObserver.observe(document.getElementById(id));
