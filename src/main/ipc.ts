import { ipcMain, BrowserWindow, Menu, screen } from 'electron'
import { join } from 'path'
import { getNotes, getNote, saveNote, deleteNote } from './store'
import type { StickyNote } from '../types'

const noteWindows = new Map<string, BrowserWindow>()

export function setupIPC(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('get-notes', () => {
    return getNotes()
  })

  ipcMain.handle('get-note', (_, id: string) => {
    return getNote(id)
  })

  ipcMain.handle('save-note', (_, note: Partial<StickyNote>) => {
    const saved = saveNote(note)
    if (noteWindows.has(saved.id)) {
      updateNoteWindow(noteWindows.get(saved.id)!, saved)
    }
    return saved
  })

  ipcMain.handle('delete-note', (_, id: string) => {
    closeNoteWindow(id)
    return deleteNote(id)
  })

  ipcMain.handle('show-note-on-desktop', (_, note: StickyNote) => {
    if (noteWindows.has(note.id)) {
      updateNoteWindow(noteWindows.get(note.id)!, note)
    } else {
      createNoteWindow(note, getMainWindow)
    }
  })

  ipcMain.handle('hide-note-from-desktop', (_, id: string) => {
    closeNoteWindow(id)
  })

  ipcMain.handle('update-note-opacity', (_, id: string, opacity: number) => {
    if (noteWindows.has(id)) {
      noteWindows.get(id)!.setOpacity(opacity)
    }
    saveNote({ id, opacity })
  })

  ipcMain.handle('show-note-context-menu', (_, noteId: string) => {
    const note = getNote(noteId)
    const noteWin = noteWindows.get(noteId)
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '编辑',
        click: () => {
          const win = getMainWindow()
          if (win) {
            win.webContents.send('edit-note', noteId)
            win.show()
          }
        }
      },
      {
        label: note?.isPinned ? '取消置顶' : '置顶',
        click: () => {
          const updated = saveNote({ id: noteId, isPinned: !note?.isPinned })
          if (noteWindows.has(noteId)) {
            noteWindows.get(noteId)!.setAlwaysOnTop(updated.isPinned)
            noteWindows.get(noteId)!.webContents.send('note-data', updated)
          }
        }
      },
      { type: 'separator' },
      {
        label: '透明度',
        submenu: [
          { label: '100%', click: () => setNoteOpacity(noteId, 1) },
          { label: '80%', click: () => setNoteOpacity(noteId, 0.8) },
          { label: '60%', click: () => setNoteOpacity(noteId, 0.6) },
          { label: '40%', click: () => setNoteOpacity(noteId, 0.4) },
          { label: '20%', click: () => setNoteOpacity(noteId, 0.2) }
        ]
      },
      { type: 'separator' },
      {
        label: '隐藏',
        click: () => {
          closeNoteWindow(noteId)
        }
      },
      {
        label: '删除',
        click: () => {
          deleteNote(noteId)
          closeNoteWindow(noteId)
          const win = getMainWindow()
          if (win) {
            win.webContents.send('note-deleted', noteId)
          }
        }
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup(noteWin ? { window: noteWin } : undefined)
  })

  ipcMain.handle('show-all-notes', () => {
    const notes = getNotes()
    notes.forEach(note => {
      if (!noteWindows.has(note.id)) {
        createNoteWindow(note, getMainWindow)
      }
    })
  })

  ipcMain.handle('hide-all-notes', () => {
    noteWindows.forEach(win => win.close())
    noteWindows.clear()
  })
}

function closeNoteWindow(id: string) {
  if (noteWindows.has(id)) {
    const win = noteWindows.get(id)!
    noteWindows.delete(id)
    win.destroy()
  }
}

function createNoteWindow(note: StickyNote, getMainWindow: () => BrowserWindow | null) {
  const { x, y, width, height } = note
  const displays = screen.getAllDisplays()
  const isVisible = displays.some(d => {
    const { x: dx, y: dy, width: dw, height: dh } = d.bounds
    return x >= dx && y >= dy && x < dx + dw && y < dy + dh
  })
  const posX = isVisible ? x : 100
  const posY = isVisible ? y : 100

  const noteWindow = new BrowserWindow({
    x: posX,
    y: posY,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: note.isPinned !== false,
    resizable: !note.isFixed,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/note.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  noteWindow.setOpacity(note.opacity)
  if (process.env.ELECTRON_RENDERER_URL) {
    noteWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/note.html`)
  } else {
    noteWindow.loadFile(join(__dirname, '../renderer/note.html'))
  }

  noteWindow.webContents.on('did-finish-load', () => {
    noteWindow.webContents.send('note-data', note)
  })

  if (!note.isFixed) {
    noteWindow.on('moved', () => {
      const bounds = noteWindow.getBounds()
      const saved = saveNote({ id: note.id, x: bounds.x, y: bounds.y })
      const win = getMainWindow()
      if (win) {
        win.webContents.send('note-updated', saved)
      }
    })

    noteWindow.on('resized', () => {
      const bounds = noteWindow.getBounds()
      const saved = saveNote({ id: note.id, width: bounds.width, height: bounds.height })
      const win = getMainWindow()
      if (win) {
        win.webContents.send('note-updated', saved)
      }
    })
  }

  noteWindows.set(note.id, noteWindow)
}

function updateNoteWindow(win: BrowserWindow, note: StickyNote) {
  win.webContents.send('note-data', note)
  win.setOpacity(note.opacity)
  win.setAlwaysOnTop(note.isPinned !== false)
  if (!note.isFixed) {
    win.setResizable(true)
  }
}

function setNoteOpacity(id: string, opacity: number) {
  if (noteWindows.has(id)) {
    noteWindows.get(id)!.setOpacity(opacity)
  }
  saveNote({ id, opacity })
}
