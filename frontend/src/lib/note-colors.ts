export const NOTE_COLORS = {
  light: [
    { bg: '#fef08a', border: '#eab308' },  // yellow
    { bg: '#bbf7d0', border: '#22c55e' },  // green
    { bg: '#bfdbfe', border: '#3b82f6' },  // blue
    { bg: '#fecaca', border: '#ef4444' },  // red
    { bg: '#e9d5ff', border: '#a855f7' },  // purple
  ],
  dark: [
    { bg: '#854d0e', border: '#ca8a04' },  // yellow
    { bg: '#166534', border: '#16a34a' },  // green
    { bg: '#1e40af', border: '#2563eb' },  // blue
    { bg: '#991b1b', border: '#dc2626' },  // red
    { bg: '#6b21a8', border: '#9333ea' },  // purple
  ],
} as const;

export type NoteColorIndex = 0 | 1 | 2 | 3 | 4;

export function getNoteColor(index: NoteColorIndex, theme: 'light' | 'dark') {
  return NOTE_COLORS[theme][index];
}