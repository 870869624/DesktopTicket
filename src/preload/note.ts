import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onNoteData: (callback: (data: any) => void) => {
    ipcRenderer.on('note-data', (_, data) => callback(data))
  },
  showNoteContextMenu: (id: string) => ipcRenderer.invoke('show-note-context-menu', id)
})
