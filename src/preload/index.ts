import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  getNote: (id: string) => ipcRenderer.invoke('get-note', id),
  saveNote: (note: any) => ipcRenderer.invoke('save-note', note),
  deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),
  showNoteOnDesktop: (note: any) => ipcRenderer.invoke('show-note-on-desktop', note),
  hideNoteFromDesktop: (id: string) => ipcRenderer.invoke('hide-note-from-desktop', id),
  updateNoteOpacity: (id: string, opacity: number) => ipcRenderer.invoke('update-note-opacity', id, opacity),
  showNoteContextMenu: (noteId: string) => ipcRenderer.invoke('show-note-context-menu', noteId),
  showAllNotes: () => ipcRenderer.invoke('show-all-notes'),
  hideAllNotes: () => ipcRenderer.invoke('hide-all-notes'),
  onEditNote: (callback: (id: string) => void) => {
    ipcRenderer.on('edit-note', (_, id) => callback(id))
  },
  onNoteDeleted: (callback: (id: string) => void) => {
    ipcRenderer.on('note-deleted', (_, id) => callback(id))
  },
  onNoteUpdated: (callback: (note: any) => void) => {
    ipcRenderer.on('note-updated', (_, note) => callback(note))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
