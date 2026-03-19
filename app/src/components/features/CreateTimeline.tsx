/**
 * Feature: Create Timeline
 * Gantt-style thesis planner.
 * - One row per category, all 20 weeks always visible
 * - Drag blocks to reposition (mouse events, no HTML5 drag API)
 * - Resize by dragging the right edge handle
 * - Neighbour blocks auto-shift to fill gaps / avoid overlap
 * - Palette chips add to the right of the last block in that row
 * - Example timeline pre-loaded, fully adaptable
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Calendar, Plus, X,
  Mail, PenLine, BookOpen, FlaskConical, Flag, RotateCcw, ChevronDown,
} from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { TimelineEntry } from '@/stores/thesis-store'

// ── Constants ─────────────────────────────────────────────────────────

const TOTAL_WEEKS = 20
const ROW_H = 56       // px per row — enough for 2 lines of label text
const ROW_GAP = 6      // px gap between rows
const HEADER_H = 32    // px for week header

type Category = TimelineEntry['category']

const CATEGORIES: Category[] = ['admin', 'outreach', 'research', 'writing', 'milestone']

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  admin:     { label: 'Admin',     icon: <BookOpen className="size-3" />,    bg: 'bg-secondary',   text: 'text-foreground',   border: 'border-foreground/15' },
  outreach:  { label: 'Outreach',  icon: <Mail className="size-3" />,        bg: 'bg-secondary',   text: 'text-foreground',   border: 'border-foreground/15' },
  research:  { label: 'Research',  icon: <FlaskConical className="size-3" />, bg: 'bg-secondary',  text: 'text-foreground',   border: 'border-foreground/15' },
  writing:   { label: 'Writing',   icon: <PenLine className="size-3" />,     bg: 'bg-secondary',   text: 'text-foreground',   border: 'border-foreground/15' },
  milestone: { label: 'Milestone', icon: <Flag className="size-3" />,        bg: 'bg-foreground',  text: 'text-background',   border: 'border-foreground' },
}

// ── Example / default timeline ────────────────────────────────────────

let _nextId = 1
function mkId() { return String(_nextId++) }

const DEFAULT_TIMELINE: TimelineEntry[] = [
  { id: mkId(), label: 'University registration', category: 'admin',     week: 1,  duration: 1 },
  { id: mkId(), label: 'Proposal submission',     category: 'admin',     week: 3,  duration: 1 },
  { id: mkId(), label: 'Supervisor outreach',     category: 'outreach',  week: 1,  duration: 1 },
  { id: mkId(), label: 'Expert interviews',       category: 'outreach',  week: 5,  duration: 2 },
  { id: mkId(), label: 'Thesis Twin check-ins',   category: 'outreach',  week: 10, duration: 2 },
  { id: mkId(), label: 'Literature review',       category: 'research',  week: 2,  duration: 4 },
  { id: mkId(), label: 'Data collection',         category: 'research',  week: 7,  duration: 4 },
  { id: mkId(), label: 'Data analysis',           category: 'research',  week: 12, duration: 3 },
  { id: mkId(), label: 'Write introduction',      category: 'writing',   week: 8,  duration: 2 },
  { id: mkId(), label: 'Write methodology',       category: 'writing',   week: 10, duration: 2 },
  { id: mkId(), label: 'Write analysis chapter',  category: 'writing',   week: 13, duration: 3 },
  { id: mkId(), label: 'Write conclusion',        category: 'writing',   week: 16, duration: 2 },
  { id: mkId(), label: 'First draft complete',    category: 'milestone', week: 15, duration: 1 },
  { id: mkId(), label: 'Supervisor review',       category: 'milestone', week: 17, duration: 1 },
  { id: mkId(), label: 'Submission',              category: 'milestone', week: 20, duration: 1 },
]

// ── Palette chips ─────────────────────────────────────────────────────

const PALETTE: { label: string; category: Category; duration: number }[] = [
  { label: 'University registration', category: 'admin',     duration: 1 },
  { label: 'Proposal submission',     category: 'admin',     duration: 1 },
  { label: 'Supervisor outreach',     category: 'outreach',  duration: 1 },
  { label: 'Follow-up outreach',      category: 'outreach',  duration: 1 },
  { label: 'Expert interviews',       category: 'outreach',  duration: 2 },
  { label: 'Peer feedback session',   category: 'outreach',  duration: 1 },
  { label: 'Thesis Twin check-in',    category: 'outreach',  duration: 1 },
  { label: 'Literature review',       category: 'research',  duration: 4 },
  { label: 'Data collection',         category: 'research',  duration: 3 },
  { label: 'Data analysis',           category: 'research',  duration: 2 },
  { label: 'Write introduction',      category: 'writing',   duration: 2 },
  { label: 'Write methodology',       category: 'writing',   duration: 2 },
  { label: 'Write analysis chapter',  category: 'writing',   duration: 3 },
  { label: 'Write conclusion',        category: 'writing',   duration: 2 },
  { label: 'First draft complete',    category: 'milestone', duration: 1 },
  { label: 'Supervisor review',       category: 'milestone', duration: 1 },
  { label: 'Final draft',             category: 'milestone', duration: 1 },
  { label: 'Submission',              category: 'milestone', duration: 1 },
]

// ── Helpers ───────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

/** After moving/resizing one entry, push neighbours right to avoid overlap, cap at TOTAL_WEEKS */
function pushNeighbours(entries: TimelineEntry[], changedId: string, category: Category): TimelineEntry[] {
  const row = entries.filter((e) => e.category === category).sort((a, b) => a.week - b.week)
  // rebuild the row without overlaps: each item starts at max(its own week, prev end+1)
  let cursor = 1
  const fixed = row.map((e) => {
    const start = Math.max(e.week, cursor)
    const end = Math.min(start + e.duration - 1, TOTAL_WEEKS)
    const duration = end - start + 1
    cursor = end + 1
    return { ...e, week: start, duration }
  })
  return entries.map((e) => {
    const f = fixed.find((x) => x.id === e.id)
    return f ?? e
  })
}

