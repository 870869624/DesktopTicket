import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onNoteData: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: Record<string, unknown>) => callback(data)
    ipcRenderer.on('note-data', handler)
    return () => { ipcRenderer.removeListener('note-data', handler) }
  },
  showNoteContextMenu: (id: string) => ipcRenderer.invoke('show-note-context-menu', id)
})
