# Studyond — The Thesis Journey, Reconnected

## Overview

**Studyond** is an AI-powered thesis journey platform built for the START Hack 2026 hackathon. It guides students through their entire thesis process — from orientation to final submission — using a structured, stage-based approach combined with AI co-pilots, smart matching, and persistent progress tracking. The platform is built on top of Studyond AG's existing ecosystem of thesis topics, supervisors, companies, and experts.

**Core mission:** Transform the thesis writing experience from a scattered, self-directed process into a structured, AI-supported journey where students at every stage receive personalized guidance, matching, and collaboration tools.

---

## The Problem

Writing a thesis is one of the most demanding and under-supported academic experiences a student faces. Most students navigate the process alone — unsure of where to start, which topic to pick, how to find a supervisor, and how to structure months of work. Studyond already connects students with topics and companies. This platform extends that into a full end-to-end journey.

---

## The 5 Thesis Stages

The entire product is organized around five thesis stages that reflect the real timeline of a thesis:

### Stage 1 — Orientation (Weeks 1–4)
- **Thesis Profile Setup:** Students enter their field of study, research interests, and constraints.
- **Learning Profile Survey:** An optional personality and academic strength assessment, visualized as a radar/spider-web chart.

### Stage 2 — Topic & Supervisor Discovery (Weeks 2–8)
- **Topic Explore:** Browse 7,500+ thesis topics from 185+ companies. Students can bookmark up to 3 favorites.
- **Supervisor Search:** Find and shortlist professors whose research interests align with the student's goals.
- **Smart Match:** AI-powered matching of topic + supervisor + company combinations tailored to the student's profile.
- **Final Decision:** Students commit to their final topic, supervisor, and company to advance to the next stage.

### Stage 3 — Planning (Weeks 4–10)
- **Create Timeline:** A drag-and-drop milestone builder for the full thesis timeline.
- **Planning Co-Pilot:** AI assistant for methodology, thesis proposals, supervisor milestone planning, and university registration.

### Stage 4 — Execution (Weeks 6–20)
- **Literature Co-Pilot:** Structure sources, identify research gaps, and manage bibliography.
- **Interview Partners:** Find and schedule domain expert interviews from Studyond's expert network.
- **Thesis Twin:** Peer accountability pairing — matched with another student at the same thesis stage.
- **Analysis Co-Pilot:** AI guidance for data collection, analysis, and interpreting findings.

### Stage 5 — Writing & Finalization (Weeks 16–24)
- **Draft Reader:** Request expert review of individual thesis chapters.
- **Alumni Profile:** Leave feedback to help future students navigate the same journey.

---

## Core Features

### Kanban Board (ThesisBoard)
The central task management interface. All pre-built tasks for the current stage are displayed in three columns: *Ready*, *In Progress*, and *Done*. Tasks are preset by Studyond — students cannot add custom tasks to the board. The board is the student's primary navigation hub.

### AI Co-Pilot (CoPilotChat)
A streaming AI chat interface powered by Anthropic Claude (Haiku 4.5). The co-pilot operates in three role-based modes:
- **Topic Mode** — Academic advisor for topic exploration and supervisor outreach
- **Planning Mode** — Project manager for proposals, methodology, and registration
- **Analysis Mode** — Data analyst for collection design and interpretation

Each mode uses a dynamically constructed system prompt that incorporates the student's current stage, confirmed topic and supervisor, bookmarked topics, saved literature, accepted experts, and extracted knowledge facts from prior conversations.

### Knowledge Base
After each co-pilot conversation, the system automatically extracts structured facts (interests, decisions, constraints, progress, feedback) and stores them in a persistent knowledge base. This context is fed back into future AI interactions for a more personalized experience.

### Journey Map Sidebar
A persistent left-panel navigation showing all five stages and their tasks. Provides a bird's-eye view of the thesis journey and indicates completion status at a glance.

### Starting Tutorial
A step-by-step onboarding overlay that runs once per new user when they first log in. It highlights key UI elements in sequence, explains each feature, and walks the student into the Timeline view before releasing them to explore independently.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (new-york style) + Radix UI |
| State Management | Zustand (localStorage persistence) |
| Forms & Validation | React Hook Form + Zod |
| Animations | Framer Motion |
| Icons | Lucide React |
| AI Model | Anthropic Claude Haiku 4.5 |
| Deployment | Vercel |

---

## Data Model

**Mock data included in the repository:**
- **185+ companies** posting thesis topics
- **7,500+ thesis topics** with employment types (internship, working student, graduate, direct entry)
- **Supervisors** — professors with research field alignment
- **Experts** — industry professionals available for interviews
- **Students** — example profiles with skills and objectives
- **Fields & Universities** — research domains and degree programs

**Persistent app state (Zustand):**
- `profile` — student stage, name, email, onboarding status
- `tasks` — per-stage task list with completion tracking
- `chatHistories` — separate chat history per co-pilot mode
- `knowledgeFacts` — extracted insights from all conversations
- `finalDecision` — confirmed topic, supervisor, and company
- `timeline` — milestone list with week offsets and completion
- `savedLiterature` — bibliography with structured metadata
- `favouriteTopics`, `shortlistedSupervisors`, `acceptedExperts` — bookmarked items

All state persists to localStorage — students can close and reopen the app at any time without losing progress.

---

## Key Design Principles

1. **Modular entry** — Students can join at any stage. Already have a topic? Skip straight to Stage 3.
2. **Context accumulation** — Every bookmark, chat, and survey response builds richer AI understanding over time.
3. **Academic governance** — The AI suggests and supports; the professor and student always make final decisions.
4. **Milestone celebration** — Completing a stage triggers an animated celebration and unlocks the next stage.
5. **Editorial minimalism** — Clean, focused UI with no visual clutter. Only what the student needs, when they need it.

---

## Project Context

This platform was built for **START Hack 2026**, a hackathon organized by the HSG student community in St. Gallen, Switzerland. The challenge was issued by **Studyond AG** — a Swiss startup and HSG spin-off operating a three-sided marketplace connecting students, companies, and universities around thesis projects.

The team built a full production-quality prototype in hackathon conditions, including:
- A complete AI co-pilot with streaming responses and dynamic context building
- Smart matching across 7,500+ topics and 185+ companies
- A structured 5-stage journey with task management, timeline planning, and peer pairing
- A one-time onboarding tutorial personalized per user
- Full persistence across sessions via localStorage

**Tagline: "The Thesis Journey, Reconnected."**
