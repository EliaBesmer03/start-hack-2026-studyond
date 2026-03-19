import { Check, RotateCcw } from 'lucide-react'
import logo from '@/assets/studyond.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useThesisStore } from '@/stores/thesis-store'
import { STAGES } from '@/types/thesis'

const STAGE_LABELS: Record<string, string> = {
  orientation: 'Orientation',
  'topic-discovery': 'Topic & Supervisor',
  'supervisor-search': 'Supervisor Search',
  planning: 'Planning',
  'execution-writing': 'Writing & Finalization',
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  orientation: "Let's explore what's out there and find the right direction for you.",
  'topic-discovery': "You have a sense of direction — time to lock in your topic and find a supervisor.",
  'supervisor-search': "Your topic is set. Let's find the right supervisor to guide you.",
  planning: "Topic and supervisor confirmed. Time to build your roadmap.",
  'execution-writing': "You're in the home stretch. Let's get this thesis finished.",
}

export function Dashboard() {
  const { profile, resetProfile } = useThesisStore()
  const currentStage = profile.stage ?? 'orientation'

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Studyond" className="h-7 w-auto" />
            <Badge variant="secondary" className="rounded-full px-3 py-1 ds-badge">
              {STAGE_LABELS[currentStage]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProfile}
            className="gap-1.5 rounded-full text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Restart GPS
          </Button>
        </div>

        {/* Welcome */}
        <div className="space-y-3">
          <p className="ds-label uppercase tracking-[0.2em] text-muted-foreground">
            Your thesis journey
          </p>
          <h1 className="ds-title-xl text-balance text-foreground">
            {STAGE_DESCRIPTIONS[currentStage]}
          </h1>
        </div>

        {/* Stage journey */}
        <div className="space-y-3">
          {STAGES.map((stage, index) => {
            const stageIndex = STAGES.findIndex((s) => s.id === currentStage)
            const isActive = index === stageIndex
            const isCompleted = index < stageIndex

            return (
              <Card
                key={stage.id}
                className={`
                  transition-all duration-300
                  ${isActive ? 'border-foreground shadow-sm' : 'border-border/60 shadow-none'}
                  ${isCompleted ? 'opacity-60' : ''}
                `}
              >
                <CardHeader className="flex-row items-center gap-4 space-y-0 py-4">
                  <span
                    className={`
                      flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium
                      ${isActive ? 'bg-foreground text-background' : ''}
                      ${isCompleted ? 'bg-secondary text-muted-foreground' : ''}
                      ${!isActive && !isCompleted ? 'bg-secondary text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="ds-title-cards">{stage.label}</CardTitle>
                    <CardDescription className="ds-small text-muted-foreground">
                      {stage.description}
                    </CardDescription>
                  </div>
                  {isActive && (
                    <Badge className="rounded-full bg-foreground px-3 py-1 text-background ds-badge">
                      You are here
                    </Badge>
                  )}
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
