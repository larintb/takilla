'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, X } from 'lucide-react'
import { createPortal } from 'react-dom'

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const hh = h.toString().padStart(2, '0')
  const ampm = h < 12 ? 'a.m.' : 'p.m.'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return {
    value: `${hh}:${m}`,
    label: `${h12}:${m} ${ampm}`,
  }
})

interface DateTimePickerProps {
  label: string
  nameDate: string
  required?: boolean
  minDate?: Date
  defaultValue?: string
}

export default function DateTimePicker({
  label,
  nameDate,
  required,
  minDate,
  defaultValue,
}: DateTimePickerProps) {
  const today = minDate ?? new Date()

  const parseDefault = (val?: string) => {
    if (!val) return { day: null as Date | null, time: '20:00' }
    const d = new Date(val)
    if (isNaN(d.getTime())) return { day: null as Date | null, time: '20:00' }
    // Use UTC components so editing an existing event shows the originally-entered time
    const h = d.getUTCHours().toString().padStart(2, '0')
    const m = d.getUTCMinutes() < 30 ? '00' : '30'
    const day = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    return { day, time: `${h}:${m}` }
  }

  const { day: initDay, time: initTime } = parseDefault(defaultValue)

  const [selectedDay, setSelectedDay] = useState<Date | null>(initDay)
  const [selectedTime, setSelectedTime] = useState(initTime)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'time'>('calendar')
  const [calMonth, setCalMonth] = useState(initDay ?? today)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const triggerRef  = useRef<HTMLButtonElement>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const timeListRef = useRef<HTMLDivElement>(null)

  // Position dropdown based on trigger button
  function updatePosition() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        !(document.getElementById(`dtp-portal-${nameDate}`)?.contains(target))
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [nameDate])

  // Scroll selected time into view
  useEffect(() => {
    if (view === 'time' && open && timeListRef.current) {
      const active = timeListRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'center' })
    }
  }, [view, open])

  // Update position on scroll/resize
  useEffect(() => {
    if (!open) return
    const handler = () => updatePosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open])

  // Build calendar grid
  const year  = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function isDisabled(day: number) {
    const d = new Date(year, month, day)
    d.setHours(0, 0, 0, 0)
    const min = new Date(today)
    min.setHours(0, 0, 0, 0)
    return d < min
  }

  function isSelected(day: number) {
    if (!selectedDay) return false
    return (
      selectedDay.getFullYear() === year &&
      selectedDay.getMonth() === month &&
      selectedDay.getDate() === day
    )
  }

  function isToday(day: number) {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
  }

  function handleDayClick(day: number) {
    if (isDisabled(day)) return
    setSelectedDay(new Date(year, month, day))
    setView('time')
  }

  function handleTimeClick(t: string) {
    setSelectedTime(t)
    setOpen(false)
    setView('calendar')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedDay(null)
    setSelectedTime('20:00')
    setOpen(false)
  }

  function handleOpen() {
    updatePosition()
    setOpen(o => !o)
    setView('calendar')
  }

  const isoValue = selectedDay
    ? (() => {
        const y  = selectedDay.getFullYear()
        const mo = String(selectedDay.getMonth() + 1).padStart(2, '0')
        const d  = String(selectedDay.getDate()).padStart(2, '0')
        return `${y}-${mo}-${d}T${selectedTime}`
      })()
    : ''

  const displayValue = selectedDay
    ? (() => {
        const slotLabel = TIME_SLOTS.find(s => s.value === selectedTime)?.label ?? selectedTime
        return selectedDay.toLocaleDateString('es-MX', {
          weekday: 'short', day: 'numeric', month: 'short',
        }) + ', ' + slotLabel
      })()
    : null

  const inputBase = "w-full rounded-lg border bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
  const btnBase   = "w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-purple-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"

  const dropdown = open && dropdownPos ? createPortal(
    <div
      id={`dtp-portal-${nameDate}`}
      className="rounded-2xl border border-purple-700/40 shadow-2xl overflow-hidden"
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: Math.max(dropdownPos.width, 280),
        maxWidth: 320,
        background: '#1a1035',
        zIndex: 9999,
      }}
    >
      {view === 'calendar' ? (
        <div className="p-4 space-y-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button type="button"
              className={btnBase}
              onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              disabled={year === today.getFullYear() && month <= today.getMonth()}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS[month]} {year}
            </span>
            <button type="button"
              className={btnBase}
              onClick={() => setCalMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const disabled = isDisabled(day)
              const selected = isSelected(day)
              const tod      = isToday(day)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(day)}
                  className="h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: selected
                      ? 'var(--accent-gradient)'
                      : tod
                      ? 'rgba(249,115,22,0.15)'
                      : 'transparent',
                    color: selected
                      ? '#fff'
                      : disabled
                      ? 'rgba(255,255,255,0.15)'
                      : tod
                      ? '#f97316'
                      : 'rgba(255,255,255,0.8)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!selected && !disabled)
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={e => {
                    if (!selected && !disabled)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {selectedDay && (
            <div className="pt-1 border-t border-purple-700/30">
              <button
                type="button"
                onClick={() => setView('time')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <span className="flex items-center gap-2">
                  <Clock size={13} className="text-orange-400" />
                  Hora seleccionada
                </span>
                <span className="font-semibold text-white">
                  {TIME_SLOTS.find(s => s.value === selectedTime)?.label ?? selectedTime}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 280 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-700/30">
            <button type="button" onClick={() => setView('calendar')}
              className="p-1 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-white">
              {selectedDay?.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div ref={timeListRef} className="overflow-y-auto flex-1 py-1">
            {TIME_SLOTS.map(slot => {
              const active = slot.value === selectedTime
              return (
                <button
                  key={slot.value}
                  type="button"
                  data-active={active}
                  onClick={() => handleTimeClick(slot.value)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(249,115,22,0.15)' : 'transparent',
                    color: active ? '#f97316' : 'rgba(255,255,255,0.7)',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <Clock size={12} className="opacity-40" />
                  {slot.label}
                  {active && <span className="text-xs opacity-60">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <label className="block text-sm font-medium text-purple-300">
        {label} {required && <span className="text-orange-400">*</span>}
      </label>

      <input type="hidden" name={nameDate} value={isoValue} />

      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`${inputBase} flex items-center gap-2 text-left cursor-pointer ${
          open
            ? 'border-orange-500 ring-2 ring-orange-500'
            : 'border-purple-700/40'
        }`}
      >
        <CalendarDays size={14} className="text-purple-400/60 shrink-0" />
        <span className={`flex-1 ${displayValue ? 'text-white' : 'text-purple-400/50'}`}>
          {displayValue ?? 'Selecciona fecha y hora'}
        </span>
        {selectedDay && (
          <span onClick={handleClear} className="text-purple-400/50 hover:text-white transition-colors">
            <X size={13} />
          </span>
        )}
      </button>

      {dropdown}
    </div>
  )
}