export const NOTE_COLORS = [
  '#FFF9C4',
  '#FFE5E5',
  '#E3F2FD',
  '#E8F5E9',
  '#F3E5F5',
] as const

export type NoteColor = typeof NOTE_COLORS[number]

export function isValidNoteColor(color: string): color is NoteColor {
  return NOTE_COLORS.includes(color as NoteColor)
}