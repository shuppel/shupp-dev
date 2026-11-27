// Drops blockquotes that start with "NOTE:" from rendered Markdown. Content
// files use them as notes to the author (e.g. "> NOTE: confirm the date"),
// which shouldn't appear on public pages. The source files keep them.
export default function remarkDropEditorNotes() {
  const isNote = (node) => {
    if (node.type !== 'blockquote') return false;
    const first = node.children?.[0];
    const text = first?.type === 'paragraph' && first.children?.[0]?.type === 'text' ? first.children[0].value : '';
    return /^\s*NOTE:/i.test(text);
  };
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.filter((c) => !isNote(c));
    node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}
