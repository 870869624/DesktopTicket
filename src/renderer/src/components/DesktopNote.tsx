import React, { useState, useEffect } from 'react'
import { StickyNote } from '../types'
import styles from '../styles/note.module.css'

const DesktopNote: React.FC = () => {
  const [note, setNote] = useState<StickyNote | null>(null)

  useEffect(() => {
    const api = (window as any).electronAPI
    if (api?.onNoteData) {
      api.onNoteData((data: StickyNote) => {
        setNote(data)
      })
    }
  }, [])

  if (!note) return null

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const api = (window as any).electronAPI
    if (api?.showNoteContextMenu) {
      api.showNoteContextMenu(note.id)
    }
  }

  return (
    <div
      className={`${styles.note} ${!note.isFixed ? styles.noteDraggable : ''}`}
      style={{
        background: note.color,
        fontFamily: note.fontFamily,
        fontSize: note.fontSize
      }}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.title}>{note.title}</div>
      <div className={styles.content}>{note.content}</div>
    </div>
  )
}

export default DesktopNote
