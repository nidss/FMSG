import React, { useEffect, useRef, useState } from 'react'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { Selector } from '@astryxdesign/core/Selector'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { NumberInput } from '@astryxdesign/core/NumberInput'

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
  if (multiline) {
    return (
      <div onBlur={commit}>
        <TextArea label={label} value={v} rows={3} placeholder={placeholder} onChange={setV} size="sm" />
      </div>
    )
  }
  return (
    <div
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur?.()
      }}
    >
      <TextInput label={label} value={v} placeholder={placeholder} onChange={setV} size="sm" />
    </div>
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
  const opts = [
    ...(allowEmpty ? [{ value: '__default__', label: '(ค่าเริ่มต้น)' }] : []),
    ...options.map((o) => ({ value: o, label: o })),
  ]
  return (
    <Selector
      label={label}
      size="sm"
      options={opts}
      value={value ?? (allowEmpty ? '__default__' : undefined)}
      onChange={(v: any) => onCommit(v === '__default__' ? '' : (v ?? ''))}
    />
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
  const timer = useRef<number>(undefined)
  const commitDebounced = (val: string) => {
    setV(val)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onCommit(val), 250)
  }
  return (
    <div className="color-field-wrap">
      <span className="field-label">{label}</span>
      <div className="color-field">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'}
          onChange={(e) => commitDebounced(e.target.value)}
          aria-label={`${label} (color picker)`}
        />
        <div
          style={{ flex: 1, minWidth: 0 }}
          onBlur={() => onCommit(v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur?.()
          }}
        >
          <TextInput label={label} isLabelHidden value={v} placeholder="#RRGGBB" onChange={setV} size="sm" hasClear />
        </div>
      </div>
    </div>
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
    <NumberInput
      label={label}
      size="sm"
      min={min}
      max={max}
      value={value ?? null}
      onChange={(v: number | null | undefined) => onCommit(v === null || v === undefined ? undefined : v)}
    />
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
  return <CheckboxInput label={label} value={!!value} onChange={(c: boolean) => onCommit(c)} size="sm" />
}
