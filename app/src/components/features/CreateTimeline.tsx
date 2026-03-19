/**
 * Feature: Create Timeline (vertical, interactive)
 * - Weeks run top-to-bottom; categories are columns
 * - Hand-in date drives real calendar labels (weeks counted backwards)
 * - Draw on empty space to create a new block (drag-to-create)
 * - Click an existing block to open an edit popup
 * - Drag a block to reposition; drag bottom edge to resize
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Calendar, Plus, X,
  Mail, PenLine, BookOpen, FlaskConical, Flag, RotateCcw, ChevronDown, Trash2,
} from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { TimelineEntry } from '@/stores/thesis-store'

// ── Constants ──────────────────────────────────────────────────────────

const TOTAL_WEEKS = 20
const WEEK_H = 48
const LABEL_W = 88

type Category = TimelineEntry['category']
const CATEGORIES: Category[] = ['admin', 'outreach', 'research', 'writing', 'milestone']

const CATEGORY_META: Record<Category, {
  label: string; icon: React.ReactNode
  bg: string; text: string; border: string; headerBg: string
  ghostBg: string
}> = {
  admin:     { label: 'Admin',     icon: <BookOpen className="size-3.5" />,     bg: 'bg-secondary',  text: 'text-foreground',  border: 'border-foreground/20', headerBg: 'bg-secondary/60',    ghostBg: 'bg-foreground/8' },
  outreach:  { label: 'Outreach',  icon: <Mail className="size-3.5" />,         bg: 'bg-secondary',  text: 'text-foreground',  border: 'border-foreground/20', headerBg: 'bg-secondary/60',    ghostBg: 'bg-foreground/8' },
  research:  { label: 'Research',  icon: <FlaskConical className="size-3.5" />, bg: 'bg-secondary',  text: 'text-foreground',  border: 'border-foreground/20', headerBg: 'bg-secondary/60',    ghostBg: 'bg-foreground/8' },
  writing:   { label: 'Writing',   icon: <PenLine className="size-3.5" />,      bg: 'bg-secondary',  text: 'text-foreground',  border: 'border-foreground/20', headerBg: 'bg-secondary/60',    ghostBg: 'bg-foreground/8' },
  milestone: { label: 'Milestone', icon: <Flag className="size-3.5" />,         bg: 'bg-foreground', text: 'text-background',  border: 'border-foreground',   headerBg: 'bg-foreground/10',   ghostBg: 'bg-foreground/20' },
}

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

// ── Palette ────────────────────────────────────────────────────────────

const PALETTE: { label: string; category: Category; duration: number }[] = [
  { label: 'University registration', category: 'admin',     duration: 1 },
  { label: 'Proposal submission',     category: 'admin',     duration: 1 },
  { label: 'Supervisor outreach',     category: 'outreach',  duration: 1 },
  { label: 'Follow-up outreach',      category: 'outreach',  duration: 1 },
  { label: 'Expert interviews',       category: 'outreach',  duration: 2 },
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
  // position in viewport for anchoring
  anchorTop: number
  anchorLeft: number
}

interface GhostState {
  category: Category
  startWeek: number
  endWeek: number   // inclusive, may be < startWeek while dragging up
}

// ── Edit popup ─────────────────────────────────────────────────────────

function EntryPopup({
  entry,
  handIn,
  anchorTop,
  anchorLeft,
  onUpdate,
  onDelete,
  onClose,
}: {
  entry: TimelineEntry
  handIn: Date
  anchorTop: number
  anchorLeft: number
  onUpdate: (id: string, changes: Partial<Pick<TimelineEntry, 'label' | 'category' | 'week' | 'duration' | 'notes'>>) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(entry.label)
  const [category, setCategory] = useState<Category>(entry.category)
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

  // Keep popup within viewport — flip left if too close to right edge
  const popupW = 272
  const leftPos = Math.min(anchorLeft, window.innerWidth - popupW - 16)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-50 w-68 rounded-xl border border-border bg-background shadow-xl"
        style={{ top: anchorTop, left: leftPos, width: popupW }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="ds-label text-foreground">Edit block</p>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Label */}
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

          {/* Category */}
          <div>
            <label className="ds-caption mb-1 block text-muted-foreground">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Notes */}
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

          {/* Date range (read-only) */}
          <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <p className="ds-caption text-muted-foreground">
              {FMT_SHORT.format(startDate)} – {FMT_SHORT.format(endDate)}
            </p>
            <p className="ds-caption text-muted-foreground/60 mt-0.5">
              W{entry.week} · {entry.duration} week{entry.duration !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Footer */}
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
  week,
  duration,
  handIn,
  anchorTop,
  anchorLeft,
  onConfirm,
  onClose,
}: {
  category: Category
  week: number
  duration: number
  handIn: Date
  anchorTop: number
  anchorLeft: number
  onConfirm: (label: string, category: Category, notes: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [cat, setCat] = useState<Category>(category)
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
            <label className="ds-caption mb-1 block text-muted-foreground">Category</label>
            <div className="relative">
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as Category)}
                className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 ds-body text-foreground focus:border-foreground/30 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
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
  category,
  entries,
  handIn,
  onUpdate,
  onDelete,
  onOpenPopup,
  onCommitDraw,
}: {
  category: Category
  entries: TimelineEntry[]
  handIn: Date
  onUpdate: (id: string, week: number, duration: number) => void
  onDelete: (id: string) => void
  onOpenPopup: (id: string, anchorTop: number, anchorLeft: number) => void
  onCommitDraw: (category: Category, week: number, duration: number, anchorTop: number, anchorLeft: number) => void
}) {
  const meta = CATEGORY_META[category]
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
        // click → open popup
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
    // only left-button on empty space (not on a block)
    if (e.button !== 0) return
    const rect = colRef.current!.getBoundingClientRect()
    const relY = e.clientY - rect.top
    const startWeek = clamp(Math.floor(relY / WEEK_H) + 1, 1, TOTAL_WEEKS)
    drawRef.current = { startWeek, moved: false, startY: e.clientY }
    setGhost({ category, startWeek, endWeek: startWeek })

    const onMove = (ev: MouseEvent) => {
      if (!drawRef.current) return
      if (Math.abs(ev.clientY - drawRef.current.startY) > 4) drawRef.current.moved = true
      const relY2 = ev.clientY - rect.top
      const curWeek = clamp(Math.floor(relY2 / WEEK_H) + 1, 1, TOTAL_WEEKS)
      setGhost({ category, startWeek: drawRef.current.startWeek, endWeek: curWeek })
    }
    const onUp = (ev: MouseEvent) => {
      if (drawRef.current) {
        const relY2 = ev.clientY - rect.top
        const endWeek = clamp(Math.floor(relY2 / WEEK_H) + 1, 1, TOTAL_WEEKS)
        const week     = Math.min(drawRef.current.startWeek, endWeek)
        const duration = Math.abs(endWeek - drawRef.current.startWeek) + 1
        // anchor popup slightly below the draw start
        const anchorTop  = rect.top + (week - 1) * WEEK_H + 8
        const anchorLeft = rect.left
        onCommitDraw(category, week, duration, anchorTop, anchorLeft)
      }
      drawRef.current = null
      setGhost(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [category, onCommitDraw])

  const ghostTop      = ghost ? (Math.min(ghost.startWeek, ghost.endWeek) - 1) * WEEK_H + 3 : 0
  const ghostHeight   = ghost ? Math.abs(ghost.endWeek - ghost.startWeek + 1) * WEEK_H - 6 : 0

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
          className={`absolute left-1 right-1 rounded-lg border-2 border-dashed border-foreground/30 ${meta.ghostBg} pointer-events-none`}
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
            className={`group absolute left-1 right-1 rounded-lg border flex flex-col overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md hover:z-10 ${meta.bg} ${meta.text} ${meta.border}`}
            style={{ top: top + 3, height: height - 6, zIndex: 1 }}
            onMouseDown={(e) => onMouseDownBlock(e, entry)}
          >
            <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2">
              <div className="flex items-start gap-1">
                <p className="ds-caption font-semibold leading-snug line-clamp-2 flex-1">{entry.label}</p>
                {entry.notes && <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-current opacity-40" title="Has notes" />}
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
              <div className={`h-px w-8 rounded-full opacity-30 group-hover:opacity-60 transition-opacity ${meta.text === 'text-background' ? 'bg-background' : 'bg-foreground'}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

function defaultHandIn(): string {
  const d = addWeeks(new Date(), 20)
  return d.toISOString().slice(0, 10)
}

export function CreateTimeline() {
  const { timeline, setTimeline, completeFeature, uncompleteFeature, tasks } = useThesisStore()
  const isDone = tasks.some((t) => t.featureId === 'create-timeline' && t.status === 'done')

  const [entries, setEntries] = useState<TimelineEntry[]>(() =>
    timeline.length > 0 ? timeline : DEFAULT_TIMELINE.map((e) => ({ ...e }))
  )
  const [handInStr, setHandInStr] = useState<string>(defaultHandIn)
  const [customLabel, setCustomLabel] = useState('')
  const [customCategory, setCustomCategory] = useState<Category>('research')
  const idCounter = useRef(200)

  // popup state
  const [editPopup, setEditPopup] = useState<PopupState | null>(null)
  const [newPopup, setNewPopup] = useState<{
    category: Category; week: number; duration: number
    anchorTop: number; anchorLeft: number
  } | null>(null)

  const handIn = new Date(handInStr + 'T12:00:00')

  const updateEntry = useCallback((id: string, week: number, duration: number) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, week, duration } : e))
  }, [])

  const updateEntryFields = useCallback((id: string, changes: Partial<Pick<TimelineEntry, 'label' | 'category' | 'week' | 'duration' | 'notes'>>) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...changes } : e))
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addFromPalette = (item: { label: string; category: Category; duration: number }) => {
    const colEntries = entries.filter((e) => e.category === item.category)
    const lastEnd = colEntries.length > 0 ? Math.max(...colEntries.map((e) => e.week + e.duration - 1)) : 0
    const week = clamp(lastEnd + 1, 1, TOTAL_WEEKS - item.duration + 1)
    setEntries((prev) => [...prev, {
      id: String(idCounter.current++), label: item.label, category: item.category, week, duration: item.duration,
    }])
  }

  const addCustomItem = () => {
    const label = customLabel.trim()
    if (!label) return
    addFromPalette({ label, category: customCategory, duration: 1 })
    setCustomLabel('')
  }

  const resetToDefault = () => {
    setEntries(DEFAULT_TIMELINE.map((e) => ({ ...e, id: String(idCounter.current++) })))
  }

  const handleSave = () => {
    setTimeline(entries)
    completeFeature('create-timeline')
  }

  const handleOpenPopup = useCallback((id: string, anchorTop: number, anchorLeft: number) => {
    setEditPopup({ entryId: id, anchorTop, anchorLeft })
  }, [])

  const handleCommitDraw = useCallback((category: Category, week: number, duration: number, anchorTop: number, anchorLeft: number) => {
    setNewPopup({ category, week, duration, anchorTop, anchorLeft })
  }, [])

  const handleConfirmNew = (label: string, category: Category, notes: string) => {
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
            Set your hand-in date, then drag across empty space to create blocks. Click any block to edit it.
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
          <button
            type="button"
            onClick={resetToDefault}
            className="ds-caption flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Palette */}
      <div className="mb-5 rounded-xl border border-border bg-background p-4">
        <p className="ds-caption mb-3 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
          <Calendar className="size-3" />
          Quick-add — click a chip to append to that column
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

      {/* Timeline grid */}
      <div className="rounded-xl border border-border bg-background">
        <div className="w-full">

          {/* Sticky column headers */}
          <div className="flex border-b border-border bg-secondary/50" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <div className="shrink-0 border-r border-border px-3 py-3" style={{ width: LABEL_W }}>
              <span className="ds-caption text-muted-foreground/60">Week</span>
            </div>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat]
              return (
                <div
                  key={cat}
                  className={`flex flex-1 items-center justify-center gap-2 border-r border-border py-3 ${meta.headerBg}`}
                >
                  <span className={cat === 'milestone' ? 'text-foreground' : 'text-muted-foreground'}>{meta.icon}</span>
                  <span className={`ds-label ${cat === 'milestone' ? 'text-foreground' : 'text-muted-foreground'}`}>{meta.label}</span>
                </div>
              )
            })}
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
                    className={`absolute left-0 right-0 border-b border-border/40 px-2 ${isHandIn ? 'bg-foreground/5' : ''}`}
                    style={{ top: i * WEEK_H, height: WEEK_H }}
                  >
                    {monthChange && (
                      <p className="ds-caption pt-1 font-semibold text-foreground/50 leading-none">{monthChange.label}</p>
                    )}
                    <p
                      className={`ds-caption leading-tight ${isHandIn ? 'font-semibold text-foreground' : 'text-muted-foreground/70'}`}
                      style={{ paddingTop: monthChange ? 2 : 14 }}
                    >
                      W{weekNum}
                    </p>
                    <p className="ds-caption text-muted-foreground/50 leading-none" style={{ fontSize: 9 }}>
                      {FMT_SHORT.format(startDate)}
                    </p>
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
            {CATEGORIES.map((cat) => (
              <GanttColumn
                key={cat}
                category={cat}
                entries={entries.filter((e) => e.category === cat)}
                handIn={handIn}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
                onOpenPopup={handleOpenPopup}
                onCommitDraw={handleCommitDraw}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <p className="ds-small text-muted-foreground">
          {entries.length} block{entries.length !== 1 ? 's' : ''} ·{' '}
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
