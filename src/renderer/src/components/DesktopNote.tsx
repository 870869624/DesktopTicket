import React, { useState, useEffect } from 'react'
import { StickyNote, NoteElectronAPI } from '../types'
import styles from '../styles/note.module.css'

const api = window.electronAPI as NoteElectronAPI

const DesktopNote: React.FC = () => {
  const [note, setNote] = useState<StickyNote | null>(null)

  useEffect(() => {
    const cleanup = api.onNoteData((data: StickyNote) => {
      setNote(data)
    })
    return cleanup
  }, [])

  if (!note) return null

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    api.showNoteContextMenu(note.id)
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
      <div className={styles.titleBar}>
        <div
          className={styles.title}
          style={{
            WebkitAppRegion: 'no-drag',
            color: note.titleColor
          } as React.CSSProperties}
        >
          {note.title}
        </div>
        {note.isFixed && (
          <span className={styles.lockIcon} title="已锁定位置">&#128274;</span>
        )}
      </div>
      <div
        className={styles.content}
        style={{
          WebkitAppRegion: 'no-drag',
          color: note.textColor
        } as React.CSSProperties}
      >
        {note.content}
      </div>
    </div>
  )
}

export default DesktopNote
