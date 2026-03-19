// @ts-ignore – JSON imports from outside src root via @mock alias
import topics from '@mock/topics.json'
// @ts-ignore
import supervisors from '@mock/supervisors.json'
// @ts-ignore
import companies from '@mock/companies.json'
// @ts-ignore
import universities from '@mock/universities.json'
// @ts-ignore
import fields from '@mock/fields.json'
// @ts-ignore
import experts from '@mock/experts.json'

export interface MockTopic {
  id: string
  title: string
  description: string
  companyId: string | null
  universityId: string | null
  fieldIds: string[]
  degrees: string[]
  employment: string
}

export interface MockSupervisor {
  id: string
  firstName: string
  lastName: string
  universityId: string
  researchInterests: string[]
  about?: string
}

export interface MockCompany {
  id: string
  name: string
  industry: string
  about?: string
}

export interface MockUniversity {
  id: string
  name: string
  city: string
  country: string
}

export interface MockField {
  id: string
  name: string
}

export interface MockExpert {
  id: string
  firstName: string
  lastName: string
  companyId: string
  role: string
  expertiseIds: string[]
}

export const allTopics: MockTopic[] = topics as MockTopic[]
export const allSupervisors: MockSupervisor[] = supervisors as MockSupervisor[]
export const allCompanies: MockCompany[] = companies as MockCompany[]
export const allUniversities: MockUniversity[] = universities as MockUniversity[]
export const allFields: MockField[] = fields as MockField[]
export const allExperts: MockExpert[] = experts as MockExpert[]

// Build a compact field lookup map
const fieldMap = Object.fromEntries(allFields.map((f) => [f.id, f.name]))
const companyMap = Object.fromEntries(allCompanies.map((c) => [c.id, c.name]))
const uniMap = Object.fromEntries(allUniversities.map((u) => [u.id, u.name]))

export interface KnowledgeFactInput {
  content: string
  sourceStage: string
  category: string
}

export interface StudentProgress {
  favouriteTopicIds: string[]
  shortlistedSupervisorIds: string[]
  acceptedExpertIds: string[]
  acceptedTwinId?: string | null
  savedMatchIds?: string[]
  finalDecision: { topicId: string; supervisorId: string; companyId: string | null } | null
  timeline: { label: string; category: string; week: number; duration: number; notes?: string; done?: boolean }[]
  timelineHandIn?: string | null
  timelineColumns?: { id: string; name: string }[]
  tasks: { title: string; stageId: string; status: string }[]
  onboardingAnswers: { questionIndex: number; value: string }[]
  studentName?: string | null
  studentEmail?: string | null
  surveyAnswers?: Record<string, 'a' | 'b' | number> | null
}

/**
 * Builds the system prompt for the Stage-scoped Co-Pilot.
 * Includes mock data context so the AI can answer questions about
 * available topics, supervisors, companies, and universities.
 * Knowledge facts from all stages are injected for cross-stage persistence.
 */
export interface SavedLiteratureInput {
  title: string
  authors: string[]
  year: string
  subjects: string[]
}

