/**
 * Typed mock data — imported from the repo-level mock-data folder via Vite alias.
 * All types are inlined here to avoid coupling to the reference types.ts.
 */

// ── Types ────────────────────────────────────────────────────────────

export type Degree = 'bsc' | 'msc' | 'phd'
export type TopicEmployment = 'yes' | 'no' | 'open'
export type TopicEmploymentType = 'internship' | 'working_student' | 'graduate_program' | 'direct_entry'
export type TopicWorkplaceType = 'on_site' | 'hybrid' | 'remote'
export type TopicType = 'topic' | 'job'
export type ProjectState = 'proposed' | 'applied' | 'withdrawn' | 'rejected' | 'agreed' | 'in_progress' | 'canceled' | 'completed'
export type StudentObjective = 'topic' | 'supervision' | 'career_start' | 'industry_access' | 'project_guidance'
export type ExpertObjective = 'recruiting' | 'fresh_insights' | 'research_collaboration' | 'education_collaboration' | 'brand_visibility'
export type SupervisorObjective = 'student_matching' | 'research_collaboration' | 'network_expansion' | 'funding_access' | 'project_management'

export interface Field { id: string; name: string }
export interface University { id: string; name: string; country: string; domains: string[]; about: string | null }
export interface StudyProgram { id: string; name: string; degree: Degree; universityId: string; about: string | null }

export interface Student {
  id: string; firstName: string; lastName: string; email: string
  degree: Degree; studyProgramId: string; universityId: string
  skills: string[]; about: string | null
  objectives: StudentObjective[]; fieldIds: string[]
}

export interface Supervisor {
  id: string; firstName: string; lastName: string; email: string
  title: string; universityId: string
  researchInterests: string[]; about: string | null
  objectives: SupervisorObjective[]; fieldIds: string[]
}

export interface Company {
  id: string; name: string; description: string; about: string | null
  size: string; domains: string[]
}

export interface Expert {
  id: string; firstName: string; lastName: string; email: string
  title: string; companyId: string; offerInterviews: boolean
  about: string | null; objectives: ExpertObjective[]; fieldIds: string[]
}

export interface Topic {
  id: string; title: string; description: string
  type: TopicType; employment: TopicEmployment
  employmentType: TopicEmploymentType | null; workplaceType: TopicWorkplaceType | null
  degrees: Degree[]; fieldIds: string[]
  companyId: string | null; universityId: string | null
  supervisorIds: string[]; expertIds: string[]
}

export interface ThesisProject {
  id: string; title: string; description: string | null; motivation: string | null
  state: ProjectState; studentId: string; topicId: string | null
  companyId: string | null; universityId: string | null
  supervisorIds: string[]; expertIds: string[]
  createdAt: string; updatedAt: string
}

// ── Raw JSON imports ─────────────────────────────────────────────────

import _students from '../../../mock-data/students.json'
import _supervisors from '../../../mock-data/supervisors.json'
import _companies from '../../../mock-data/companies.json'
import _experts from '../../../mock-data/experts.json'
import _topics from '../../../mock-data/topics.json'
import _projects from '../../../mock-data/projects.json'
import _fields from '../../../mock-data/fields.json'

export const students = _students as Student[]
export const supervisors = _supervisors as Supervisor[]
export const companies = _companies as Company[]
export const experts = _experts as Expert[]
export const topics = _topics as Topic[]
export const projects = _projects as ThesisProject[]
export const fields = _fields as Field[]

// ── Lookup helpers ───────────────────────────────────────────────────

export const byId = <T extends { id: string }>(arr: T[], id: string) =>
  arr.find((x) => x.id === id)

export const fieldName = (id: string) => byId(fields, id)?.name ?? id
export const companyName = (id: string) => byId(companies, id)?.name ?? id
