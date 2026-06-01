export interface StickyNote {
  id: string
  title: string
  content: string
  color: string
  fontFamily: string
  fontSize: number
  x: number
  y: number
  width: number
  height: number
  opacity: number
  isFixed: boolean
  createdAt: string
  updatedAt: string
}

export interface ElectronAPI {
  getNotes: () => Promise<StickyNote[]>
  getNote: (id: string) => Promise<StickyNote | undefined>
  saveNote: (note: Partial<StickyNote>) => Promise<StickyNote>
  deleteNote: (id: string) => Promise<boolean>
  showNoteOnDesktop: (note: StickyNote) => Promise<void>
  hideNoteFromDesktop: (id: string) => Promise<void>
  updateNoteOpacity: (id: string, opacity: number) => Promise<void>
  showNoteContextMenu: (noteId: string) => Promise<void>
  showAllNotes: () => Promise<void>
  hideAllNotes: () => Promise<void>
  onEditNote: (callback: (id: string) => void) => void
  onNoteDeleted: (callback: (id: string) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