export function buildSystemPrompt(
  stage: string | null,
  concern: string | null,
  thesisNotes: string[] = [],
  universityGuidelines: string = '',
  knowledgeFacts: KnowledgeFactInput[] = [],
  progress?: StudentProgress,
  savedLiterature: SavedLiteratureInput[] = [],
  mode?: string,
): string {
  const stageLabel = {
    orientation: 'Orientation',
    'topic-discovery': 'Topic & Supervisor Search',
    'supervisor-search': 'Planning',
    planning: 'Execution',
    'execution-writing': 'Writing & Finalization',
  }[stage ?? ''] ?? 'Orientation'

  const topicsSummary = allTopics
    .slice(0, 20)
    .map(
      (t) =>
        `- "${t.title}" (${t.companyId ? companyMap[t.companyId] ?? t.companyId : uniMap[t.universityId ?? ''] ?? 'academic'}, fields: ${t.fieldIds.map((f) => fieldMap[f] ?? f).join(', ')}, degrees: ${t.degrees.join('/')})`,
    )
    .join('\n')

  const supervisorsSummary = allSupervisors
    .slice(0, 15)
    .map(
      (s) =>
        `- Prof. ${s.firstName} ${s.lastName} at ${uniMap[s.universityId] ?? s.universityId}: interests in ${s.researchInterests.slice(0, 3).join(', ')}`,
    )
    .join('\n')

  const companiesSummary = allCompanies
    .map((c) => `- ${c.name} (${c.industry})`)
    .join('\n')

  const universitiesSummary = allUniversities
    .map((u) => `- ${u.name} in ${u.city}, ${u.country}`)
    .join('\n')

  const notesSection = thesisNotes.length > 0
    ? `\n## Student's Profile Notes (remembered preferences — use these to personalise every answer)\n${thesisNotes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
    : ''

  const guidelinesSection = universityGuidelines.trim()
    ? `\n## University Thesis Requirements (uploaded by student — answer formatting questions from this)\n${universityGuidelines.trim()}`
    : ''

  const knowledgeSection = knowledgeFacts.length > 0
    ? `\n## Knowledge Base — What you know about this student (accumulated from ALL previous conversations)\nUse these facts to personalise every answer. Reference them naturally, don't list them back.\n${knowledgeFacts.map((f) => `- [${f.sourceStage}/${f.category}] ${f.content}`).join('\n')}`
    : ''

  // Build progress section from store data
  const progressLines: string[] = []
  if (progress) {
    // Student identity
    if (progress.studentName) {
      progressLines.push(`- Student name: ${progress.studentName}`)
    }
    if (progress.studentEmail) {
      progressLines.push(`- Student email: ${progress.studentEmail}`)
    }

    // Value-to-label mappings for onboarding answers
    const VALUE_LABELS: Record<number, Record<string, string>> = {
      0: {
        exploring: 'Just starting to explore',
        interests: 'Has interests, but no confirmed topic',
        'topic-no-supervisor': 'Has a topic, but needs a supervisor',
        'topic-and-supervisor': 'Has a topic and a supervisor',
        writing: 'Already deep into writing',
        'not-sure': 'Not sure where they are',
      },
      1: {
        business: 'Business & Economics',
        cs: 'Computer Science & Engineering',
        social: 'Social Sciences & Humanities',
        science: 'Natural Sciences & Medicine',
        'not-sure': 'Not sure yet',
      },
      2: {
        overview: 'A clear overview of what\'s ahead',
        'topic-help': 'Help finding the right topic',
        'supervisor-help': 'Connecting with the right supervisor',
        structure: 'A structured plan to stay on track',
        'not-sure': 'Not sure',
      },
    }

    // Onboarding answers
    if (progress.onboardingAnswers.length > 0) {
      const answerLabels: Record<number, string> = {
        0: 'Journey stage',
        1: 'Field',
        2: 'Biggest need',
      }
      progress.onboardingAnswers.forEach((a) => {
        const displayValue = VALUE_LABELS[a.questionIndex]?.[a.value] ?? a.value
        progressLines.push(`- Onboarding — ${answerLabels[a.questionIndex] ?? `Q${a.questionIndex}`}: ${displayValue}`)
      })
    }

    // Favourite topics
    if (progress.favouriteTopicIds.length > 0) {
      const favTopics = progress.favouriteTopicIds
        .map((id) => allTopics.find((t) => t.id === id))
        .filter(Boolean)
        .map((t) => `"${t!.title}"`)
      if (favTopics.length > 0) progressLines.push(`- Bookmarked topics: ${favTopics.join(', ')}`)
    }

    // Shortlisted supervisors
    if (progress.shortlistedSupervisorIds.length > 0) {
      const favSups = progress.shortlistedSupervisorIds
        .map((id) => allSupervisors.find((s) => s.id === id))
        .filter(Boolean)
        .map((s) => `Prof. ${s!.firstName} ${s!.lastName}`)
      if (favSups.length > 0) progressLines.push(`- Shortlisted supervisors: ${favSups.join(', ')}`)
    }

    // Accepted experts
    if (progress.acceptedExpertIds.length > 0) {
      const exps = progress.acceptedExpertIds
        .map((id) => allExperts.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => `${e!.firstName} ${e!.lastName} (${e!.role})`)
      if (exps.length > 0) progressLines.push(`- Accepted interview experts: ${exps.join(', ')}`)
    }

    // Final decision
    if (progress.finalDecision) {
      const topic = allTopics.find((t) => t.id === progress.finalDecision!.topicId)
      const sup = allSupervisors.find((s) => s.id === progress.finalDecision!.supervisorId)
      const comp = progress.finalDecision.companyId
        ? allCompanies.find((c) => c.id === progress.finalDecision!.companyId)
        : null
      progressLines.push(`- FINAL DECISION: Topic "${topic?.title ?? progress.finalDecision.topicId}", Supervisor ${sup ? `Prof. ${sup.firstName} ${sup.lastName}` : progress.finalDecision.supervisorId}${comp ? `, Company ${comp.name}` : ''}`)
    }

    // Accepted Thesis Twin
    if (progress.acceptedTwinId) {
      progressLines.push(`- Has been paired with a Thesis Twin (peer accountability partner)`)
    }

    // Timeline
    if (progress.timeline.length > 0) {
      const handIn = progress.timelineHandIn ? ` — hand-in date: ${progress.timelineHandIn}` : ''
      progressLines.push(`- Thesis timeline (${progress.timeline.length} entries${handIn}):`)
      progress.timeline.forEach((t) => {
        const status = t.done ? ' ✓ done' : ''
        const notes = t.notes ? ` — note: "${t.notes}"` : ''
        progressLines.push(`  - Week ${t.week}–${t.week + t.duration - 1}: ${t.label} (${t.category})${status}${notes}`)
      })
    }

    // Academic Identity Map (Learning Profile Survey)
    if (progress.surveyAnswers && Object.keys(progress.surveyAnswers).length > 0) {
      // Derive dominant axes from answers — simplified summary
      const aAnswers = Object.entries(progress.surveyAnswers).filter(([k]) => k.startsWith('a'))
      const pAnswers = Object.entries(progress.surveyAnswers).filter(([k]) => k.startsWith('p'))
      const axisCount: Record<string, number> = {}
      const A_AXIS_MAP: Record<string, Record<string, string>> = {
        a1: { a: 'STEM', b: 'Humanities' },
        a2: { a: 'Business', b: 'Social Sciences' },
        a3: { a: 'Law & Politics', b: 'Environment' },
        a4: { a: 'Arts & Design', b: 'Health & Medicine' },
        a5: { a: 'Humanities', b: 'STEM' },
        a6: { a: 'Social Sciences', b: 'Business' },
        a7: { a: 'Environment', b: 'Law & Politics' },
        a8: { a: 'Health & Medicine', b: 'Arts & Design' },
      }
      const P_AXIS_MAP: Record<string, Record<string, string>> = {
        p1: { a: 'Intrapersonal', b: 'Spiritual' },
        p2: { a: 'Interpersonal', b: 'Teaching' },
        p3: { a: 'Verbal', b: 'Logical' },
        p4: { a: 'Spatial', b: 'Musical' },
        p7: { a: 'Verbal', b: 'Spatial' },
        p8: { a: 'Intrapersonal', b: 'Interpersonal' },
      }
      for (const [k, v] of aAnswers) {
        const axis = A_AXIS_MAP[k]?.[v as string]
        if (axis) axisCount[axis] = (axisCount[axis] ?? 0) + 1
      }
      for (const [k, v] of pAnswers) {
        if (typeof v === 'number') continue
        const axis = P_AXIS_MAP[k]?.[v as string]
        if (axis) axisCount[axis] = (axisCount[axis] ?? 0) + 1
      }
      const topAxes = Object.entries(axisCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([ax]) => ax)
      if (topAxes.length > 0) {
        progressLines.push(`- Academic Identity Map completed — top domains: ${topAxes.join(', ')}`)
      } else {
        progressLines.push(`- Academic Identity Map completed`)
      }
    }

    // Task progress
    const doneTasks = progress.tasks.filter((t) => t.status === 'done')
    const inProgressTasks = progress.tasks.filter((t) => t.status === 'in-progress')
    if (doneTasks.length > 0) {
      progressLines.push(`- Completed tasks: ${doneTasks.map((t) => t.title).join(', ')}`)
    }
    if (inProgressTasks.length > 0) {
      progressLines.push(`- In-progress tasks: ${inProgressTasks.map((t) => t.title).join(', ')}`)
    }
  }

  const progressSection = progressLines.length > 0
    ? `\n## Student's Current Progress (from platform actions — bookmarks, decisions, tasks)\n${progressLines.join('\n')}`
    : ''

  const literatureSection = savedLiterature.length > 0
    ? `\n## Saved Literature Sources (student bookmarked these from swisscovery — reference them when discussing literature review)\n${savedLiterature.map((l) => `- "${l.title}" by ${l.authors.slice(0, 2).join(', ') || 'Unknown'}${l.year ? ` (${l.year})` : ''}${l.subjects.length > 0 ? ` — Topics: ${l.subjects.slice(0, 3).join(', ')}` : ''}`).join('\n')}`
    : ''

  const nameIntro = progress?.studentName ? `\nThe student's name: **${progress.studentName}** — use their first name naturally in conversation.` : ''

  // Build a mode-specific context block that references the student's concrete choices
  const modeContextLines: string[] = []
  if (mode && progress) {
    const fd = progress.finalDecision
    const finalTopic = fd ? allTopics.find((t) => t.id === fd.topicId) : null
    const finalSup = fd ? allSupervisors.find((s) => s.id === fd.supervisorId) : null
    const finalComp = fd?.companyId ? allCompanies.find((c) => c.id === fd.companyId) : null

    const favTopics = progress.favouriteTopicIds
      .map((id) => allTopics.find((t) => t.id === id))
      .filter(Boolean)

    const shortSups = progress.shortlistedSupervisorIds
      .map((id) => allSupervisors.find((s) => s.id === id))
      .filter(Boolean)

    if (mode === 'topic') {
      modeContextLines.push(`## Your Personalised Context for Topic Mode`)
      if (finalTopic) {
        modeContextLines.push(`The student has ALREADY committed to a topic: "${finalTopic.title}"${finalSup ? ` supervised by Prof. ${finalSup.firstName} ${finalSup.lastName}` : ''}${finalComp ? ` in partnership with ${finalComp.name}` : ''}. Help them refine, validate, or build on this choice. If they want to change topic, guide them carefully.`)
      } else if (favTopics.length > 0) {
        modeContextLines.push(`The student has bookmarked ${favTopics.length} topic(s): ${favTopics.map((t) => `"${t!.title}"`).join(', ')}. Help them evaluate and narrow down these options.`)
      } else {
        modeContextLines.push(`The student has not yet bookmarked any topics. Help them explore the available topic space based on their field and interests.`)
      }
      if (shortSups.length > 0) {
        modeContextLines.push(`Shortlisted supervisors: ${shortSups.map((s) => `Prof. ${s!.firstName} ${s!.lastName}`).join(', ')}. When helping with supervisor outreach, tailor emails to their specific research interests.`)
      }
    }

    if (mode === 'planning') {
      modeContextLines.push(`## Your Personalised Context for Planning Mode`)
      if (finalTopic) {
        modeContextLines.push(`CONFIRMED THESIS: "${finalTopic.title}"`)
        const topicFields = finalTopic.fieldIds.map((f) => fieldMap[f] ?? f).join(', ')
        if (topicFields) modeContextLines.push(`Research fields: ${topicFields}`)
        if (finalSup) modeContextLines.push(`Supervisor: Prof. ${finalSup.firstName} ${finalSup.lastName}${finalSup.researchInterests.length > 0 ? ` — interests: ${finalSup.researchInterests.slice(0, 3).join(', ')}` : ''}`)
        if (finalComp) modeContextLines.push(`Industry partner: ${finalComp.name} (${finalComp.industry})`)
      } else {
        modeContextLines.push(`No confirmed topic yet. When answering planning questions, ask the student about their topic direction first so advice can be grounded.`)
      }
      if (progress.timeline.length > 0) {
        const handIn = progress.timelineHandIn ? ` — hand-in: ${progress.timelineHandIn}` : ''
        modeContextLines.push(`The student has a ${progress.timeline.length}-entry thesis timeline${handIn}. Reference it when discussing milestones and deadlines.`)
      } else {
        modeContextLines.push(`The student has not yet created a thesis timeline. Encourage them to build one — it's a prerequisite for good milestone planning.`)
      }
      modeContextLines.push(`When helping with proposals or registration abstracts, reference the confirmed topic, supervisor, and any methodology preferences already expressed.`)
    }

    if (mode === 'analysis') {
      modeContextLines.push(`## Your Personalised Context for Analysis Mode`)
      if (finalTopic) {
        modeContextLines.push(`THESIS TOPIC: "${finalTopic.title}"`)
        const topicFields = finalTopic.fieldIds.map((f) => fieldMap[f] ?? f).join(', ')
        if (topicFields) modeContextLines.push(`Research fields: ${topicFields}`)
        if (finalComp) modeContextLines.push(`Industry partner: ${finalComp.name} (${finalComp.industry}) — company data may be available for primary research`)
      } else {
        modeContextLines.push(`No confirmed topic yet. When designing data collection instruments, ask the student about their research question first.`)
      }
      if (progress.acceptedExpertIds.length > 0) {
        const exps = progress.acceptedExpertIds
          .map((id) => allExperts.find((e) => e.id === id))
          .filter(Boolean)
        modeContextLines.push(`Confirmed interview experts: ${exps.map((e) => `${e!.firstName} ${e!.lastName} (${e!.role})`).join(', ')}. Tailor interview guides for these specific people.`)
      }
      if (progress.acceptedTwinId) {
        modeContextLines.push(`The student has a Thesis Twin for peer accountability — they are not working alone.`)
      }
      if (savedLiterature.length > 0) {
        modeContextLines.push(`The student has saved ${savedLiterature.length} literature source(s). Reference these when discussing how to frame analysis against existing research.`)
      }
      const doneTlEntries = progress.timeline.filter((t) => t.done)
      if (doneTlEntries.length > 0) {
        modeContextLines.push(`Timeline entries already completed: ${doneTlEntries.map((t) => t.label).join(', ')}.`)
      }
    }
  }
  const modeContextSection = modeContextLines.length > 0
    ? `\n${modeContextLines.join('\n')}`
    : ''

  const CONCERN_LABELS: Record<string, string> = {
    overview: 'Getting a clear overview of what\'s ahead',
    'topic-help': 'Finding the right topic',
    'supervisor-help': 'Connecting with the right supervisor',
    structure: 'Having a structured plan to stay on track',
    'not-sure': 'Not sure yet',
  }
  const concernLabel = concern ? (CONCERN_LABELS[concern] ?? concern) : null

  return `You are Studyond's **${stageLabel} Co-Pilot** — a specialised AI thesis companion for students in Swiss universities.

The student's current stage: **${stageLabel}**${nameIntro}${concernLabel ? `\nThe student's main concern: ${concernLabel}` : ''}${notesSection}${progressSection}${knowledgeSection}${literatureSection}${guidelinesSection}${modeContextSection}

Your role:
- You are a conversational partner — the student can ask you ANYTHING freely
- Help students navigate their thesis journey with concrete, actionable advice
- Never make academic decisions for them — frame suggestions as options for them and their supervisor to agree on
- Be concise and warm; avoid jargon
- When students ask about topics, supervisors, or companies, use the data below to give specific, relevant answers
- When university requirements are provided, answer formatting and submission questions directly from those requirements
- IMPORTANT: You have a persistent memory across all stages. Use the Knowledge Base facts above to connect insights from earlier stages to the current conversation. The student should feel like you truly know them.
- Ask follow-up questions to understand the student better — every answer they give enriches the knowledge for all future conversations

## Available Thesis Topics (sample)
${topicsSummary}

## Available Academic Supervisors (sample)
${supervisorsSummary}

## Partner Companies
${companiesSummary}

## Partner Universities
${universitiesSummary}

## Stage-specific guidance
${stageGuidance(stage)}

Always end responses with a clear next step or question to keep momentum going.`
}

/**
 * System prompt for the background knowledge extraction call.
 * Extracts structured facts from a conversation snippet.
 */
export const KNOWLEDGE_EXTRACTION_PROMPT = `You are a fact extractor. Given a conversation between a student and a thesis co-pilot, extract NEW important facts about the student.

Return a JSON array of objects. Each object has:
- "content": a concise fact about the student (1 sentence, in English)
- "category": one of "interest", "decision", "constraint", "progress", "feedback"

Categories:
- interest: what topics, fields, methods the student is drawn to
- decision: concrete choices made (topic picked, supervisor chosen, methodology selected)
- constraint: limitations like deadlines, language, availability, budget
- progress: milestones reached, tasks completed, drafts written
- feedback: what the student liked/disliked, supervisor feedback received

Rules:
- Only extract FACTS, not opinions or generic statements
- Only extract NEW information — skip greetings, small talk, and things already known
- If no new facts → return []
- Maximum 5 facts per extraction
- Be concise: "Chose Mixed Methods approach" not "The student has decided to use a mixed methods research approach for their thesis"

Return ONLY valid JSON, no markdown fences, no explanation.`

function stageGuidance(stage: string | null): string {
  switch (stage) {
    case 'orientation':
      return `You are the **Kompass** — the Orientation guide (Stage 1, Weeks 1-4).
Your personality: Warm, encouraging, exploratory. You reduce overwhelm and build confidence.

## Your Domain Knowledge
This is the most emotionally overwhelming phase. Students know they need to write a thesis but have no clear direction — too many options, no structure, fear of choosing wrong. They are simultaneously managing coursework and career anxiety.

What students typically do today (and struggle with):
- Browse university bulletin boards for supervisor-posted topics (small inventory, often outdated)
- Google for inspiration (broad, unstructured, generic results)
- Ask classmates (depends entirely on personal network)
- No framework for narrowing down from a vast possibility space
- No visibility into what industry topics exist
- Fear of picking the wrong topic and wasting months
- No way to test whether an idea is feasible before committing

## Your Approach
- Build the student's profile through DIALOGUE — not a form. Ask about interests, strengths, constraints, timeline, degree level, field preferences
- Surface trends, company needs, and supervisor specialisations that match their emerging profile
- Give feasibility signals: "This direction has many available supervisors and active companies"
- Reduce anxiety: remind them that the first choice isn't final, and iteration is normal
- Help them understand the full thesis journey: 5 stages, roughly 24 weeks total
- Studyond has 7,500+ curated topics from 185+ companies — help them explore these

## Important Rules
- NEVER let them leave this stage without understanding their interests, constraints, and degree level
- Always ask follow-up questions — every answer enriches the knowledge for ALL future stages
- Frame topic areas as "directions to explore," not final decisions
- When a student says "I don't know what to write about," that's NORMAL — guide them through it`

    case 'topic-discovery':
      return `You are the **Matcher** — the Topic & Supervisor Search expert (Stage 2, Weeks 2-8).
Your personality: Analytical, helpful, proactive. You connect dots between students and opportunities.

## Your Domain Knowledge
The student has a vague direction and needs to lock in BOTH a specific topic AND a supervisor. These two searches are deeply intertwined — the topic shapes who can supervise, and the supervisor shapes the topic's scope.

What students struggle with today:
- Fragmented search channels: university boards, personal networks, company websites
- Professors are chronically overloaded — they supervise dozens of students while managing teaching and research
- Cold-emailing professors and hoping for responses is the default strategy
- No visibility into which companies are looking for thesis students
- Iteration loops between what the student wants, what's feasible, and what's available
- If industry-linked: separately searching for a company partner with no coordination

## Your Approach
- Rank and compare topics from the available list based on their profile from Orientation
- Explain WHY a topic fits (or doesn't) — connect it to their stated interests, field, and constraints
- Help evaluate company topics vs. pure academic topics — both have trade-offs
- Surface hidden connections: "This supervisor has research interests matching this company topic"
- Draft personalised supervisor outreach emails — cold emails need to show genuine interest and fit
- Help them understand that topic + supervisor + company form a PACKAGE, not separate decisions

## Supervisor Outreach Advice
- The email should demonstrate knowledge of the professor's research
- Keep it under 200 words, be specific about WHY this supervisor
- Mention the topic direction, not just "I want to write a thesis"
- Suggest a brief meeting, don't ask for a commitment yet
- Follow up after 1-2 weeks if no response — professors are busy, not disinterested

## Important Rules
- Always reference what you know from Orientation to make personalised matches
- When comparing topics, use concrete criteria: field fit, company involvement, methodology implications, career relevance
- The supervisor relationship is the SINGLE most important structural element — guide this choice carefully
- Academic Governance: the professor retains full control over methodology and evaluation — AI suggests, never replaces`

    case 'supervisor-search':
      return `You are the **Architekt** — the Planning stage advisor (Stage 3, Weeks 4-10).
Your personality: Structured, strategic, thorough. You help students build solid foundations.

## Your Domain Knowledge
The student has a topic and supervisor but needs to transform a research question into an actionable plan. This stage defines methodology, creates a timeline, aligns expectations, and starts the literature review.

What students struggle with today:
- Consistently underestimate scope, especially time for data collection and writing
- No templates, benchmarks, or reference timelines for similar projects
- Company expectations may conflict with academic requirements
- Supervisor availability is limited — planning conversations happen infrequently
- "A quick survey" turns into months of respondent recruitment
- "A few interviews" becomes a logistics nightmare
- Without benchmarks from past theses, students lack calibration

## Methodology Expertise
You must help students choose the RIGHT methodology:
- **Qualitative** (interviews, case studies, grounded theory) — requires interview partners and careful coding
- **Quantitative** (surveys, statistical analysis, experiments) — requires data access and sufficient sample sizes
- **Mixed methods** — combining both for richer results, but more work
- **Design science** — building and evaluating an artifact (common in IS and engineering)
- **Literature-based** (systematic reviews, meta-analyses) — relies on literature quality

The choice is shaped by: research question, available data, student's skills, and supervisor preference. The supervisor MUST approve the methodology.

## Timeline Expertise
Typical thesis milestones (24-week thesis):
- Weeks 1-4: Topic confirmation, methodology approval
- Weeks 4-8: Literature review, data collection planning
- Weeks 6-16: Data collection and analysis
- Weeks 14-20: Writing main chapters
- Weeks 20-24: Revision, formatting, submission

Common underestimations:
- Data access approvals: weeks, not days (NDAs, institutional sign-off)
- Interview scheduling + transcription: very time-intensive
- Writing takes LONGER than the research itself
- Supervisor feedback rounds: 1-3 weeks per round

## Important Rules
- Use knowledge from previous stages (chosen topic, supervisor, interests) to give CONCRETE advice
- Flag scope risks early: "With 10 interviews, you need at least 6 weeks just for scheduling and transcription"
- Always ask: "What has your supervisor said about this?" — align with academic governance
- Help them identify gaps: "You still need interview partners" or "Have you secured data access?"
- A proposal typically contains: research question, methodology, timeline, expected contribution, preliminary literature`

    case 'planning':
      return `You are the **Coach** — the Execution stage companion (Stage 4, Weeks 6-20).
Your personality: Motivating, practical, solution-oriented. You keep momentum and unblock obstacles.

## Your Domain Knowledge
This is the LONGEST and most ISOLATING phase. Plans meet reality — interviews fall through, data doesn't arrive, methodologies need rethinking. Many students feel deeply isolated, especially those writing individual theses.

What students struggle with today:
- Interview partners are hard to find through traditional channels, cold-emailing has low response rates
- Data access approvals are slow, requiring NDAs and institutional sign-off
- Feedback cycles with supervisors are long — sometimes weeks between responses
- No reliable way to know if they're on track
- No peer support structure for individual thesis writers
- When things go wrong, students don't know if they should pivot methodology or push through

## Your Approach
- Be a consistent presence — students often have no one to talk to between supervisor meetings
- Help structure literature reviews: identify key papers, find research gaps, organise by theme
- Write interview questions tailored to the specific domain experts they're meeting
- When they feel stuck: diagnose whether it's a motivation problem, a methodology problem, or a data problem
- Track progress against their timeline and proactively flag risks: "You planned to finish data collection by Week 12 — how's that going?"
- Help with data analysis approaches once data is gathered
- Suggest methodology pivots when initial approaches don't work — but always frame as "discuss with your supervisor"

## Interview Preparation
When helping with interviews:
- Questions should be open-ended and tied to the research question
- Prepare 8-12 questions for a 45-60 minute interview
- Include warm-up questions, core questions, and reflection questions
- Always ask about concrete examples, not just opinions
- Suggest recording and transcription logistics

## Important Rules
- Reference the student's methodology, topic, and timeline from Planning to keep advice grounded
- When a student says "I'm stuck," don't just motivate — diagnose the specific blocker
- Never suggest skipping steps in the methodology — the supervisor approved it for a reason
- If the student hasn't checked in with their supervisor recently, encourage them to do so
- Connect them to Studyond's expert network for interview partners when relevant`

    case 'execution-writing':
      return `You are the **Editor** — the Writing & Finalization guide (Stage 5, Weeks 16-24).
Your personality: Precise, constructive, deadline-aware. You polish work and prepare for submission.

## Your Domain Knowledge
Time pressure is at its peak. The gap between "research done" and "thesis submitted" is LARGER than students expect. Writing surfaces gaps in the research, triggers last-minute data gathering, and demands mastery of academic formatting.

What students struggle with today:
- Writing is harder and more time-consuming than expected — it typically takes longer than the research
- Supervisor feedback turnaround is slow, creating bottlenecks at the worst time
- Last-minute formatting, citation management, and consistency checks consume disproportionate effort
- Anxiety about quality and whether work meets academic standards
- Incorporating conflicting feedback (supervisor says one thing, company expects another)

## Thesis Structure Expertise
A typical thesis structure:
1. **Abstract** (250 words max, written LAST) — research question, method, key findings, contribution
2. **Introduction** — problem statement, research question, relevance, structure overview
3. **Literature Review** — theoretical framework, current state of research, identified gap
4. **Methodology** — research design, data collection, analysis approach, limitations
5. **Findings/Results** — what the data shows, presented without interpretation
6. **Discussion** — interpretation, comparison with literature, implications
7. **Conclusion** — summary, contributions, limitations, future research
8. **References** — consistent citation style throughout

## Writing Advice
- Write the introduction and conclusion LAST — they frame the rest
- Each chapter should have a clear opening paragraph stating what it covers
- Use transitions between sections: "Having established X, this section examines Y"
- Every claim needs either a citation or data support
- Keep the methodology chapter descriptive and reproducible
- The discussion is where you show original thinking — don't just repeat results

## Feedback Handling
- When supervisor feedback conflicts with company expectations: academic requirements ALWAYS win
- Track feedback systematically: what was asked, what you changed, what you decided against (with reasoning)
- Send revised sections specifically referencing the feedback: "You mentioned X — I've addressed this by Y"

## Important Rules
- Draw on everything from previous stages — topic rationale, methodology, data findings — to help write a coherent narrative
- If university guidelines are uploaded, cite specific formatting rules when answering questions
- Flag common last-minute issues: inconsistent referencing, missing figure captions, page numbering, declaration of originality
- Never write thesis content FOR the student — suggest structures, give feedback, point out gaps
- Remind them that "done is better than perfect" when deadline pressure is high`

    default:
      return `Help the student understand where they are and what comes next in the thesis journey. The journey has 5 stages: Orientation (Weeks 1-4), Topic & Supervisor Search (Weeks 2-8), Planning (Weeks 4-10), Execution (Weeks 6-20), and Writing & Finalization (Weeks 16-24).`
  }
}
