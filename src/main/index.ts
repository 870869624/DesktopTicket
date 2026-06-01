import { app, BrowserWindow, Tray, Menu, nativeImage, NativeImage } from 'electron'
import { join } from 'path'
import { setupIPC, closeAllNoteWindows } from './ipc'
import Store from 'electron-store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const windowStore = new Store<{ bounds?: { x: number; y: number; width: number; height: number } }>({
  name: 'window-state',
  defaults: {}
})

let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null

function saveWindowBounds() {
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer)
  saveBoundsTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds()
      windowStore.set('bounds', bounds)
    }
  }, 300)
}

function createTrayIcon(): NativeImage {
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const cx = x - 7.5
      const cy = y - 7.5
      const isSticky = (
        (x >= 3 && x <= 12 && y >= 2 && y <= 13) ||
        (x >= 4 && x <= 11 && y >= 1 && y <= 14)
      )
      const isPin = (x >= 7 && x <= 8 && y >= 0 && y <= 3)
      if (isPin) {
        canvas[idx] = 0xE9
        canvas[idx + 1] = 0x1E
        canvas[idx + 2] = 0x63
        canvas[idx + 3] = 0xFF
      } else if (isSticky) {
        canvas[idx] = 0xFF
        canvas[idx + 1] = 0xEB
        canvas[idx + 2] = 0x3B
        canvas[idx + 3] = 0xFF
      } else {
        canvas[idx] = 0
        canvas[idx + 1] = 0
        canvas[idx + 2] = 0
        canvas[idx + 3] = 0
      }
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function createMainWindow() {
  const bounds = windowStore.get('bounds', { width: 900, height: 650 })

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: '桌面便签 - 设置',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow!.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function createTray() {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('桌面便签')
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: '打开设置',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createMainWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ]))
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createMainWindow()
    }
  })
}

app.whenReady().then(() => {
  createTray()
  createMainWindow()
  setupIPC(getMainWindow)

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
    } else {
      createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  closeAllNoteWindows()
})

app.on('window-all-closed', () => {
  // 不退出，保持托盘运行
})
