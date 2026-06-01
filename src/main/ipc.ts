import { ipcMain, BrowserWindow, Menu, screen } from 'electron'
import { join } from 'path'
import { getNotes, getNote, saveNote, deleteNote } from './store'
import type { StickyNote } from '../types'

const noteWindows = new Map<string, BrowserWindow>()
const SNAP_THRESHOLD = 12

function snapToNearbyWindows(movedId: string, bounds: { x: number; y: number; width: number; height: number }): { x: number; y: number } {
  let { x, y } = bounds
  const { width, height } = bounds
  let snappedX = false
  let snappedY = false

  for (const [id, win] of noteWindows) {
    if (id === movedId || win.isDestroyed()) continue
    const other = win.getBounds()

    // 左边对齐右边
    if (!snappedX && Math.abs(x - (other.x + other.width)) < SNAP_THRESHOLD) {
      x = other.x + other.width
      snappedX = true
    }
    // 右边对齐左边
    if (!snappedX && Math.abs((x + width) - other.x) < SNAP_THRESHOLD) {
      x = other.x - width
      snappedX = true
    }
    // 左边对齐左边
    if (!snappedX && Math.abs(x - other.x) < SNAP_THRESHOLD) {
      x = other.x
      snappedX = true
    }
    // 右边对齐右边
    if (!snappedX && Math.abs((x + width) - (other.x + other.width)) < SNAP_THRESHOLD) {
      x = other.x + other.width - width
      snappedX = true
    }

    // 上边对齐下边
    if (!snappedY && Math.abs(y - (other.y + other.height)) < SNAP_THRESHOLD) {
      y = other.y + other.height
      snappedY = true
    }
    // 下边对齐上边
    if (!snappedY && Math.abs((y + height) - other.y) < SNAP_THRESHOLD) {
      y = other.y - height
      snappedY = true
    }
    // 上边对齐上边
    if (!snappedY && Math.abs(y - other.y) < SNAP_THRESHOLD) {
      y = other.y
      snappedY = true
    }
    // 下边对齐下边
    if (!snappedY && Math.abs((y + height) - (other.y + other.height)) < SNAP_THRESHOLD) {
      y = other.y + other.height - height
      snappedY = true
    }

    if (snappedX && snappedY) break
  }

  return { x, y }
}

export function closeAllNoteWindows() {
  noteWindows.forEach((win, id) => {
    noteWindows.delete(id)
    win.destroy()
  })
}

function attachMoveResizeHandlers(win: BrowserWindow, noteId: string, getMainWindow: () => BrowserWindow | null) {
  const existingMoved = win.listeners('moved')
  const existingResized = win.listeners('resized')
  win.removeAllListeners('moved')
  win.removeAllListeners('resized')

  win.on('moved', () => {
    if (win.isDestroyed()) return
    const bounds = win.getBounds()
    const snapped = snapToNearbyWindows(noteId, bounds)
    if (snapped.x !== bounds.x || snapped.y !== bounds.y) {
      win.setPosition(snapped.x, snapped.y)
    }
    const saved = saveNote({ id: noteId, x: snapped.x, y: snapped.y })
    const mainWin = getMainWindow()
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('note-updated', saved)
    }
  })

  win.on('resized', () => {
    if (win.isDestroyed()) return
    const bounds = win.getBounds()
    const saved = saveNote({ id: noteId, width: bounds.width, height: bounds.height })
    const mainWin = getMainWindow()
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('note-updated', saved)
    }
  })
}

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
      updateNoteWindow(noteWindows.get(saved.id)!, saved, getMainWindow)
    }
    return saved
  })

  ipcMain.handle('delete-note', (_, id: string) => {
    closeNoteWindow(id)
    return deleteNote(id)
  })

  ipcMain.handle('show-note-on-desktop', (_, note: StickyNote) => {
    if (noteWindows.has(note.id)) {
      updateNoteWindow(noteWindows.get(note.id)!, note, getMainWindow)
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
            win.focus()
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
      {
        label: note?.isFixed ? '解锁移动' : '锁定位置',
        click: () => {
          const updated = saveNote({ id: noteId, isFixed: !note?.isFixed })
          if (noteWindows.has(noteId)) {
            updateNoteWindow(noteWindows.get(noteId)!, updated, getMainWindow)
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
          if (win && !win.isDestroyed()) {
            win.webContents.send('note-deleted', noteId)
          }
        }
      }
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup(noteWin && !noteWin.isDestroyed() ? { window: noteWin } : undefined)
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
    const ids = Array.from(noteWindows.keys())
    ids.forEach(id => closeNoteWindow(id))
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
    width: Math.max(120, width),
    height: Math.max(120, height),
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

  noteWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })

  noteWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  attachMoveResizeHandlers(noteWindow, note.id, getMainWindow)

  noteWindows.set(note.id, noteWindow)
}

function updateNoteWindow(win: BrowserWindow, note: StickyNote, getMainWindow: () => BrowserWindow | null) {
  if (win.isDestroyed()) return

  win.webContents.send('note-data', note)
  win.setOpacity(note.opacity)
  win.setAlwaysOnTop(note.isPinned !== false)
  win.setResizable(!note.isFixed)

  if (!note.isFixed) {
    attachMoveResizeHandlers(win, note.id, getMainWindow)
  }

  const bounds = win.getBounds()
  if (bounds.width !== note.width || bounds.height !== note.height) {
    win.setSize(Math.max(120, note.width), Math.max(120, note.height))
  }
}

function setNoteOpacity(id: string, opacity: number) {
  if (noteWindows.has(id)) {
    noteWindows.get(id)!.setOpacity(opacity)
  }
  saveNote({ id, opacity })
}
