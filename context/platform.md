# Platform: What Exists Today

A detailed overview of what Studyond's platform currently offers -- the features, entities, and workflows that hackathon participants can build on.

## How It Works

### For Students

1. **Sign up** with your university email -- free, no commitment
2. **Browse topics** from companies across Switzerland, filtered by field, industry, and level (Bachelor/Master/PhD)
3. **Get AI-matched** to relevant topics based on your profile, field, and interests
4. **Apply directly** to companies -- your profile (interests, skills, university) goes with the application
5. **Connect with experts** for interviews, mentoring, and thesis support

### For Companies

1. **Register** and verify with your company email
2. **Publish topic briefs** describing your challenge and desired outcome
3. **Get AI-matched** with qualified students and academic supervisors
4. **Review applications** and connect with the best-fit students
5. **Post jobs** (internships, working student, graduate roles) alongside thesis topics

### For Universities

1. **Register** with your institutional email
2. **Publish or join research topics** aligned with teaching and research
3. **Get matched** with relevant company and expert partners
4. **Embed Studyond** into thesis modules -- students access it as part of coursework

## Platform Scale

Current numbers (publicly visible on the website):

- **7,500+** thesis topics
- **200+** companies
- **44+** Swiss universities
- **1,680+** study programs

## Data Model

These are the core entities in Studyond's system -- the building blocks available for any solution. Understanding how they relate is key to designing a good thesis journey.

### Users and Roles

Every user has a base profile (name, email, picture, about). Users can have one or more roles:

| Role           | Who                   | Key profile fields                                                      |
| -------------- | --------------------- | ----------------------------------------------------------------------- |
| **Student**    | University students   | degree (bsc/msc/phd), study program, university, skills, objectives     |
| **Expert**     | Company professionals | title, company affiliation, offer interviews (yes/no), expertise fields |
| **Supervisor** | University faculty    | university, research interests, published topics                        |

A single person can hold multiple roles (e.g., a PhD candidate might be both Student and Supervisor).

**Student objectives** -- what students are looking for on the platform:

- `topic` -- find a thesis topic
- `supervision` -- find a supervisor
- `career_start` -- find career opportunities
- `industry_access` -- connect with companies
- `project_guidance` -- get help with their thesis process

### Topics

Real thesis topics or research questions posted by companies or supervisors.

| Field               | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| Title & description | The problem statement                                               |
| Type                | `topic` (thesis/research) or `job` (employment)                     |
| Employment          | `yes` / `no` / `open` -- whether this can lead to a job             |
| Employment type     | `internship`, `working_student`, `graduate_program`, `direct_entry` |
| Workplace type      | `on_site`, `hybrid`, `remote`                                       |
| Degree level        | Bachelor, Master, PhD (can target multiple)                         |
| Fields              | Subject areas / disciplines (many-to-many)                          |
| Company             | The organization offering it                                        |
| University          | The academic institution (if supervisor-posted)                     |
| Supervisors         | Professors associated with this topic                               |
| Status              | Open, in progress, completed                                        |

There are 7,500+ active topics from 185+ companies across industries.

### Companies

Organizations that pay a subscription to access the platform.

| Field                      | Description                              |
| -------------------------- | ---------------------------------------- |
| Name, description, picture | Public profile                           |
| Address, size              | Company details                          |
| Domains                    | Industry sectors                         |
| Subscription tier          | `basic` or `enterprise`                  |
| Experts                    | Team members on the platform (unlimited) |
| Topics                     | Published thesis topics and job listings |

### Universities and Study Programs

Universities contain study programs. Study programs are first-class entities:

| Field                 | Description                          |
| --------------------- | ------------------------------------ |
| Program name          | e.g., "MSc Data Science"             |
| Degree level          | BSc, MSc, PhD                        |
| University            | Parent institution                   |
| Logo and branding     | Visual identity on the platform      |
| Connected students    | Students enrolled in this program    |
| Connected supervisors | Faculty associated with this program |

### Thesis Projects

The core collaboration entity -- a thesis project links a student with a topic, company, and supervisor.

| Field               | Description                           |
| ------------------- | ------------------------------------- |
| Title & description | What the thesis is about              |
| Motivation          | Why the student wants to work on this |
| Student             | The student working on it             |
| Topic               | The topic being addressed             |
| Experts             | Company professionals involved        |
| Supervisors         | Professors supervising                |
| CV file             | Student's uploaded CV                 |
| State               | Lifecycle state (see below)           |

**Thesis project lifecycle:**

```
proposed → applied → agreed → in progress → completed
                  ↘ withdrawn
                  ↘ rejected
                        ↘ canceled
```

