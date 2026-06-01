import React from 'react'
import styles from '../styles/editor.module.css'

const PRESET_COLORS = [
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688',
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFFFFF'
]

interface Props {
  color: string
  onChange: (color: string) => void
}

const ColorPicker: React.FC<Props> = ({ color, onChange }) => {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {PRESET_COLORS.map(c => (
          <div
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              background: c,
              border: c === color ? '2px solid #333' : '1px solid #ddd',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
      <div className={styles.colorPickerContainer}>
        <input
          className={styles.colorInput}
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
        />
        <span className={styles.colorHex}>{color}</span>
      </div>
    </div>
  )
}

export default ColorPicker
