import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

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

interface StoreData {
  notes: StickyNote[]
}

const store = new Store<StoreData>({
  defaults: {
    notes: []
  }
})

export function getNotes(): StickyNote[] {
  return store.get('notes', [])
}

export function getNote(id: string): StickyNote | undefined {
  const notes = getNotes()
  return notes.find(n => n.id === id)
}

export function saveNote(note: Partial<StickyNote> & { id?: string }): StickyNote {
  const notes = getNotes()
  const now = new Date().toISOString()

  if (note.id) {
    const index = notes.findIndex(n => n.id === note.id)
    if (index !== -1) {
      notes[index] = { ...notes[index], ...note, updatedAt: now }
      store.set('notes', notes)
      return notes[index]
    }
  }

  const newNote: StickyNote = {
    id: uuidv4(),
    title: note.title || '新便签',
    content: note.content || '',
    color: note.color || '#FFEB3B',
    fontFamily: note.fontFamily || 'Microsoft YaHei',
    fontSize: note.fontSize || 14,
    x: note.x || 100,
    y: note.y || 100,
    width: note.width || 200,
    height: note.height || 200,
    opacity: note.opacity ?? 1,
    isFixed: note.isFixed ?? false,
    createdAt: now,
    updatedAt: now
  }

  notes.push(newNote)
  store.set('notes', notes)
  return newNote
}

export function deleteNote(id: string): boolean {
  const notes = getNotes()
  const filtered = notes.filter(n => n.id !== id)
  if (filtered.length < notes.length) {
    store.set('notes', filtered)
    return true
  }
  return false
}
