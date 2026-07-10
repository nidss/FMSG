import React, { useEffect, useRef, useState } from 'react'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

/** Text input that commits on blur/Enter (avoids history spam per keystroke). */
export function TextField({
  label,
  value,
  onCommit,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onCommit: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  const commit = () => {
    if (v !== value) onCommit(v)
  }
  return (
    <Field label={label}>
      {multiline ? (
        <textarea value={v} rows={3} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />
      ) : (
        <input
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      )}
    </Field>
  )
}

export function SelectField({
  label,
  value,
  options,
  onCommit,
  allowEmpty = true,
}: {
  label: string
  value: string | undefined
  options: string[]
  onCommit: (v: string) => void
  allowEmpty?: boolean
}) {
  return (
    <Field label={label}>
      <select value={value ?? ''} onChange={(e) => onCommit(e.target.value)}>
        {allowEmpty && <option value="">(ค่าเริ่มต้น)</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string | undefined
  onCommit: (v: string) => void
}) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  const timer = useRef<number>()
  const commitDebounced = (val: string) => {
    setV(val)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onCommit(val), 250)
  }
  return (
    <Field label={label}>
      <div className="color-field">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'}
          onChange={(e) => commitDebounced(e.target.value)}
        />
        <input
          value={v}
          placeholder="#RRGGBB"
          onChange={(e) => setV(e.target.value)}
          onBlur={() => onCommit(v)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        {v && (
          <button className="mini-btn" title="ล้างค่า" onClick={() => onCommit('')}>
            ✕
          </button>
        )}
      </div>
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onCommit,
  min = 0,
  max = 20,
}: {
  label: string
  value: number | undefined
  onCommit: (v: number | undefined) => void
  min?: number
  max?: number
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onCommit(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </Field>
  )
}

export function ToggleField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: boolean | undefined
  onCommit: (v: boolean) => void
}) {
  return (
    <label className="field field-row">
      <input type="checkbox" checked={!!value} onChange={(e) => onCommit(e.target.checked)} />
      <span className="field-label">{label}</span>
    </label>
  )
}
