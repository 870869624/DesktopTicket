export type { StickyNote } from '../../types'

export interface ElectronAPI {
  getNotes: () => Promise<import('../../types').StickyNote[]>
  getNote: (id: string) => Promise<import('../../types').StickyNote | undefined>
  saveNote: (note: Partial<import('../../types').StickyNote>) => Promise<import('../../types').StickyNote>
  deleteNote: (id: string) => Promise<boolean>
  showNoteOnDesktop: (note: import('../../types').StickyNote) => Promise<void>
  hideNoteFromDesktop: (id: string) => Promise<void>
  updateNoteOpacity: (id: string, opacity: number) => Promise<void>
  showNoteContextMenu: (noteId: string) => Promise<void>
  showAllNotes: () => Promise<void>
  hideAllNotes: () => Promise<void>
  onEditNote: (callback: (id: string) => void) => () => void
  onNoteDeleted: (callback: (id: string) => void) => () => void
  onNoteUpdated: (callback: (note: import('../../types').StickyNote) => void) => () => void
}

export interface NoteElectronAPI {
  onNoteData: (callback: (data: import('../../types').StickyNote) => void) => () => void
  showNoteContextMenu: (id: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
