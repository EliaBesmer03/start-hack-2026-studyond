<p align="center">
  <img src="app/src/assets/thumbnail/studyond-thumbnail.png" alt="Studyond – Your thesis, guided" width="400" />
</p>

<h1 align="center">Studyond Thesis Journey</h1>

<p align="center">
  An AI-powered thesis companion that guides students from topic discovery to final submission — built at <strong>START Hack 2026</strong>.
</p>

<p align="center">
  <a href="https://studyond.com">studyond.com</a>
</p>

<p align="center">
<a href="https://studyond.vercel.app">https://studyond.vercel.app</a>
</p>

---

## The Problem

Writing a thesis is one of the most complex tasks in a student's academic career. Students struggle with choosing a topic, finding supervisors, planning milestones, conducting research, and staying on track — often with minimal guidance and no structured process.

## Our Solution

A modular, stage-based web app that walks students through their entire thesis journey with an AI Co-Pilot at their side. The platform connects Studyond's marketplace of topics, supervisors, and companies into one guided experience.

### Features

| Stage | Feature | Description |
|-------|---------|-------------|
| **Orientation** | Profile Setup | Capture field, degree, university, and interests |
| | Intelligence Survey | Personality & strengths mapping with spider-web visualization |
| **Topic & Supervisor** | Topic Explorer | Browse and bookmark thesis topics with field filtering |
| | Supervisor Search | Search professors, view past projects, shortlist candidates |
| | Smart Match | AI-curated topic + supervisor + company combos |
| | Final Decision | Lock in your thesis trio before moving forward |
| **Planning** | Timeline Builder | Interactive drag-to-create milestone timeline |
| | Planning Co-Pilot | AI assistant for proposals, methodology, and registration |
| **Execution** | Literature Search | Search Swiss academic libraries (SLSP/swisscovery) in real-time |
| | Interview Partners | Find domain experts, record & transcribe interviews with AI |
| | Thesis Twin | 1:1 peer matching for mutual accountability |
| | Analysis Co-Pilot | AI guidance for data collection, methods, and findings |
| **Writing** | Draft Reader | Request expert/alumni feedback on chapters |
| | Thesis Alumni | Post-thesis profile for future student discovery |

### AI Co-Pilot

The Co-Pilot is a context-aware AI assistant (Claude) that adapts across three modes:

- **Topic Mode** — Research advisor for exploration and narrowing down
- **Planning Mode** — Project manager for structure and milestones
- **Analysis Mode** — Methods expert for data and interpretation

It learns from every interaction: interests, decisions, constraints, and progress are automatically extracted and carried across all features and conversations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 + Framer Motion |
| Components | Radix UI + Lucide Icons |
| AI | Anthropic Claude (via AI SDK) |
| Transcription | AssemblyAI |
| State | Zustand (persisted to localStorage) |
| Library Search | SLSP SRU API (swisscovery) |
| Deployment | Vercel |

## Architecture

```
app/src/
├── components/
│   ├── features/          14 feature modules (one per thesis step)
│   ├── ui/                Reusable UI primitives
│   ├── Dashboard.tsx      Main app shell with sidebar + board + Co-Pilot
│   ├── CoPilotChat.tsx    Streaming AI chat with context injection
│   └── ThesisBoard.tsx    Kanban-style task tracker
├── stores/
│   └── thesis-store.ts    Zustand store (profile, tasks, knowledge, decisions)
├── lib/
│   └── slsp.ts            SLSP library catalog search client
├── data/
│   ├── mock.ts            Topics, supervisors, companies, experts
│   └── mockContext.ts     Co-Pilot system prompts
└── api/
    └── slsp/              Vercel serverless proxy for SLSP API
```


## Team

| Name |
|------|
| **Nela Brack** |
| **Karla Ruggaber** |
| **Thierry Suhner** |
| **Elia Besmer** |

Built with caffeine and conviction at START Hack 18.-20.3.2026, St. Gallen.

---

<p align="center">
  <strong>Studyond</strong> — Your thesis, guided.
</p>
