import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRight, Check, Filter, GripVertical, AlertCircle, X } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { Task, TaskStatus } from '@/stores/thesis-store'
import { STAGES } from '@/types/thesis'
import type { ThesisStage } from '@/types/thesis'
import type { FeatureId } from '@/components/JourneyMapSidebar'

/* ── constants ─────────────────────────────────────────────────────── */

const KANBAN_COLUMNS: { id: TaskStatus; label: string; description: string }[] = [
  { id: 'ready',       label: 'Ready',       description: 'Next up' },
  { id: 'in-progress', label: 'In Progress', description: 'Currently active' },
  { id: 'done',        label: 'Done',        description: 'Completed' },
]

const STAGE_TAG: Record<ThesisStage, { label: string; cls: string }> = {
  orientation:         { label: 'Orientation',        cls: 'bg-secondary text-muted-foreground' },
  'topic-discovery':   { label: 'Topic & Supervisor', cls: 'bg-secondary text-foreground' },
  'supervisor-search': { label: 'Planning',           cls: 'bg-foreground/10 text-foreground' },
  planning:            { label: 'Execution',          cls: 'bg-foreground/15 text-foreground' },
  'execution-writing': { label: 'Writing',            cls: 'bg-foreground/20 text-foreground' },
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  ready:         'in-progress',
  'in-progress': 'done',
  done:          'ready',
}

/* ── TaskCard ──────────────────────────────────────────────────────── */

