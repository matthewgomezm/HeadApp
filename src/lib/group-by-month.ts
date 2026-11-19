/** Groups items by local calendar month, newest month and newest item first. */
export function groupByMonth<T extends { startedAt: Date }>(items: T[]): { label: string; items: T[] }[] {
  const sorted = [...items].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const it of sorted) {
    const d = it.startedAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }), items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups.map(({ label, items }) => ({ label, items }));
}
