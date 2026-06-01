import React from 'react'
import { StickyNote } from '../types'
import ColorPicker from './ColorPicker'
import styles from '../styles/editor.module.css'

interface Props {
  note: StickyNote | null
  onChange: (note: StickyNote) => void
}

const FONTS = [
  'Microsoft YaHei',
  'PingFang SC',
  'SimSun',
  'SimHei',
  'KaiTi',
  'Arial',
  'Verdana',
  'Georgia'
]

const NoteEditor: React.FC<Props> = ({ note, onChange }) => {
  if (!note) {
    return <div className={styles.container} style={{ color: '#999', textAlign: 'center', paddingTop: 80 }}>选择或创建一个便签</div>
  }

  const update = (fields: Partial<StickyNote>) => {
    onChange({ ...note, ...fields })
  }

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label className={styles.label}>标题</label>
        <input
          className={styles.input}
          value={note.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="输入便签标题"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>内容</label>
        <textarea
          className={styles.textarea}
          value={note.content}
          onChange={e => update({ content: e.target.value })}
          placeholder="输入便签内容"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>背景颜色</label>
          <ColorPicker color={note.color} onChange={color => update({ color })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>字体</label>
          <select
            className={styles.select}
            value={note.fontFamily}
            onChange={e => update({ fontFamily: e.target.value })}
          >
            {FONTS.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>字号: {note.fontSize}px</label>
          <input
            className={styles.range}
            type="range"
            min="10"
            max="28"
            value={note.fontSize}
            onChange={e => update({ fontSize: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>透明度: {Math.round(note.opacity * 100)}%</label>
          <input
            className={styles.range}
            type="range"
            min="20"
            max="100"
            value={Math.round(note.opacity * 100)}
            onChange={e => update({ opacity: Number(e.target.value) / 100 })}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>宽度: {note.width}px</label>
          <input
            className={styles.range}
            type="range"
            min="120"
            max="400"
            value={note.width}
            onChange={e => update({ width: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>高度: {note.height}px</label>
          <input
            className={styles.range}
            type="range"
            min="120"
            max="400"
            value={note.height}
            onChange={e => update({ height: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className={styles.checkboxRow}>
        <input
          className={styles.checkbox}
          type="checkbox"
          id="isFixed"
          checked={note.isFixed}
          onChange={e => update({ isFixed: e.target.checked })}
        />
        <label className={styles.checkboxLabel} htmlFor="isFixed">固定位置（不可拖动）</label>
      </div>

      <div className={styles.checkboxRow}>
        <input
          className={styles.checkbox}
          type="checkbox"
          id="isPinned"
          checked={note.isPinned}
          onChange={e => update({ isPinned: e.target.checked })}
        />
        <label className={styles.checkboxLabel} htmlFor="isPinned">置顶显示</label>
      </div>
    </div>
  )
}

export default NoteEditor
