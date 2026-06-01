import React from 'react'
import { StickyNote } from '../types'
import styles from '../styles/settings.module.css'

interface Props {
  notes: StickyNote[]
  activeId: string | null
  onSelect: (id: string) => void
}

const NoteList: React.FC<Props> = ({ notes, activeId, onSelect }) => {
  if (notes.length === 0) {
    return <div className={styles.noteList} style={{ color: '#999', textAlign: 'center', paddingTop: 40 }}>暂无便签</div>
  }

  return (
    <div className={styles.noteList}>
      {notes.map(note => (
        <div
          key={note.id}
          className={`${styles.noteItem} ${note.id === activeId ? styles.noteItemActive : ''}`}
          onClick={() => onSelect(note.id)}
        >
          <div className={styles.noteColorDot} style={{ background: note.color }} />
          <div className={styles.noteItemTitle}>{note.title || '未命名便签'}</div>
        </div>
      ))}
    </div>
  )
}

export default NoteList
