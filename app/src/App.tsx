import { BadgeCheck, Blocks, Sparkles } from 'lucide-react'

import logo from '@/assets/studyond.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-10">
      <div className="ds-layout-onboarding mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-8">
        <div className="flex flex-col gap-5 border-b border-border pb-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Studyond" className="h-8 w-auto" />
            <Badge variant="secondary" className="rounded-full px-3 py-1 ds-badge">
              Setup ready
            </Badge>
          </div>

          <div className="max-w-3xl space-y-3">
            <p className="ds-label uppercase tracking-[0.2em] text-muted-foreground">
              Studyond app foundation
            </p>
            <h1 className="ds-title-xl text-balance text-foreground">
              React, TypeScript, Vite, Tailwind v4 and shadcn/ui are wired to the Studyond design system.
            </h1>
            <p className="ds-body max-w-2xl text-muted-foreground">
              This starter confirms the stack is working and already uses
              Studyond tokens, type scale and component primitives.
            </p>
          </div>
        </div>

        <section className="grid-3-col">
          <Card className="border-border/80 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader className="space-y-3">
              <Sparkles className="size-5 text-foreground" />
              <CardTitle className="ds-title-cards">
                Brand styling connected
              </CardTitle>
              <CardDescription className="ds-small text-muted-foreground">
                <code>src/App.css</code> comes from the Studyond brand package
                and is loaded globally.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader className="space-y-3">
              <Blocks className="size-5 text-foreground" />
              <CardTitle className="ds-title-cards">
                UI primitives generated
              </CardTitle>
              <CardDescription className="ds-small text-muted-foreground">
                shadcn components are available under <code>src/components/ui</code> with the Studyond config.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader className="space-y-3">
              <BadgeCheck className="size-5 text-foreground" />
              <CardTitle className="ds-title-cards">
                Ready for implementation
              </CardTitle>
              <CardDescription className="ds-small text-muted-foreground">
                State, forms, motion and AI SDK packages are installed for the
                next feature slice.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button className="rounded-full px-5">Studyond stack active</Button>
          <Button variant="outline" className="rounded-full px-5">
            Start building features
          </Button>
        </div>
      </div>
    </main>
  )
}

export default App
