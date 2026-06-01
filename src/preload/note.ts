import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onNoteData: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data)
    ipcRenderer.on('note-data', handler)
    return () => {
      ipcRenderer.removeListener('note-data', handler)
    }
  },
  showNoteContextMenu: (id: string) => ipcRenderer.invoke('show-note-context-menu', id)
})
