# Studyond — START Hack 2026 Strategy

> **Concept:** *"Today Studyond helps students find a topic. We built everything that comes after."*

The solution extends Studyond's existing AI from a discovery tool into a full thesis companion — covering all five stages, respecting modular entry, and accumulating context over time. It is split into two independently shippable parts so the team can demo Part 1 even if Part 2 is incomplete.

---

---

# Part 1 — Thesis GPS + Board
### *Adaptive onboarding, visual journey map, and stage-aware Kanban tracker*

**What it solves:** Students arrive confused, at different points in the journey, with no sense of what comes next. This part detects where each student is, shows them the full road ahead, and gives them a structured workspace to track progress through all five stages.

**Independent value:** Part 1 is a fully demoable product on its own. A judge can walk through the onboarding wizard, land on the board, and use the Co-Pilot — without Part 2 existing at all.

---

## Feature 1A — Thesis GPS (adaptive onboarding wizard)

### What it is
A 3-step onboarding flow that replaces the current one-size-fits-all signup. It detects each student's position in the thesis journey and adapts the entire experience accordingly.

### How it works
On first login (or when a returning student has no active project), the wizard asks some questions to determine in which of the 5 stages the student is in at the moment. the questionnaire should be multiple choice and not be longer than 2 minutes. Based on answers, the system assigns one of five entry points:

| Student profile | Entry point |
|---|---|
| Nothing confirmed yet | Orientation stage — browse topics, meet the GPS |
| Has interests, no topic | Topic discovery — AI matching + explore |
| Has topic, no supervisor | Supervisor search — cross-entity match |
| Has topic + supervisor | Planning stage — board unlocked, Co-Pilot activated |
| Deep in writing | Execution/Writing stages — board + feedback tools |

The GPS also handles re-entry: if a student's supervisor drops out mid-thesis, they re-run the relevant wizard step and the board re-routes forward without losing previous context.

### Why it matters
The challenge brief explicitly names **Modular Entry** as a core requirement. The current platform treats all students identically. The GPS is the implementation of that principle — and takes under 60 seconds to complete.

### Key design details
- Never more than 3 questions; progress bar shown throughout
- Each question has a "not sure" escape that routes to the most conservative starting point
- The wizard output populates the student's thesis profile, which feeds the Co-Pilot from day one
- Tone: calm, direct, no jargon — "Let's figure out where you are"

---

## Feature 1B — Journey map sidebar

### What it is
A persistent sidebar graphic on the student dashboard showing the full five-stage thesis journey, with the student's current stage highlighted and the next two milestones visible.

### The five stages shown
```
① Orientation      → Explore topics, understand options
② Topic & Supervisor → Lock in research question + professor
③ Planning         → Methodology, timeline, expectations
④ Execution        → Research, data, iterations
⑤ Writing & Finalization → Draft, feedback, submission
```

### Why it matters
Most students don't understand the full thesis process until they've already been through it. Showing the entire arc upfront — and where they sit within it — dramatically reduces anxiety and helps students make better decisions earlier. It directly addresses the emotional arc described in the challenge brief: *anxiety → relief → confidence → action*.

### Key design details
- Stages shown as connected nodes; active stage is highlighted, completed stages are ticked, future stages are muted
- Clicking any stage shows a tooltip: what happens here, what you need, estimated time
- The map updates automatically as the student progresses
- Designed as a narrow sidebar (~200px) so it never dominates the dashboard

---

## Feature 1C — Thesis Board (stage-aware Kanban)

### What it is
A Kanban-style board with five columns — one per thesis stage — that replaces the current empty student dashboard. Each column contains pre-populated task cards relevant to that stage, which the student can check off, reorder, or customise.

### Default task cards per stage

**Orientation**
- Complete your thesis profile
- Browse 3+ topic areas
- Read 2 company topic briefs

**Topic & Supervisor**
- Shortlist 3 topics
- Apply to 1–2 company topics
- Identify 3 potential supervisors
- Send first supervisor outreach

**Planning**
- Confirm research methodology
- Draft thesis proposal
- Agree milestones with supervisor
- Register thesis at university

**Execution**
- Conduct literature review
- Find and schedule interview partners
- Gather primary data
- Complete first draft of analysis

**Writing & Finalization**
- Write introduction and conclusion
- Incorporate supervisor feedback
- Request external draft reader
- Submit final thesis

### Key design details
- Task cards show status (to do / in progress / done) with a simple toggle
- Overdue tasks surface a gentle nudge ("Your planning deadline passed 3 days ago — want the Co-Pilot to help you catch up?")
- University-specific requirements can be uploaded by the institution and appear as pinned reference cards in the relevant stage column
- The board is the persistent home screen — the student returns to it every session

---

## Feature 1D — Stage-scoped Co-Pilot

### What it is
A context-accumulating AI assistant embedded in the board. Unlike the current Student AI Agent (which only handles topic discovery and starts fresh each session), the Co-Pilot is scoped to the student's active stage, remembers all previous conversations, and becomes more useful over time.