States:

- `proposed` -- student has drafted a proposal
- `applied` -- proposal submitted to company/supervisor
- `withdrawn` -- student withdrew the application
- `rejected` -- company/supervisor declined
- `agreed` -- both sides confirmed, project starts
- `canceled` -- project was canceled after agreement
- `completed` -- thesis finished

### Direct Messages (Chats)

Real-time messaging between any users on the platform. Each chat has participants and a message history with timestamps.

### Entity Relationships

```
University ─── has many ──→ Study Programs ─── has many ──→ Students
                                                              │
Company ─── has many ──→ Experts                              │
    │                       │                                 │
    └── has many ──→ Topics ←── posted by ──┘ Supervisors    │
                        │                        │            │
                        └───── Thesis Project ───┘────────────┘
                              (links them all)
```

The **Thesis Project** is the central joining entity -- it connects a student, a topic, company experts, and supervisors into one collaboration.

## Key Platform Features

### AI Features (What Already Exists)

Studyond already has AI built into the product. Understanding what exists helps you design extensions, not duplicates.

**Student AI Agent:**

- Chat-based interface where students describe their interests
- The agent understands the student's profile (field, degree, university, skills, objectives)
- Suggests personalized thesis topics with reasoning -- links directly to real topics from real companies
- Conversations persist across sessions (stored locally)
- Supports streaming responses with visible reasoning
- Students can toggle between "Fast" and "Thinking" modes (quick answers vs. deeper reasoning)

**Expert AI Agent (Topic Creation):**

- Helps company professionals transform business challenges into structured thesis topics
- Guides them through framing: what's the question, what data is available, what degree level fits
- Can create topics directly through the conversation

**Profile Checking:**

- AI validates whether a student's profile is complete enough to take actions (apply, get matched)
- Identifies missing fields and suggests completion

**Matching Engine:**

- Matches students to topics based on: field of study, degree level, interests, skills, university context
- Powers the AI agent's topic suggestions

**What the AI does NOT do yet:**

- No support beyond topic discovery (doesn't help with planning, execution, or thesis progress)
- No context accumulation (each conversation is independent -- doesn't learn from past interactions)
- No autonomous agents (doesn't proactively search or suggest without being asked)
- No cross-entity recommendations (doesn't suggest supervisors, interview partners, or methodology)
- No milestone tracking or timeline awareness

### Other Features

**Application Management:** Lightweight system for companies to review student applications, with profiles, motivation, and fit indicators.

**Direct Messaging:** Real-time chat between students, professors, and company partners.

**Company Directory:** Browsable directory of companies with signal badges, team size, published topics, and active projects.

**University Profiles:** University and study program pages showing supervisors, research interests, and active student counts.

**People Directory:** Browse students, experts, and supervisors with filtering by field, university, and role.

**Bookmarking:** Students can save topics for later review.

**Notifications:** In-app notification system for applications, messages, and updates.

**Reporting & Analytics:** Engagement tracking -- which companies engage with which programs, how many students connect, outcomes.

## Tech Stack

For technically-oriented participants who want to build compatible solutions:

- **Frontend:** React + TypeScript, Vite
- **AI:** Vercel AI SDK (streaming chat with tool use)
- **UI:** Tailwind CSS, Radix UI components, Tabler Icons
- **State:** Zustand (lightweight state management)
- **Auth:** Auth0
- **Editor:** TipTap (rich text)
- **Internationalization:** i18next (English + German)

## What the Platform Does NOT Have Yet

These are the gaps -- the opportunity space for your hackathon solution:

**Journey & Flow:**

- No adaptive onboarding that detects where a student is in their thesis journey
- No modular flow that lets students enter at different stages (have a topic? skip ahead)
- No guided experience beyond "browse topics and apply"

**Planning & Progress:**

- No milestone or timeline planning for thesis projects
- No deadline tracking or progress nudges
- No methodology suggestions based on research question
- Thesis projects only have basic state tracking (proposed → completed), no granular progress

**AI & Intelligence:**

- AI only helps with topic discovery -- nothing for planning, execution, or writing stages
- No context accumulation across conversations (each chat is independent)
- No autonomous agents that proactively search, suggest, or act on the student's behalf
- No cross-entity recommendations (the AI suggests topics but not supervisors, interview partners, or mentors)
- No thesis profile that builds up over time from interactions

**Collaboration & Support:**

- No structured way to find interview partners for qualitative research
- No mentor matching beyond browsing the expert directory
- No feedback loops or check-in reminders during thesis execution
- No peer connection (students working on similar topics can't find each other)
