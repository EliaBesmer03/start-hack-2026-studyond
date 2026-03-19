/**
 * Feature: Create Timeline (vertical, interactive)
 * - Weeks run top-to-bottom; columns are user-defined
 * - Hand-in date drives real calendar labels (weeks counted backwards)
 * - Draw on empty space to create a new block (drag-to-create)
 * - Click an existing block to open an edit popup
 * - Drag a block to reposition; drag bottom edge to resize
 * - Column names and count are fully editable by the user
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Calendar, Plus, X,
  PenLine, Flag, RotateCcw, ChevronDown, Trash2,
} from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { TimelineEntry } from '@/stores/thesis-store'

// ── Constants ──────────────────────────────────────────────────────────

const TOTAL_WEEKS = 20
const WEEK_H = 48
const LABEL_W = 120
const ADD_COL_W = 48

// ── Column type ────────────────────────────────────────────────────────

interface Column {
  id: string
  name: string
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'admin',     name: 'Admin' },
  { id: 'outreach',  name: 'Outreach' },
  { id: 'research',  name: 'Research' },
  { id: 'writing',   name: 'Writing' },
  { id: 'milestone', name: 'Milestone' },
]

// ── Default timeline ───────────────────────────────────────────────────

let _id = 1
const mkId = () => String(_id++)

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

// ── Date helpers ───────────────────────────────────────────────────────

function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

const FMT_SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const FMT_MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' })
const FMT_FULL  = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function weekStartDate(handIn: Date, weekNum: number): Date {
  const week20Start = addWeeks(weekStart(handIn), -19)
  return addWeeks(week20Start, weekNum - 1)
}

function weekEndDate(handIn: Date, weekNum: number): Date {
  const end = addWeeks(weekStartDate(handIn, weekNum + 1), 0)
  end.setDate(end.getDate() - 1)
  return end
}

function formatMonthLabel(handIn: Date, weekNum: number): string {
  return FMT_MONTH.format(weekStartDate(handIn, weekNum))
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// ── Types ──────────────────────────────────────────────────────────────

interface PopupState {
  entryId: string
  anchorTop: number
  anchorLeft: number
}

interface GhostState {
  category: string
  startWeek: number
  endWeek: number
}

// ── Edit popup ─────────────────────────────────────────────────────────

function EntryPopup({
  entry,
  columns,
  handIn,
  anchorTop,
  anchorLeft,
  onUpdate,
  onDelete,
  onClose,
}: {
  entry: TimelineEntry
  columns: Column[]
  handIn: Date
  anchorTop: number
  anchorLeft: number
  onUpdate: (id: string, changes: Partial<Pick<TimelineEntry, 'label' | 'category' | 'week' | 'duration' | 'notes'>>) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(entry.label)
  const [category, setCategory] = useState(entry.category)
  const [notes, setNotes] = useState(entry.notes ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const startDate = weekStartDate(handIn, entry.week)
  const endDate   = weekEndDate(handIn, entry.week + entry.duration - 1)

  const handleSave = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onUpdate(entry.id, { label: trimmed, category, notes: notes.trim() || undefined })
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  const popupW = 272
  const leftPos = Math.min(anchorLeft, window.innerWidth - popupW - 16)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-50 rounded-xl border border-border bg-background shadow-xl"
        style={{ top: anchorTop, left: leftPos, width: popupW }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="ds-label text-foreground">Edit block</p>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Label</label>
            <input
              ref={inputRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKey}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Column</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
              placeholder="Add notes, links, reminders…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 ds-caption text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <p className="ds-caption text-muted-foreground">
              {FMT_SHORT.format(startDate)} – {FMT_SHORT.format(endDate)}
            </p>
            <p className="ds-caption text-muted-foreground/60 mt-0.5">
              W{entry.week} · {entry.duration} week{entry.duration !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => { onDelete(entry.id); onClose() }}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 ds-caption text-muted-foreground transition-colors hover:border-red-300 hover:text-red-500"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!label.trim()}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 ds-caption text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
          >
            <Check className="size-3.5" />
            Save
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── New-entry popup (after draw) ───────────────────────────────────────

function NewEntryPopup({
  category,
  columns,
  week,
  duration,
  handIn,
  anchorTop,
  anchorLeft,
  onConfirm,
  onClose,
}: {
  category: string
  columns: Column[]
  week: number
  duration: number
  handIn: Date
  anchorTop: number
  anchorLeft: number
  onConfirm: (label: string, category: string, notes: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [cat, setCat] = useState(category)
  const [notes, setNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const startDate = weekStartDate(handIn, week)
  const endDate   = weekEndDate(handIn, week + duration - 1)
  const popupW    = 272
  const leftPos   = Math.min(anchorLeft, window.innerWidth - popupW - 16)

  const handleConfirm = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onConfirm(trimmed, cat, notes.trim())
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-50 rounded-xl border border-border bg-background shadow-xl"
        style={{ top: anchorTop, left: leftPos, width: popupW }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="ds-label text-foreground">New block</p>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Label</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Literature review"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose() }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 ds-body text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Column</label>
            <div className="relative">
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
              placeholder="Add notes, links, reminders…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 ds-caption text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <p className="ds-caption text-muted-foreground">
              {FMT_SHORT.format(startDate)} – {FMT_SHORT.format(endDate)}
            </p>
            <p className="ds-caption text-muted-foreground/60 mt-0.5">
              W{week} · {duration} week{duration !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} className="ds-caption text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!label.trim()}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 ds-caption text-background transition-colors hover:bg-foreground/80 disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add block
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ── Gantt column ───────────────────────────────────────────────────────

function GanttColumn({
  columnId,
  entries,
  handIn,
  onUpdate,
  onDelete,
  onOpenPopup,
  onCommitDraw,
}: {
  columnId: string
  entries: TimelineEntry[]
  handIn: Date
  onUpdate: (id: string, week: number, duration: number) => void
  onDelete: (id: string) => void
  onOpenPopup: (id: string, anchorTop: number, anchorLeft: number) => void
  onCommitDraw: (category: string, week: number, duration: number, anchorTop: number, anchorLeft: number) => void
}) {
  const [ghost, setGhost] = useState<GhostState | null>(null)
  const colRef = useRef<HTMLDivElement>(null)

  // ── drag-move block ────────────────────────────────────────────────
  const dragRef = useRef<{ id: string; startY: number; origWeek: number; moved: boolean } | null>(null)

  const onMouseDownBlock = useCallback((e: React.MouseEvent, entry: TimelineEntry) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { id: entry.id, startY: e.clientY, origWeek: entry.week, moved: false }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dy = ev.clientY - dragRef.current.startY
      if (Math.abs(dy) > 4) dragRef.current.moved = true
      const dWeeks = Math.round(dy / WEEK_H)
      const newWeek = clamp(dragRef.current.origWeek + dWeeks, 1, TOTAL_WEEKS - entry.duration + 1)
      onUpdate(dragRef.current.id, newWeek, entry.duration)
    }
    const onUp = (ev: MouseEvent) => {
      if (dragRef.current && !dragRef.current.moved) {
        const rect = colRef.current?.getBoundingClientRect()
        const anchorLeft = rect ? rect.left : ev.clientX
        const anchorTop = ev.clientY + 8
        onOpenPopup(entry.id, anchorTop, anchorLeft)
      }
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onUpdate, onOpenPopup])

  // ── drag-resize block ──────────────────────────────────────────────
  const resizeRef = useRef<{ id: string; startY: number; origDuration: number; week: number } | null>(null)

  const onMouseDownResize = useCallback((e: React.MouseEvent, entry: TimelineEntry) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { id: entry.id, startY: e.clientY, origDuration: entry.duration, week: entry.week }

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dWeeks = Math.round((ev.clientY - resizeRef.current.startY) / WEEK_H)
      const newDuration = clamp(resizeRef.current.origDuration + dWeeks, 1, TOTAL_WEEKS - resizeRef.current.week + 1)
      onUpdate(resizeRef.current.id, resizeRef.current.week, newDuration)
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onUpdate])

  // ── draw-to-create on empty space ─────────────────────────────────
  const drawRef = useRef<{ startWeek: number; moved: boolean; startY: number } | null>(null)

  const onMouseDownCol = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const rect = colRef.current!.getBoundingClientRect()
    const relY = e.clientY - rect.top
    const startWeek = clamp(Math.floor(relY / WEEK_H) + 1, 1, TOTAL_WEEKS)
    drawRef.current = { startWeek, moved: false, startY: e.clientY }
    setGhost({ category: columnId, startWeek, endWeek: startWeek })

    const onMove = (ev: MouseEvent) => {
      if (!drawRef.current) return
      if (Math.abs(ev.clientY - drawRef.current.startY) > 4) drawRef.current.moved = true
      const relY2 = ev.clientY - rect.top
      const curWeek = clamp(Math.floor(relY2 / WEEK_H) + 1, 1, TOTAL_WEEKS)
      setGhost({ category: columnId, startWeek: drawRef.current.startWeek, endWeek: curWeek })
    }
    const onUp = (ev: MouseEvent) => {
      if (drawRef.current) {
        const relY2 = ev.clientY - rect.top
        const endWeek = clamp(Math.floor(relY2 / WEEK_H) + 1, 1, TOTAL_WEEKS)
        const week     = Math.min(drawRef.current.startWeek, endWeek)
        const duration = Math.abs(endWeek - drawRef.current.startWeek) + 1
        const anchorTop  = rect.top + (week - 1) * WEEK_H + 8
        const anchorLeft = rect.left
        onCommitDraw(columnId, week, duration, anchorTop, anchorLeft)
      }
      drawRef.current = null
      setGhost(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [columnId, onCommitDraw])

  const ghostTop    = ghost ? (Math.min(ghost.startWeek, ghost.endWeek) - 1) * WEEK_H + 3 : 0
  const ghostHeight = ghost ? Math.abs(ghost.endWeek - ghost.startWeek + 1) * WEEK_H - 6 : 0

  return (
    <div
      ref={colRef}
      className="relative flex-1 border-r border-border select-none"
      style={{ height: TOTAL_WEEKS * WEEK_H, cursor: 'crosshair' }}
      onMouseDown={onMouseDownCol}
    >
      {/* Grid lines */}
      {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
        <div key={i} className="absolute left-0 right-0 border-b border-border/30" style={{ top: (i + 1) * WEEK_H - 1 }} />
      ))}

      {/* Ghost preview while drawing */}
      {ghost && (
        <div
          className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-foreground/30 bg-foreground/8 pointer-events-none"
          style={{ top: ghostTop, height: Math.max(ghostHeight, WEEK_H - 6) }}
        />
      )}

      {/* Existing blocks */}
      {entries.map((entry) => {
        const top    = (entry.week - 1) * WEEK_H
        const height = entry.duration * WEEK_H
        const startDate = weekStartDate(handIn, entry.week)
        const endDate   = weekEndDate(handIn, entry.week + entry.duration - 1)

        return (
          <div
            key={entry.id}
            className="group absolute left-1 right-1 rounded-lg border border-foreground/20 bg-secondary text-foreground flex flex-col overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md hover:z-10"
            style={{ top: top + 3, height: height - 6, zIndex: 1 }}
            onMouseDown={(e) => onMouseDownBlock(e, entry)}
          >
            <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2">
              <div className="flex items-start gap-1">
                <p className="ds-caption font-semibold leading-snug line-clamp-2 flex-1">{entry.label}</p>
                {entry.notes && <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-foreground opacity-40" title="Has notes" />}
              </div>
              {height >= WEEK_H * 2 && (
                <p className="ds-caption mt-1 leading-tight opacity-60">
                  {FMT_SHORT.format(startDate)} – {FMT_SHORT.format(endDate)}
                </p>
              )}
              {height >= WEEK_H * 3 && entry.notes && (
                <p className="ds-caption mt-1 leading-tight opacity-50 line-clamp-2">{entry.notes}</p>
              )}
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2.5 cursor-row-resize flex items-end justify-center pb-0.5"
              onMouseDown={(e) => onMouseDownResize(e, entry)}
            >
              <div className="h-px w-8 rounded-full bg-foreground opacity-30 group-hover:opacity-60 transition-opacity" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Editable column header ─────────────────────────────────────────────

function ColumnHeader({
  column,
  canDelete,
  onRename,
  onDelete,
}: {
  column: Column
  canDelete: boolean
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(column.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) onRename(column.id, trimmed)
    else setDraft(column.name)
    setEditing(false)
  }

  return (
    <div className="group flex flex-1 items-center justify-center gap-1 border-r border-border bg-secondary/50 py-3 px-2">
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(column.name); setEditing(false) }
          }}
          className="w-full min-w-0 rounded-md border border-border bg-background px-2 py-0.5 ds-label text-center text-foreground focus:outline-none focus:border-foreground/40"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ds-label text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group/btn"
            title="Click to rename"
          >
            {column.name}
            <PenLine className="size-3 opacity-0 group-hover/btn:opacity-50 transition-opacity" />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(column.id)}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
              title="Remove column"
            >
              <X className="size-3" />
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

function defaultHandIn(): string {
  const d = addWeeks(new Date(), 20)
  return d.toISOString().slice(0, 10)
}

let _colId = 100
const mkColId = () => `col-${_colId++}`

export function CreateTimeline() {
  const {
    timeline, timelineHandIn, timelineColumns,
    setTimeline, setTimelineColumns,
    completeFeature, uncompleteFeature, tasks,
  } = useThesisStore()
  const isDone = tasks.some((t) => t.featureId === 'create-timeline' && t.status === 'done')

  const [columns, setColumns] = useState<Column[]>(
    timelineColumns.length > 0 ? timelineColumns : DEFAULT_COLUMNS
  )
  const [entries, setEntries] = useState<TimelineEntry[]>(() =>
    timeline.length > 0 ? timeline : DEFAULT_TIMELINE.map((e) => ({ ...e }))
  )
  const [handInStr, setHandInStr] = useState<string>(timelineHandIn ?? defaultHandIn())
  const idCounter = useRef(200)

  // Auto-persist entries, hand-in and columns to the store on every change
  useEffect(() => {
    setTimeline(entries, handInStr)
  }, [entries, handInStr, setTimeline])

  useEffect(() => {
    setTimelineColumns(columns)
  }, [columns, setTimelineColumns])

  // popup state
  const [editPopup, setEditPopup] = useState<PopupState | null>(null)
  const [newPopup, setNewPopup] = useState<{
    category: string; week: number; duration: number
    anchorTop: number; anchorLeft: number
  } | null>(null)

  const handIn = new Date(handInStr + 'T12:00:00')

  // ── Column management ──────────────────────────────────────────────

  const renameColumn = useCallback((id: string, name: string) => {
    setColumns((prev) => prev.map((c) => c.id === id ? { ...c, name } : c))
  }, [])

  const deleteColumn = useCallback((id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id))
    setEntries((prev) => prev.filter((e) => e.category !== id))
  }, [])

  const addColumn = () => {
    const id = mkColId()
    setColumns((prev) => [...prev, { id, name: 'New column' }])
  }

  // ── Entry management ───────────────────────────────────────────────

  const updateEntry = useCallback((id: string, week: number, duration: number) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, week, duration } : e))
  }, [])

  const updateEntryFields = useCallback((id: string, changes: Partial<Pick<TimelineEntry, 'label' | 'category' | 'week' | 'duration' | 'notes'>>) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...changes } : e))
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const resetToDefault = () => {
    setColumns(DEFAULT_COLUMNS)
    setEntries(DEFAULT_TIMELINE.map((e) => ({ ...e, id: String(idCounter.current++) })))
  }

  const handleSave = () => {
    setTimeline(entries, handInStr)
    completeFeature('create-timeline')
  }

  const handleOpenPopup = useCallback((id: string, anchorTop: number, anchorLeft: number) => {
    setEditPopup({ entryId: id, anchorTop, anchorLeft })
  }, [])

  const handleCommitDraw = useCallback((category: string, week: number, duration: number, anchorTop: number, anchorLeft: number) => {
    setNewPopup({ category, week, duration, anchorTop, anchorLeft })
  }, [])

  const handleConfirmNew = (label: string, category: string, notes: string) => {
    if (!newPopup) return
    setEntries((prev) => [...prev, {
      id: String(idCounter.current++),
      label,
      category,
      week: newPopup.week,
      duration: newPopup.duration,
      notes: notes || undefined,
    }])
  }

  // month label markers
  const monthLabels: { week: number; label: string }[] = []
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const label = formatMonthLabel(handIn, w)
    if (w === 1 || label !== formatMonthLabel(handIn, w - 1)) {
      monthLabels.push({ week: w, label })
    }
  }

  const editEntry = editPopup ? entries.find((e) => e.id === editPopup.entryId) : null

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="ds-title-md text-foreground">Create Timeline</h2>
          <p className="ds-body mt-1 text-muted-foreground">
            Set your hand-in date, drag across empty space to create blocks, click any block to edit it. Rename or add columns as needed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Flag className="size-3.5 shrink-0 text-muted-foreground" />
            <label className="ds-caption text-muted-foreground whitespace-nowrap">Hand-in date</label>
            <input
              type="date"
              value={handInStr}
              onChange={(e) => setHandInStr(e.target.value)}
              className="ds-caption border-0 bg-transparent text-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="rounded-xl border border-border bg-background">
        <div className="w-full">

          {/* Sticky column headers */}
          <div className="flex border-b border-border" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <div className="shrink-0 border-r border-border bg-secondary/50 px-3 py-3" style={{ width: LABEL_W }}>
              <span className="ds-caption text-muted-foreground/60">Week</span>
            </div>
            {columns.map((col) => (
              <ColumnHeader
                key={col.id}
                column={col}
                canDelete={columns.length > 1}
                onRename={renameColumn}
                onDelete={deleteColumn}
              />
            ))}
            {/* Add column button — fixed width, matched by spacer in body */}
            <button
              type="button"
              onClick={addColumn}
              className="flex shrink-0 items-center justify-center border-l border-border bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              style={{ width: ADD_COL_W }}
              title="Add column"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex" style={{ height: TOTAL_WEEKS * WEEK_H }}>

            {/* Week labels */}
            <div className="relative shrink-0 border-r border-border" style={{ width: LABEL_W }}>
              {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                const weekNum = i + 1
                const isHandIn = weekNum === TOTAL_WEEKS
                const monthChange = monthLabels.find((m) => m.week === weekNum)
                const startDate = weekStartDate(handIn, weekNum)

                return (
                  <div
                    key={weekNum}
                    className={`absolute left-0 right-0 flex flex-col justify-center border-b border-border/40 px-2 ${isHandIn ? 'bg-foreground/5' : ''}`}
                    style={{ top: i * WEEK_H, height: WEEK_H }}
                  >
                    {monthChange && (
                      <p className="ds-caption font-semibold text-foreground/50 leading-none mb-0.5">{monthChange.label}</p>
                    )}
                    <span className={`ds-caption font-bold leading-tight ${isHandIn ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {FMT_SHORT.format(startDate)}
                    </span>
                    {isHandIn && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 ds-caption rounded-full bg-foreground px-1.5 py-0.5 text-background" style={{ fontSize: 8 }}>
                        Hand-in
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Category columns */}
            {columns.map((col) => (
              <GanttColumn
                key={col.id}
                columnId={col.id}
                entries={entries.filter((e) => e.category === col.id)}
                handIn={handIn}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
                onOpenPopup={handleOpenPopup}
                onCommitDraw={handleCommitDraw}
              />
            ))}

            {/* Spacer matching the Add column button */}
            <div className="shrink-0 border-l border-border" style={{ width: ADD_COL_W }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <p className="ds-small text-muted-foreground">
          {entries.length} block{entries.length !== 1 ? 's' : ''} · {columns.length} column{columns.length !== 1 ? 's' : ''} ·{' '}
          Hand-in {FMT_FULL.format(handIn)}
        </p>
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <span className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background">
                <Check className="size-3.5" />Saved
              </span>
              <button
                type="button"
                onClick={() => uncompleteFeature('create-timeline')}
                className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />Undo
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="save"
              type="button"
              onClick={handleSave}
              className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-background transition-colors hover:bg-foreground/80"
            >
              <Check className="size-3.5" />Save timeline
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {editPopup && editEntry && (
          <EntryPopup
            key="edit"
            entry={editEntry}
            columns={columns}
            handIn={handIn}
            anchorTop={editPopup.anchorTop}
            anchorLeft={editPopup.anchorLeft}
            onUpdate={updateEntryFields}
            onDelete={deleteEntry}
            onClose={() => setEditPopup(null)}
          />
        )}
        {newPopup && (
          <NewEntryPopup
            key="new"
            category={newPopup.category}
            columns={columns}
            week={newPopup.week}
            duration={newPopup.duration}
            handIn={handIn}
            anchorTop={newPopup.anchorTop}
            anchorLeft={newPopup.anchorLeft}
            onConfirm={handleConfirmNew}
            onClose={() => setNewPopup(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