// ── Gantt row ─────────────────────────────────────────────────────────

function GanttRow({
  category,
  entries,
  totalWeeks,
  gridWidth,
  onUpdate,
  onRemove,
}: {
  category: Category
  entries: TimelineEntry[]
  totalWeeks: number
  gridWidth: number
  onUpdate: (id: string, week: number, duration: number) => void
  onRemove: (id: string) => void
}) {
  const meta = CATEGORY_META[category]
  const weekPx = gridWidth / totalWeeks
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── drag-move ────────────────────────────────────────────────────
  const dragRef = useRef<{ id: string; startX: number; origWeek: number; moved: boolean } | null>(null)

  const onMouseDownBlock = useCallback((e: React.MouseEvent, entry: TimelineEntry) => {
    e.preventDefault()
    dragRef.current = { id: entry.id, startX: e.clientX, origWeek: entry.week, moved: false }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.startX
      if (Math.abs(dx) > 3) dragRef.current.moved = true
      const dWeeks = Math.round(dx / weekPx)
      const newWeek = clamp(dragRef.current.origWeek + dWeeks, 1, totalWeeks - entry.duration + 1)
      onUpdate(dragRef.current.id, newWeek, entry.duration)
    }
    const onUp = () => {
      if (dragRef.current && !dragRef.current.moved) {
        setExpandedId((prev) => (prev === entry.id ? null : entry.id))
      }
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [weekPx, onUpdate])

  // ── drag-resize (right edge) ──────────────────────────────────────
  const resizeRef = useRef<{ id: string; startX: number; origDuration: number; week: number } | null>(null)

  const onMouseDownResize = useCallback((e: React.MouseEvent, entry: TimelineEntry) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { id: entry.id, startX: e.clientX, origDuration: entry.duration, week: entry.week }

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dx = ev.clientX - resizeRef.current.startX
      const dWeeks = Math.round(dx / weekPx)
      const newDuration = clamp(resizeRef.current.origDuration + dWeeks, 1, totalWeeks - resizeRef.current.week + 1)
      onUpdate(resizeRef.current.id, resizeRef.current.week, newDuration)
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [weekPx, onUpdate])

  return (
    <div className="flex" style={{ height: ROW_H }}>
      {/* Row label */}
      <div
        className="flex shrink-0 items-center gap-1.5 border-r border-b border-border bg-secondary/30 px-3"
        style={{ width: 120 }}
      >
        <span className="text-muted-foreground">{meta.icon}</span>
        <span className="ds-caption font-medium text-muted-foreground truncate">{meta.label}</span>
      </div>

      {/* Grid area */}
      <div
        className="relative flex-1 border-b border-border"
        style={{ height: ROW_H }}
      >
        {/* Week grid lines */}
        {Array.from({ length: totalWeeks }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-r border-border/40"
            style={{ left: `${((i + 1) / totalWeeks) * 100}%` }}
          />
        ))}

        {/* Entry blocks */}
        {entries.map((entry) => {
          const left = ((entry.week - 1) / totalWeeks) * 100
          const width = (entry.duration / totalWeeks) * 100
          const pxWidth = (entry.duration / totalWeeks) * gridWidth
          const isBar = pxWidth < 20
          // Scale font so text has the best chance of fitting the box width
          const fontSize = pxWidth < 48 ? 8 : pxWidth < 72 ? 9 : 10
          return (
            <div
              key={entry.id}
              className={`group absolute top-[4px] bottom-[4px] rounded-sm border select-none cursor-grab active:cursor-grabbing flex items-center ${expandedId === entry.id ? 'overflow-visible' : 'overflow-hidden'} ${meta.bg} ${meta.text} ${meta.border}`}
              style={{ left: `${left}%`, width: `${width}%`, minWidth: 4 }}
              onMouseDown={(e) => onMouseDownBlock(e, entry)}
            >
              {/* Expanded tooltip */}
              {expandedId === entry.id && (
                <div className="absolute bottom-full left-0 z-20 mb-1 min-w-max max-w-48 rounded-lg border border-border bg-background px-2.5 py-1.5 shadow-md pointer-events-none">
                  <p className="ds-caption font-medium text-foreground leading-snug">{entry.label}</p>
                  <p className="ds-caption text-muted-foreground mt-0.5">W{entry.week}–W{entry.week + entry.duration - 1}</p>
                </div>
              )}
              {/* Label — wraps to 2 lines, font scales with block width */}
              {!isBar && (
                <span
                  className="font-medium leading-tight overflow-hidden"
                  style={{
                    fontSize,
                    lineHeight: '1.2',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    paddingLeft: 5,
                    paddingRight: 14,
                    maxHeight: '2.5em',
                    wordBreak: 'break-word',
                  }}
                >
                  {entry.label}
                </span>
              )}

              {/* Remove — hover only, top-right corner */}
              {!isBar && (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onRemove(entry.id)}
                  className="absolute top-0.5 right-3 hidden group-hover:flex size-3 items-center justify-center rounded opacity-60 hover:opacity-100"
                >
                  <X className="size-2" />
                </button>
              )}

              {/* Resize handle — right edge */}
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center"
                onMouseDown={(e) => onMouseDownResize(e, entry)}
              >
                <div className={`w-px h-3/5 rounded-full opacity-30 group-hover:opacity-70 transition-opacity ${meta.text === 'text-background' ? 'bg-background' : 'bg-foreground'}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function CreateTimeline() {
  const { timeline, setTimeline, completeFeature, uncompleteFeature } = useThesisStore()

  const [entries, setEntries] = useState<TimelineEntry[]>(() =>
    timeline.length > 0 ? timeline : DEFAULT_TIMELINE.map((e) => ({ ...e }))
  )
  const [saved, setSaved] = useState(timeline.length > 0)
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(800)
  const idCounter = useRef(200)
  const [customLabel, setCustomLabel] = useState('')
  const [customCategory, setCustomCategory] = useState<Category>('research')

  // Measure grid width
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      // width minus the row-label column (120px)
      setGridWidth(el.offsetWidth - 120)
    })
    obs.observe(el)
    setGridWidth(el.offsetWidth - 120)
    return () => obs.disconnect()
  }, [])

  const updateEntry = useCallback((id: string, week: number, duration: number) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (!entry) return prev
      const updated = prev.map((e) => e.id === id ? { ...e, week, duration } : e)
      return pushNeighbours(updated, id, entry.category)
    })
    setSaved(false)
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setSaved(false)
  }, [])

  const addFromPalette = (item: { label: string; category: Category; duration: number }) => {
    const rowEntries = entries.filter((e) => e.category === item.category)
    const lastEnd = rowEntries.length > 0 ? Math.max(...rowEntries.map((e) => e.week + e.duration - 1)) : 0
    const week = clamp(lastEnd + 1, 1, TOTAL_WEEKS - item.duration + 1)
    const newEntry: TimelineEntry = {
      id: String(idCounter.current++),
      label: item.label,
      category: item.category,
      week,
      duration: item.duration,
    }
    setEntries((prev) => pushNeighbours([...prev, newEntry], newEntry.id, item.category))
    setSaved(false)
  }

  const addCustomItem = () => {
    const label = customLabel.trim()
    if (!label) return
    addFromPalette({ label, category: customCategory, duration: 1 })
    setCustomLabel('')
  }

  const resetToDefault = () => {
    setEntries(DEFAULT_TIMELINE.map((e) => ({ ...e, id: String(idCounter.current++) })))
    setSaved(false)
  }

  const handleSave = () => {
    setTimeline(entries)
    completeFeature('create-timeline')
    setSaved(true)
  }

  const totalH = CATEGORIES.length * ROW_H

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="ds-title-md text-foreground">Create Timeline</h2>
          <p className="ds-body mt-2 text-muted-foreground">
            Your {TOTAL_WEEKS}-week thesis plan. Drag blocks to reposition, drag the right edge to resize.
            Neighbours shift automatically to fill gaps.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToDefault}
          className="ds-caption mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Reset to example
        </button>
      </div>

      {/* Palette */}
      <div data-tutorial="timeline-palette" className="mb-5 rounded-xl border border-border bg-background p-4">
        <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
          <Calendar className="size-3" />
          Add elements — click to append to the right of that row
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((item) => {
            const meta = CATEGORY_META[item.category]
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => addFromPalette(item)}
                className={`ds-caption flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all hover:shadow-sm active:scale-95 ${meta.border} ${meta.bg} ${meta.text}`}
              >
                {meta.icon}
                {item.label}
                <Plus className="size-2.5 opacity-50" />
              </button>
            )
          })}
        </div>

        {/* Custom element input */}
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            placeholder="Add custom element…"
            className="ds-caption min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
          <div className="relative">
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as Category)}
              className="ds-caption appearance-none rounded-xl border border-border bg-secondary py-1.5 pl-3 pr-7 text-foreground focus:border-foreground/30 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            type="button"
            onClick={addCustomItem}
            disabled={!customLabel.trim()}
            className="flex items-center gap-1 rounded-full border border-border bg-foreground px-3 py-1.5 ds-caption text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>
      </div>

      {/* Gantt grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-background" ref={gridRef}>
        {/* Week header row */}
        <div className="flex border-b border-border bg-secondary/50">
          {/* Label column header */}
          <div className="shrink-0 border-r border-border px-3 py-2" style={{ width: 120 }}>
            <span className="ds-caption text-muted-foreground/60">Category</span>
          </div>
          {/* Week numbers */}
          <div className="relative flex-1" style={{ height: HEADER_H }}>
            {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
              <div
                key={i}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${(i / TOTAL_WEEKS) * 100}%`,
                  width: `${(1 / TOTAL_WEEKS) * 100}%`,
                  top: 0,
                  height: HEADER_H,
                }}
              >
                <span className="ds-caption text-muted-foreground/70">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div style={{ height: totalH }}>
          {CATEGORIES.map((cat) => (
            <GanttRow
              key={cat}
              category={cat}
              entries={entries.filter((e) => e.category === cat)}
              totalWeeks={TOTAL_WEEKS}
              gridWidth={gridWidth}
              onUpdate={updateEntry}
              onRemove={removeEntry}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <p className="ds-small text-muted-foreground">
          {entries.length} block{entries.length !== 1 ? 's' : ''}
          {entries.length > 0 && ` · W${Math.min(...entries.map((e) => e.week))}–W${Math.max(...entries.map((e) => e.week + e.duration - 1))}`}
        </p>
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background">
                <Check className="size-3.5" />
                Done
              </span>
              <button
                type="button"
                onClick={() => { uncompleteFeature('create-timeline'); setSaved(false) }}
                className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Undo
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="save"
              type="button"
              onClick={handleSave}
              className="ds-caption flex items-center gap-1.5 rounded-full border border-foreground/30 px-3 py-1.5 text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              <Check className="size-3.5" />
              Mark as done
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