function TaskCard({
  task,
  overlay = false,
  onOpen,
}: {
  task: Task
  overlay?: boolean
  onOpen?: (featureId: FeatureId) => void
}) {
  const { updateTaskStatus, dismissNudge } = useThesisStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const tag = STAGE_TAG[task.stageId]
  const isDone = task.status === 'done'

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col gap-3 rounded-xl border bg-background p-4 transition-all duration-150 ${
        overlay
          ? 'rotate-1 shadow-2xl border-foreground/20'
          : isDragging
          ? 'opacity-20'
          : 'hover:shadow-md hover:border-foreground/20'
      } ${isDone ? 'opacity-60' : ''}`}
    >
      {/* Top row: stage tag + drag handle */}
      <div className="flex items-center justify-between gap-2">
        <span className={`ds-caption w-fit rounded-full px-2 py-0.5 font-medium ${tag.cls}`}>
          {tag.label}
        </span>
        <span
          {...listeners}
          {...attributes}
          className="cursor-grab touch-none text-muted-foreground/30 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </span>
      </div>

      {/* Title */}
      <div>
        <p className={`ds-title-cards leading-snug ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {task.title}
        </p>
        {!isDone && (
          <p className="ds-small mt-1 text-muted-foreground leading-snug">
            {task.description}
          </p>
        )}
      </div>

      {/* Nudge banner */}
      {!isDone && task.nudge && !overlay && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <AlertCircle className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
          <p className="ds-caption flex-1 text-foreground leading-snug">{task.nudge}</p>
          <button
            type="button"
            onClick={() => dismissNudge(task.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss nudge"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Bottom row: open feature + advance status */}
      {!overlay && (
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Open feature button */}
          {!isDone && onOpen && (
            <button
              type="button"
              onClick={() => onOpen(task.featureId as FeatureId)}
              className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              Open
              <ArrowRight className="size-3" />
            </button>
          )}

          {/* Advance / complete */}
          <button
            type="button"
            onClick={() => updateTaskStatus(task.id, NEXT_STATUS[task.status])}
            title={isDone ? 'Mark as Ready' : task.status === 'ready' ? 'Start' : 'Mark Done'}
            className={`ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 ds-caption font-medium transition-all ${
              isDone
                ? 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                : task.status === 'ready'
                ? 'bg-secondary text-foreground hover:bg-foreground hover:text-background'
                : 'bg-foreground text-background hover:bg-foreground/80'
            }`}
          >
            {isDone ? (
              <>
                <Check className="size-3" strokeWidth={2.5} />
                Done
              </>
            ) : task.status === 'ready' ? (
              'Start'
            ) : (
              'Mark done'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── KanbanColumn ──────────────────────────────────────────────────── */

function KanbanColumn({
  column,
  tasks,
  activeId,
  onOpen,
}: {
  column: { id: TaskStatus; label: string; description: string }
  tasks: Task[]
  activeId: string | null
  onOpen: (featureId: FeatureId) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const isInProgress = column.id === 'in-progress'

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      {/* Header */}
      <div className="mb-3 flex items-baseline gap-2 px-1">
        <span className={`ds-label ${isInProgress ? 'text-foreground' : 'text-muted-foreground'}`}>
          {column.label}
        </span>
        <span className="ds-caption text-muted-foreground/60">{tasks.length}</span>
      </div>

      {/* Separator */}
      <div className={`mb-3 h-0.5 rounded-full ${isInProgress ? 'bg-foreground' : 'bg-border'}`} />

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-xl p-1 transition-colors duration-150 ${
          isOver && activeId ? 'bg-secondary/60 ring-2 ring-border ring-inset' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <span className="ds-caption text-muted-foreground/50">Drop tasks here</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  )
}

/* ── StageFilterPill ───────────────────────────────────────────────── */

function StageFilterPill({
  stageId,
  selected,
  count,
  onToggle,
}: {
  stageId: ThesisStage
  selected: boolean
  count: number
  onToggle: () => void
}) {
  const tag = STAGE_TAG[stageId]
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`ds-caption flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-all duration-150 ${
        selected
          ? `${tag.cls} border-transparent`
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {selected && <Check className="size-3" strokeWidth={2.5} />}
      {tag.label}
      <span className="opacity-60">{count}</span>
    </button>
  )
}

/* ── Stage progress summary ────────────────────────────────────────── */

function StageProgress({ tasks }: { tasks: Task[] }) {
  const stageIds = [...new Set(tasks.map((t) => t.stageId))] as ThesisStage[]
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {stageIds.map((sid) => {
        const stageTasks = tasks.filter((t) => t.stageId === sid)
        const done = stageTasks.filter((t) => t.status === 'done').length
        const total = stageTasks.length
        const pct = Math.round((done / total) * 100)
        const tag = STAGE_TAG[sid]
        return (
          <div key={sid} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span className={`ds-caption rounded-full px-2 py-0.5 font-medium ${tag.cls}`}>
              {tag.label}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="ds-caption text-muted-foreground">{done}/{total}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── ThesisBoard ───────────────────────────────────────────────────── */

interface ThesisBoardProps {
  onFeatureOpen: (id: FeatureId) => void
}

export function ThesisBoard({ onFeatureOpen }: ThesisBoardProps) {
  const { tasks, updateTaskStatus } = useThesisStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const allStageIds = STAGES.map((s) => s.id) as ThesisStage[]
  const [selectedStages, setSelectedStages] = useState<Set<ThesisStage>>(new Set(allStageIds))

  const toggleStage = (id: ThesisStage) => {
    setSelectedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredTasks = tasks.filter((t) => selectedStages.has(t.stageId))
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const newStatus = over.id as TaskStatus
      if (KANBAN_COLUMNS.some((c) => c.id === newStatus)) {
        updateTaskStatus(String(active.id), newStatus)
      }
    }
    setActiveId(null)
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header + filter */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ds-label uppercase tracking-[0.18em] text-muted-foreground">Thesis Board</p>
          <h2 className="ds-title-md mt-1 text-foreground">Your tasks</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Filter className="size-3" />
            Filter
          </span>
          {allStageIds.map((id) => (
            <StageFilterPill
              key={id}
              stageId={id}
              selected={selectedStages.has(id)}
              count={tasks.filter((t) => t.stageId === id).length}
              onToggle={() => toggleStage(id)}
            />
          ))}
        </div>
      </div>

      {/* Stage progress bar summary */}
      <StageProgress tasks={tasks} />

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-5 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={filteredTasks.filter((t) => t.status === col.id)}
              activeId={activeId}
              onOpen={onFeatureOpen}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
