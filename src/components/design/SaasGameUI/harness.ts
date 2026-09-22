/** Authored agent output; executable local fixtures. No model or repository access. */
export const sourceCode = `export function prepareSearch(query: string): string | null {
  return query;
}`;
export const patchCode = `export function prepareSearch(query: string): string | null {
  const value = query.trim();
  return value.length ? value : null;
}`;
export const checkCases = [
  { name: "Reject an empty query", input: "", expected: null },
  { name: "Reject whitespace", input: "   ", expected: null },
  {
    name: "Trim surrounding spaces",
    input: "  agent ui  ",
    expected: "agent ui",
  },
  { name: "Keep a valid query", input: "agent ui", expected: "agent ui" },
];
export interface CheckResult {
  name: string;
  input: string;
  expected: string | null;
  actual: string | null;
  passed: boolean;
}
export function runChecks(patched: boolean): CheckResult[] {
  const prepareSearch = (query: string): string | null => {
    if (!patched) return query;
    const value = query.trim();
    return value.length ? value : null;
  };
  return checkCases.map((test) => {
    const actual = prepareSearch(test.input);
    return { ...test, actual, passed: actual === test.expected };
  });
}

export const runSteps = [
  {
    title: "Read equipped files",
    detail: "Loaded src/search.ts and search.test.ts.",
  },
  {
    title: "Inspect the failure",
    detail: "Empty and padded queries pass through unchanged.",
  },
  {
    title: "Propose a small patch",
    detail: "Trim the input; return null when it is empty.",
  },
];
