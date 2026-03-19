import { useState, useEffect } from 'react'
import { ArrowRight, Check, Filter, AlertCircle, X, Lock, CalendarDays } from 'lucide-react'
import { useThesisStore } from '@/stores/thesis-store'
import type { Task, TaskStatus } from '@/stores/thesis-store'
import { STAGES } from '@/types/thesis'
import type { ThesisStage } from '@/types/thesis'
import type { FeatureId } from '@/components/JourneyMapSidebar'

const STAGE_ORDER_IDS = STAGES.map((s) => s.id) as ThesisStage[]

/** Returns true if the stage should be unlocked (user has reached it or passed it) */
function isStageUnlocked(stageId: ThesisStage, currentStage: ThesisStage): boolean {
  const stageIdx = STAGE_ORDER_IDS.indexOf(stageId)
  const currentIdx = STAGE_ORDER_IDS.indexOf(currentStage)
  return stageIdx <= currentIdx
}

/* ── constants ─────────────────────────────────────────────────────── */

const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'ready',       label: 'Ready' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
]

const STAGE_TAG: Record<ThesisStage, { label: string; cls: string }> = {
  orientation:         { label: 'Orientation',        cls: 'bg-secondary text-muted-foreground' },
  'topic-discovery':   { label: 'Topic & Supervisor', cls: 'bg-foreground/8 text-foreground' },
  'supervisor-search': { label: 'Planning',           cls: 'bg-foreground/12 text-foreground' },
  planning:            { label: 'Execution',          cls: 'bg-foreground/16 text-foreground' },
  'execution-writing': { label: 'Writing',            cls: 'bg-foreground/20 text-foreground' },
}

/* ── TaskCard ──────────────────────────────────────────────────────── */

