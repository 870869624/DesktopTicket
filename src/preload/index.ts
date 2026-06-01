import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  getNote: (id: string) => ipcRenderer.invoke('get-note', id),
  saveNote: (note: Record<string, unknown>) => ipcRenderer.invoke('save-note', note),
  deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),
  showNoteOnDesktop: (note: Record<string, unknown>) => ipcRenderer.invoke('show-note-on-desktop', note),
  hideNoteFromDesktop: (id: string) => ipcRenderer.invoke('hide-note-from-desktop', id),
  updateNoteOpacity: (id: string, opacity: number) => ipcRenderer.invoke('update-note-opacity', id, opacity),
  showNoteContextMenu: (noteId: string) => ipcRenderer.invoke('show-note-context-menu', noteId),
  showAllNotes: () => ipcRenderer.invoke('show-all-notes'),
  hideAllNotes: () => ipcRenderer.invoke('hide-all-notes'),
  onEditNote: (callback: (id: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, id: string) => callback(id)
    ipcRenderer.on('edit-note', handler)
    return () => { ipcRenderer.removeListener('edit-note', handler) }
  },
  onNoteDeleted: (callback: (id: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, id: string) => callback(id)
    ipcRenderer.on('note-deleted', handler)
    return () => { ipcRenderer.removeListener('note-deleted', handler) }
  },
  onNoteUpdated: (callback: (note: Record<string, unknown>) => void) => {
    const handler = (_: Electron.IpcRendererEvent, note: Record<string, unknown>) => callback(note)
    ipcRenderer.on('note-updated', handler)
    return () => { ipcRenderer.removeListener('note-updated', handler) }
  }
})
