import React, { useState, useEffect } from 'react'
import { StickyNote, NoteElectronAPI } from '../types'
import styles from '../styles/note.module.css'

declare const window: Window & { electronAPI: NoteElectronAPI }

const DesktopNote: React.FC = () => {
  const [note, setNote] = useState<StickyNote | null>(null)

  useEffect(() => {
    const cleanup = window.electronAPI.onNoteData((data: StickyNote) => {
      setNote(data)
    })
    return cleanup
  }, [])

  if (!note) return null

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    window.electronAPI.showNoteContextMenu(note.id)
  }

  return (
    <div
      className={styles.note}
      style={{
        background: note.color,
        fontFamily: note.fontFamily,
        fontSize: note.fontSize,
        WebkitAppRegion: note.isFixed ? 'no-drag' : 'drag'
      } as React.CSSProperties}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.title} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {note.title}
      </div>
      <div className={styles.content} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {note.content}
      </div>
    </div>
  )
}

export default DesktopNote
