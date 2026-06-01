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
  textColor: '#333333',
  titleColor: '#333333',
  fontFamily: 'Microsoft YaHei',
  fontSize: 14,
  x: 100 + Math.round(Math.random() * 300),
  y: 100 + Math.round(Math.random() * 300),
  width: 200,
  height: 200,
  opacity: 1,
  isFixed: false,
  isPinned: true,
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
    try {
      const data = await window.electronAPI.getNotes()
      setNotes(data)
    } catch (err) {
      console.error('加载便签列表失败:', err)
    }
  }, [])

  useEffect(() => {
    loadNotes()

    const handleEdit = (id: string) => {
      setActiveId(id)
      window.electronAPI.getNote(id).then(note => {
        if (note) setDraft(note)
      }).catch(err => console.error('获取便签失败:', err))
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

    const offEdit = window.electronAPI.onEditNote(handleEdit)
    const offDeleted = window.electronAPI.onNoteDeleted(handleDeleted)
    const offUpdated = window.electronAPI.onNoteUpdated(handleUpdated)

    return () => {
      offEdit()
      offDeleted()
      offUpdated()
    }
  }, [loadNotes])

  useEffect(() => {
    if (activeId) {
      const note = notes.find(n => n.id === activeId)
      if (note) setDraft(note)
    }
  }, [activeId, notes])

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
    try {
      const saved = await window.electronAPI.saveNote(draft)
      await loadNotes()
      setActiveId(saved.id)
      setDraft(saved)
    } catch (err) {
      console.error('保存便签失败:', err)
    }
  }

  const handleShow = async () => {
    if (!draft) return
    try {
      const saved = await window.electronAPI.saveNote(draft)
      await loadNotes()
      setActiveId(saved.id)
      setDraft(saved)
      await window.electronAPI.showNoteOnDesktop(saved)
    } catch (err) {
      console.error('显示便签失败:', err)
    }
  }

  const handleDelete = async () => {
    if (!activeId) return
    try {
      await window.electronAPI.deleteNote(activeId)
      await loadNotes()
      setActiveId(null)
      setDraft(null)
    } catch (err) {
      console.error('删除便签失败:', err)
    }
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
