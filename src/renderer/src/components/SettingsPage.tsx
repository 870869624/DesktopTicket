import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StickyNote } from '../types'
import NoteList from './NoteList'
import NoteEditor from './NoteEditor'
import styles from '../styles/settings.module.css'

const emptyNote = (): StickyNote => ({
  id: '',
  title: '新便签',
  content: '',
  color: '#FFEB3B',
  fontFamily: 'Microsoft YaHei',
  fontSize: 14,
  x: 100,
  y: 100,
  width: 200,
  height: 200,
  opacity: 1,
  isFixed: false,
  createdAt: '',
  updatedAt: ''
})

const SettingsPage: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<StickyNote | null>(null)
  const activeIdRef = useRef(activeId)

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const loadNotes = useCallback(async () => {
    const data = await window.electronAPI.getNotes()
    setNotes(data)
  }, [])

  useEffect(() => {
    loadNotes()

    const handleEdit = (id: string) => {
      setActiveId(id)
      window.electronAPI.getNote(id).then(note => {
        if (note) setDraft(note)
      })
    }

    const handleDeleted = (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id))
      if (activeIdRef.current === id) {
        setActiveId(null)
        setDraft(null)
      }
    }

    const handleUpdated = (note: StickyNote) => {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n))
    }

    window.electronAPI.onEditNote(handleEdit)
    window.electronAPI.onNoteDeleted(handleDeleted)
    window.electronAPI.onNoteUpdated(handleUpdated)

    return () => {
      window.electronAPI.removeAllListeners('edit-note')
      window.electronAPI.removeAllListeners('note-deleted')
      window.electronAPI.removeAllListeners('note-updated')
    }
  }, [loadNotes])

  useEffect(() => {
    if (activeId) {
      const note = notes.find(n => n.id === activeId)
      if (note) setDraft(note)
    }
  }, [activeId])

  const handleAdd = () => {
    const newNote = emptyNote()
    setDraft(newNote)
    setActiveId(null)
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    const note = notes.find(n => n.id === id)
    if (note) setDraft(note)
  }

  const handleSave = async () => {
    if (!draft) return
    const saved = await window.electronAPI.saveNote(draft)
    await loadNotes()
    setActiveId(saved.id)
    setDraft(saved)
  }

  const handleShow = async () => {
    if (!draft) return
    const saved = await window.electronAPI.saveNote(draft)
    await loadNotes()
    setActiveId(saved.id)
    setDraft(saved)
    await window.electronAPI.showNoteOnDesktop(saved)
  }

  const handleDelete = async () => {
    if (!activeId) return
    await window.electronAPI.deleteNote(activeId)
    await loadNotes()
    setActiveId(null)
    setDraft(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>桌面便签</div>
          <button className={styles.addBtn} onClick={handleAdd}>+ 新建便签</button>
        </div>
        <NoteList notes={notes} activeId={activeId} onSelect={handleSelect} />
      </div>
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!draft}>保存</button>
          <button className={styles.showBtn} onClick={handleShow} disabled={!draft}>显示到桌面</button>
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={!activeId}>删除</button>
        </div>
        <NoteEditor note={draft} onChange={setDraft} />
      </div>
    </div>
  )
}

export default SettingsPage
