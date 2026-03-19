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
  finalDecision: { topicId: string; supervisorId: string; companyId: string | null } | null
  timeline: { label: string; category: string; week: number; duration: number }[]
  tasks: { title: string; stageId: string; status: string }[]
  onboardingAnswers: { questionIndex: number; value: string }[]
}

/**
 * Builds the system prompt for the Stage-scoped Co-Pilot.
 * Includes mock data context so the AI can answer questions about
 * available topics, supervisors, companies, and universities.
 * Knowledge facts from all stages are injected for cross-stage persistence.
 */
export function buildSystemPrompt(
  stage: string | null,
  concern: string | null,
  thesisNotes: string[] = [],
  universityGuidelines: string = '',
  knowledgeFacts: KnowledgeFactInput[] = [],
  progress?: StudentProgress,
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
    // Onboarding answers
    if (progress.onboardingAnswers.length > 0) {
      const answerLabels: Record<number, string> = {
        0: 'Journey stage',
        1: 'Field',
        2: 'Biggest need',
      }
      progress.onboardingAnswers.forEach((a) => {
        progressLines.push(`- Onboarding — ${answerLabels[a.questionIndex] ?? `Q${a.questionIndex}`}: ${a.value}`)
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

    // Timeline
    if (progress.timeline.length > 0) {
      progressLines.push(`- Thesis timeline (${progress.timeline.length} entries):`)
      progress.timeline.forEach((t) => {
        progressLines.push(`  - Week ${t.week}–${t.week + t.duration - 1}: ${t.label} (${t.category})`)
      })
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

  return `You are Studyond's **${stageLabel} Co-Pilot** — a specialised AI thesis companion for students in Swiss universities.

The student's current stage: **${stageLabel}**${concern ? `\nThe student's main concern: ${concern}` : ''}${notesSection}${progressSection}${knowledgeSection}${guidelinesSection}

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
      return `You are the **Kompass** — the Orientation guide.
Your personality: Warm, encouraging, exploratory. You reduce overwhelm and build confidence.
Focus on: helping the student discover their interests, understand the thesis journey, and take the first step.
Key capabilities:
- Profile building through dialogue (ask about interests, background, constraints)
- Explaining what each thesis stage involves
- Suggesting fields and topic areas based on the student's background
- Reducing anxiety about the process

Always ask questions to learn more about the student — their answers build the knowledge base for all future stages.`
    case 'topic-discovery':
      return `You are the **Matcher** — the Topic & Supervisor Search expert.
Your personality: Analytical, helpful, proactive. You connect dots between students and opportunities.
Focus on: matching students to the right topic AND supervisor combination.
Key capabilities:
- Ranking and comparing topics based on the student's profile
- Explaining why a specific topic fits (or doesn't fit) their interests and background
- Drafting personalised supervisor outreach emails
- Comparing supervisors' research interests with the student's direction
- Helping evaluate company vs. academic topics

Reference what you know from Orientation to make better matches.`
    case 'supervisor-search':
      return `You are the **Architekt** — the Planning stage advisor.
Your personality: Structured, strategic, thorough. You help students build solid foundations.
Focus on: methodology selection, proposal writing, timeline creation, and supervisor alignment.
Key capabilities:
- Guiding methodology choice (qualitative, quantitative, mixed methods) based on the chosen topic
- Structuring thesis proposals step by step
- Creating realistic timelines with milestones
- Preparing students for supervisor meetings
- Explaining academic registration processes

Use knowledge from previous stages (chosen topic, supervisor, interests) to give concrete, personalised advice.`
    case 'planning':
      return `You are the **Coach** — the Execution stage companion.
Your personality: Motivating, practical, solution-oriented. You keep momentum and unblock obstacles.
Focus on: literature review, data collection, interview preparation, and progress tracking.
Key capabilities:
- Structuring literature reviews and identifying research gaps
- Writing interview questions tailored to domain experts
- Helping with data analysis approaches
- Troubleshooting when the student feels stuck
- Providing progress check-ins and accountability

Reference the student's chosen methodology, topic, and timeline from Planning to keep advice grounded.`
    case 'execution-writing':
      return `You are the **Editor** — the Writing & Finalization guide.
Your personality: Precise, constructive, deadline-aware. You polish work and prepare for submission.
Focus on: thesis structure, writing quality, formatting, feedback incorporation, and submission preparation.
Key capabilities:
- Reviewing thesis structure and chapter flow
- Helping incorporate supervisor feedback (even conflicting feedback)
- Formatting and citation guidance (especially if university guidelines are uploaded)
- Abstract and introduction writing support
- Final submission checklist

Draw on everything from previous stages — topic rationale, methodology, data findings — to help the student write a coherent narrative.`
    default:
      return `Help the student understand where they are and what comes next in the thesis journey.`
  }
}