### How context accumulation works
Every interaction updates the student's thesis profile:
- Topics explored and bookmarked
- Supervisors contacted
- Methodology preferences expressed
- Deadlines and milestones confirmed
- Feedback received and noted

This accumulated context powers better recommendations at every subsequent step. A student who said "I'm interested in sustainable supply chains" three weeks ago doesn't need to repeat it — the Co-Pilot already knows.

### Stage-specific Co-Pilot modes

| Stage | Co-Pilot focus | Example prompts it handles |
|---|---|---|
| Orientation | Topic exploration, anxiety reduction | "What fields match my background?" / "How long does this actually take?" |
| Topic & Supervisor | Match reasoning, outreach drafting | "Why does this topic fit me?" / "Help me write a cold email to this professor" |
| Planning | Methodology guidance, proposal structure | "Should I use qualitative or quantitative methods?" / "What goes in a thesis proposal?" |
| Execution | Interview prep, data questions, progress check | "Help me write interview questions for a logistics expert" / "I'm stuck on my literature review" |
| Writing & Finalization | Structure feedback, formatting rules, deadline tracking | "Is my introduction too broad?" / "What are the formatting requirements from my university?" |

### University requirements integration
Institutions can upload their formal thesis guidelines (PDF or text) directly to the platform. The Co-Pilot ingests these and answers student questions about them in context — eliminating the flood of admin emails that currently plagues thesis coordinators.

### Key design details
- Co-Pilot chat opens as a side panel from any board column, or as a full-screen view
- Conversation history is visible and searchable
- Students can manually add notes to their thesis profile ("I've decided to focus on B2B SaaS")
- The Co-Pilot never makes academic decisions — it always frames suggestions as options for the student and supervisor to agree on (respects Academic Governance)

---

## Part 1 — Technical notes

