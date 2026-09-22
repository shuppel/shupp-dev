/** Pure state rules shared by the site and its small behavior tests. */
export function restoreSelection(raw, validIds) {
  try {
    const value = JSON.parse(raw);
    return new Set(
      Array.isArray(value)
        ? value.filter((id) => typeof id === "string" && validIds.has(id))
        : [],
    );
  } catch {
    return new Set();
  }
}
export function matchesProject(project, category, query) {
  return (
    (category === "all" || project.category === category) &&
    project.search.includes(query.trim().toLowerCase())
  );
}
export function composeBrief({ name, email, interest, idea }, projects) {
  const references = projects.length
    ? projects
        .map(
          (project) =>
            `- ${project.title}: ${new URL(project.href, "https://shupp.dev").href}`,
        )
        .join("\n")
    : "No project references selected.";
  return `Hi Erikk,\n\nI'd like to talk about: ${interest}\n\n${idea.trim()}\n\nA few references from your work:\n${references}\n\n${name.trim()}\n${email.trim()}`;
}
