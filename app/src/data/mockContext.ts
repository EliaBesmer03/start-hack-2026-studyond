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

/**
 * Builds the system prompt for the Stage-scoped Co-Pilot.
 * Includes mock data context so the AI can answer questions about
 * available topics, supervisors, companies, and universities.
 */
export function buildSystemPrompt(
  stage: string | null,
  concern: string | null,
  thesisNotes: string[] = [],
  universityGuidelines: string = '',
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

  return `You are Studyond's Stage-scoped Co-Pilot — a calm, direct AI thesis companion for students in Swiss universities.

The student's current stage: **${stageLabel}**${concern ? `\nThe student's main concern: ${concern}` : ''}${notesSection}${guidelinesSection}

Your role:
- Help students navigate their thesis journey with concrete, actionable advice
- Never make academic decisions for them — frame suggestions as options for them and their supervisor to agree on
- Be concise and warm; avoid jargon
- When students ask about topics, supervisors, or companies, use the data below to give specific, relevant answers
- When university requirements are provided, answer formatting and submission questions directly from those requirements

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

function stageGuidance(stage: string | null): string {
  switch (stage) {
    case 'orientation':
      return `Focus on: topic exploration, reducing anxiety, understanding the journey.
Example prompts: "What fields match my background?", "How long does this actually take?", "What should I do first?"`
    case 'topic-discovery':
      return `Focus on: matching students to topics, explaining why a topic fits, drafting supervisor outreach emails.
Example prompts: "Why does this topic fit me?", "Help me write a cold email to this professor", "Which company topics are best for CS students?"`
    case 'supervisor-search':
      return `Focus on: methodology guidance, proposal structure, milestone planning.
Example prompts: "Should I use qualitative or quantitative methods?", "What goes in a thesis proposal?", "How do I negotiate deadlines with my supervisor?"`
    case 'planning':
      return `Focus on: interview prep, data collection questions, literature review help, progress check-ins.
Example prompts: "Help me write interview questions for a logistics expert", "I'm stuck on my literature review", "How do I structure my data analysis?"`
    case 'execution-writing':
      return `Focus on: structure feedback, formatting rules, deadline tracking, submission prep.
Example prompts: "Is my introduction too broad?", "How do I incorporate conflicting supervisor feedback?", "What are typical formatting requirements?"`
    default:
      return `Help the student understand where they are and what comes next in the thesis journey.`
  }
}