**What to build on top of:**
- Existing Student AI Agent (extend, don't replace)
- Existing Thesis Project Lifecycle states (`proposed → applied → agreed → in_progress → completed`) — map directly to board columns
- Existing mock data: students, supervisors, topics, universities

**Minimum viable demo for Part 1:**
1. Wizard with 3 questions → entry point detection
2. Dashboard with journey sidebar + Kanban board
3. One stage's Co-Pilot working end-to-end (recommend Planning stage — high signal, mid-journey)
4. University requirements upload → Co-Pilot can answer one formatting question

**Stack note:** The stage-scoped Co-Pilot is the AI-heavy component. If time is short, build the board and sidebar as the hero demo and show the Co-Pilot answering one pre-loaded conversation — judges will extrapolate.

---

---

# Part 2 — Smart Match + Thesis Twin
### *Cross-entity intelligence, tinder-style matching, and peer feedback network*

**What it solves:** Even students who know their topic and have a supervisor still hit walls: cold-emailing strangers for interviews, writing in complete isolation, no structured feedback before submission. Part 2 addresses the social and collaborative gaps that Part 1 can't solve alone.

**Independent value:** Part 2 can be presented as a standalone feature set — a judge who only sees Part 2 should understand it without needing Part 1. However, it becomes significantly more powerful when the thesis profile built in Part 1 feeds the matching algorithms here.

---

## Feature 2A — Smart Match Engine (cross-entity intelligence)

### What it is
An upgrade to the existing Matching Engine that surfaces bundled recommendations across multiple entity types simultaneously. Instead of matching a student to a topic, it matches a student to a **topic + compatible supervisor + company partner** as a single coherent "match card".

### How it works
The engine combines signals from:
- Student thesis profile (field, interests, methodology preference, stage)
- Topic relevance scores (existing)
- Supervisor research alignment (published topics, fields, current capacity)
- Company domain fit (industry, topic category, open collaborations)
- Expert domain relevance (for interview partner suggestions in Stage 4)

It then presents these as match cards in a swipe interface.

### The swipe UI
Each match card shows:
- **Topic** — title, company, field, brief description
- **Supervisor match** — name, faculty, research alignment reason
- **Company match** — company name, why their data/context fits the topic
- **Match score** — a simple percentage ("87% aligned to your profile")
- **Action:** Accept / Skip / Save for later

On accept, the student's interest is logged. If the supervisor and/or company also accept (via their own platform view), the system automatically proposes a three-way introduction meeting — populated with a calendar link and a brief shared context summary.

### Why it's different from the current matcher
The current Matching Engine matches students to topics. Smart Match connects students to the full collaboration unit — reducing the number of separate searches, cold emails, and coordination tasks from ~4 down to 1.

### Key design details
- Match cards load progressively — students don't need to review all matches at once
- "Why this match?" is always visible — the Co-Pilot can explain the reasoning in plain language
- Mutual accept threshold before meeting is auto-proposed: both student and at least one other party (supervisor or company) must accept
- Respects Academic Governance: the system proposes the meeting; the professor retains full authority over whether to proceed

---

## Feature 2B — Interview partner matching (Stage 4 extension)

### What it is
An extension of Smart Match specifically for finding qualitative research interviewees during Stage 4 (Execution). Students describe their research question and ideal interviewee profile; the system surfaces matching Experts from the existing platform network.

### How it works
1. Student opens "Find interview partners" from the Execution stage board column
2. Co-Pilot asks 3 questions: research topic, type of expertise needed, preferred interview format (remote/in-person/async)
3. System surfaces Expert matches with their domain, availability flag, and a suggested outreach message drafted by the Co-Pilot
4. Student sends connection request through existing Direct Messaging system

### Why it matters
The current experience requires cold outreach via LinkedIn — low response rates, slow, and biased toward students with stronger networks. This feature democratises access to interview partners and cuts setup time from days to minutes.

---

## Feature 2C — Thesis Twin (peer matching + writing accountability)

### What it is
A lightweight peer matching system that connects students working on theses at similar stages, in similar fields, for mutual accountability and support during the loneliest parts of the process (Execution and Writing).

### How it works
Students opt in to Thesis Twin from the board. The system matches them with one peer based on:
- Similar thesis stage (within 2–3 weeks)
- Overlapping field or methodology
- Compatible check-in frequency preference (weekly / bi-weekly / ad hoc)

Matched pairs get a shared space where they can:
- Set mutual deadlines ("I'll have my methods section done by Friday")
- Share progress updates (text only — no draft sharing required)
- Celebrate milestones ("My supervisor approved my proposal!")

### Key design details
- No group chats — always 1:1 pairs to keep it manageable
- The system suggests one new Twin match per stage; students can decline without penalty
- Pairs expire naturally when both students submit — no awkward off-boarding needed
- Privacy-first: no thesis content is shared unless the student explicitly chooses to

---

## Feature 2D — Draft feedback network (Writing & Finalization stage)

### What it is
A structured system for connecting students in Stage 5 (Writing & Finalization) with professors, industry experts, or alumni willing to read a draft chapter and give feedback. Addresses the biggest gap in the writing stage: the weeks of silence between supervisor check-ins.

### How it works
**Student side:**
1. From the Writing stage board column, student clicks "Request a draft reader"
2. Specifies: what kind of feedback they need (structure / argumentation / industry relevance / language), which chapter or section, and their deadline
3. System surfaces matching Experts or alumni who have indicated availability for draft review

**Reader side:**
- Experts and alumni can toggle a "available for draft review" flag on their profile
- They specify: fields they can review, max pages per month, preferred format (written comments / 30-min call)
- When matched, they receive the student's request via Direct Messaging — they accept or decline

### Why it matters
The formal supervisor meets students every few weeks at best, and the grading relationship inhibits honest questions. An independent reader — especially an industry expert for a company-linked thesis — provides a different kind of feedback that is highly valued but currently inaccessible to most students.

### Key design details
- Feedback stays on the platform via Direct Messaging — no external file sharing required
- The Co-Pilot can prepare students before sending a draft: "Here are 3 questions to ask your reader about this chapter"

---

## Part 2 — Technical notes

**What to build on top of:**
- Part 1's thesis profile (Smart Match needs accumulated context to work well)
- Existing Experts network and Direct Messaging system
- Existing mock data: experts, companies, supervisors, students

**Minimum viable demo for Part 2:**
1. Smart Match swipe interface with 3–4 pre-loaded match cards from mock data
2. Show the "why this match" explanation panel
3. Thesis Twin opt-in and a pre-loaded matched pair view
4. Draft Reader request flow (even as a static mockup showing the request form and one matched reader)

**Stack note:** The swipe UI is the highest-impact visual for judges. Build that first. The mutual-accept → meeting logic can be simulated with a single click ("Both parties accepted — meeting proposed") for the demo.

---

---

# Combined pitch narrative

> **Opening:** Every student hits the same wall. They find a topic on Studyond in 20 minutes — then spend the next 6 months figuring everything else out alone.
>
> **Part 1:** So we built the Thesis GPS. It meets every student where they are, shows them the full road ahead, and gives them a co-pilot that gets smarter every week.
>
> **Part 2:** And we built Smart Match — because a great topic is useless without the right supervisor, the right company, and the right people to talk to. One swipe. One introduction. One thesis that actually gets done.
>
> **Close:** Studyond already has the building blocks. We connected them.

---

## How the two parts connect

| Signal produced in Part 1 | Used in Part 2 |
|---|---|
| Entry point (stage detected) | Smart Match surfaces stage-appropriate bundles |
| Topic interests and bookmarks | Co-Pilot explains match reasoning |
| Methodology preference | Interview partner matching filters by expertise type |
| Current stage progress | Thesis Twin matches peers at similar stage |
| University formatting rules | Draft reader is briefed on institutional requirements |

The two parts are **independently demoable** but **exponentially more powerful together**. Part 1 builds the student's context profile; Part 2 uses it to make every human connection on the platform smarter.
