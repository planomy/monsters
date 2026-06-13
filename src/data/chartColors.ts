export const CHART_COLORS = [
  '#7c3aed',
  '#a855f7',
  '#4c1d95',
  '#c084fc',
  '#6d28d9',
  '#ddd6fe',
  '#9333ea',
  '#581c87',
  '#e9d5ff',
  '#5b21b6',
]

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