function TaskCard({
  task,
  onOpen,
  locked,
}: {
  task: Task
  onOpen: (featureId: FeatureId) => void
  locked?: boolean
}) {
  const { dismissNudge, toggleTimelineEntryDone } = useThesisStore()
  const tag = STAGE_TAG[task.stageId]
  const isDone = task.status === 'done'
  const isTimelineTask = task.id.startsWith('tl-')
  const entryId = isTimelineTask ? task.id.slice(3) : null

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl p-4 transition-shadow duration-150 ${
        isTimelineTask
          ? 'border border-dashed border-border bg-secondary hover:shadow-md hover:border-foreground/20'
          : `border bg-background ${locked && !isDone ? 'opacity-50' : 'hover:shadow-md hover:border-foreground/20'}`
      }`}
    >
      {/* Tag row */}
      <div className="flex items-center justify-between gap-2">
        {isTimelineTask ? (
          <span className="ds-caption flex items-center gap-1 w-fit rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground">
            <CalendarDays className="size-3" />
            Timeline
          </span>
        ) : (
          <span className={`ds-caption w-fit rounded-full px-2 py-0.5 font-medium ${tag.cls}`}>
            {tag.label}
          </span>
        )}
        {isDone && (
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground">
            <Check className="size-3 text-background" strokeWidth={2.5} />
          </span>
        )}
        {!isTimelineTask && locked && !isDone && (
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary border border-border">
            <Lock className="size-3 text-muted-foreground" />
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <p className="ds-title-cards leading-snug text-foreground">
          {task.title}
        </p>
        {!isDone && !locked && (
          <p className="ds-small mt-1 text-muted-foreground leading-snug">
            {task.description}
          </p>
        )}
        {!isTimelineTask && locked && !isDone && (
          <p className="ds-small mt-1 text-muted-foreground/60 leading-snug">
            Complete all previous stage tasks to unlock.
          </p>
        )}
      </div>

      {/* Nudge banner (stage tasks only) */}
      {!isTimelineTask && !isDone && !locked && task.nudge && (
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

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        {/* Open feature (stage tasks) / Edit timeline (timeline tasks) */}
        {!isDone && !locked && !isTimelineTask && (
          <button
            type="button"
            onClick={() => onOpen(task.featureId as FeatureId)}
            className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            Open feature
            <ArrowRight className="size-3" />
          </button>
        )}

        {/* Toggle done for timeline tasks */}
        {isTimelineTask && entryId && (
          <button
            type="button"
            onClick={() => toggleTimelineEntryDone(entryId)}
            className={`ds-caption flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
              isDone
                ? 'border-border text-muted-foreground hover:text-foreground'
                : 'border-foreground/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            {isDone ? (
              <><X className="size-3" />Mark undone</>
            ) : (
              <><Check className="size-3" />Mark done</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── KanbanColumn ──────────────────────────────────────────────────── */

function KanbanColumn({
  column,
  tasks,
  lockedStages,
  onOpen,
}: {
  column: { id: TaskStatus; label: string }
  tasks: Task[]
  lockedStages: Set<ThesisStage>
  onOpen: (featureId: FeatureId) => void
}) {
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

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <span className="ds-caption text-muted-foreground/50">No tasks here</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpen}
              locked={lockedStages.has(task.stageId)}
            />
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
  isCurrent,
  onToggle,
}: {
  stageId: ThesisStage
  selected: boolean
  count: number
  isCurrent: boolean
  onToggle: () => void
}) {
  const tag = STAGE_TAG[stageId]
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`ds-caption flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors duration-150 ${
        selected
          ? `${tag.cls} border-transparent`
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {selected && <Check className="size-3" strokeWidth={2.5} />}
      {tag.label}
      {isCurrent && <span className="size-1.5 rounded-full bg-foreground/40" />}
      <span className="opacity-60">{count}</span>
    </button>
  )
}

/* ── Stage progress summary ────────────────────────────────────────── */

function StageProgress({ tasks }: { tasks: Task[] }) {
  const stageIds = STAGES.map((s) => s.id) as ThesisStage[]
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {stageIds.map((sid) => {
        const stageTasks = tasks.filter((t) => t.stageId === sid)
        const done = stageTasks.filter((t) => t.status === 'done').length
        const total = stageTasks.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
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

function deriveTimelineTasks(
  timeline: import('@/stores/thesis-store').TimelineEntry[],
  handIn: string | null,
  currentStage: ThesisStage,
): Task[] {
  if (!handIn || timeline.length === 0) return []

  const handInDate = new Date(handIn + 'T12:00:00')
  const week20Start = new Date(handInDate)
  week20Start.setDate(week20Start.getDate() - 19 * 7)
  // align to Monday
  const dow = week20Start.getDay()
  week20Start.setDate(week20Start.getDate() + (dow === 0 ? -6 : 1 - dow))

  const todayMs = Date.now()

  return timeline.map((entry) => {
    const weekStartMs = new Date(week20Start).setDate(
      week20Start.getDate() + (entry.week - 1) * 7
    )
    const weekEndMs = new Date(week20Start).setDate(
      week20Start.getDate() + (entry.week - 1 + entry.duration) * 7 - 1
    )

    let status: TaskStatus
    if (entry.done) {
      status = 'done'
    } else if (todayMs > weekEndMs) {
      status = 'done'
    } else if (todayMs >= weekStartMs) {
      status = 'in-progress'
    } else {
      status = 'ready'
    }

    return {
      id: `tl-${entry.id}`,
      stageId: currentStage,
      title: entry.label,
      description: entry.notes ?? `${entry.category} · ${entry.duration} week${entry.duration !== 1 ? 's' : ''}`,
      featureId: 'create-timeline',
      status,
    }
  })
}

export function ThesisBoard({ onFeatureOpen }: ThesisBoardProps) {
  const { tasks, profile, timeline, timelineHandIn } = useThesisStore()

  const currentStage = (profile.stage ?? 'orientation') as ThesisStage
  const allStageIds = STAGES.map((s) => s.id) as ThesisStage[]

  const [selectedStages, setSelectedStages] = useState<Set<ThesisStage>>(
    new Set([currentStage]),
  )

  useEffect(() => {
    setSelectedStages((prev) => {
      if (prev.has(currentStage)) return prev
      return new Set([currentStage])
    })
  }, [currentStage])

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

  const showAll = selectedStages.size === allStageIds.length
  const toggleAll = () => {
    setSelectedStages(showAll ? new Set([currentStage]) : new Set(allStageIds))
  }

  const timelineTasks = deriveTimelineTasks(timeline, timelineHandIn, currentStage)
  const allTasks = [...tasks, ...timelineTasks]
  const filteredTasks = allTasks.filter((t) => selectedStages.has(t.stageId))

  // Compute which stages are locked (user hasn't reached them yet)
  const lockedStages = new Set<ThesisStage>(
    allStageIds.filter((id) => !isStageUnlocked(id, currentStage))
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile.name?.split(' ')[0] ?? null

  const STAGE_SLOGANS: Record<ThesisStage, string> = {
    orientation:         'Your thesis journey starts here — let\'s get your profile set up.',
    'topic-discovery':   'You\'re finding your topic. The right idea is closer than you think.',
    'supervisor-search': 'Planning time. A solid foundation now saves weeks later.',
    planning:            'In the thick of it — this is where great theses are made.',
    'execution-writing': 'Almost there. Every paragraph brings you closer to done.',
  }
  const slogan = STAGE_SLOGANS[currentStage]

  return (
    <div className="flex min-h-full flex-col">
      {/* Header + filter */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ds-label uppercase tracking-[0.18em] text-muted-foreground">Thesis Board</p>
          <h2 className="ds-title-md mt-1 text-foreground">
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className="ds-body mt-1 text-muted-foreground">{slogan}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Filter className="size-3" />
            Stage
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className={`ds-caption flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors duration-150 ${
              showAll
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            All
          </button>
          {allStageIds.map((id) => (
            <StageFilterPill
              key={id}
              stageId={id}
              selected={selectedStages.has(id)}
              count={allTasks.filter((t) => t.stageId === id).length}
              isCurrent={id === currentStage}
              onToggle={() => toggleStage(id)}
            />
          ))}
        </div>
      </div>

      {/* Stage progress bar summary */}
      <StageProgress tasks={allTasks} />

      {/* Board */}
      <div className="flex flex-1 gap-5 overflow-x-auto pb-6">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter((t) => t.status === col.id)}
            lockedStages={lockedStages}
            onOpen={onFeatureOpen}
          />
        ))}
      </div>
    </div>
  )
}
