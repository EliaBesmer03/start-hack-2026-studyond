/**
 * Feature: Final Decision
 * The student selects their final topic + supervisor + company combination
 * from their bookmarked topics, shortlisted supervisors, and saved matches.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, GraduationCap, Building2, Bookmark, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { topics, supervisors, companies, fieldName } from '@/data/mock'
import { useThesisStore } from '@/stores/thesis-store'
import type { FinalDecision as FinalDecisionType } from '@/stores/thesis-store'

export function FinalDecision() {
  const {
    favouriteTopicIds, shortlistedSupervisorIds, savedMatchIds,
    finalDecision, setFinalDecision, completeFeature,
  } = useThesisStore()

  const [selectedTopicId, setSelectedTopicId] = useState<string>(finalDecision?.topicId ?? '')
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(finalDecision?.supervisorId ?? '')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(finalDecision?.companyId ?? null)
  const [confirmed, setConfirmed] = useState(!!finalDecision)
  const [topicOpen, setTopicOpen] = useState(!finalDecision)
  const [supervisorOpen, setSupervisorOpen] = useState(!finalDecision)

  // Pre-fill from saved matches
  const savedMatchTopicIds = savedMatchIds.flatMap((id) => {
    if (id.startsWith('m')) {
      // base card
      return []
    }
    const parts = id.replace('combo-', '').replace('fav-', '').split('-')
    return [parts[0] + '-' + parts[1]] // reconstruct topic id
  })

  // Topics pool: favourites + topics from saved matches
  const topicPool = [...new Set([...favouriteTopicIds, ...savedMatchTopicIds])]
    .map((id) => topics.find((t) => t.id === id))
    .filter(Boolean) as typeof topics

  // If no bookmarks, show all topics
  const topicOptions = topicPool.length > 0 ? topicPool : topics.slice(0, 8)

  const supervisorOptions = shortlistedSupervisorIds.length > 0
    ? shortlistedSupervisorIds.map((id) => supervisors.find((s) => s.id === id)).filter(Boolean) as typeof supervisors
    : supervisors.slice(0, 6)

  const selectedTopic = topics.find((t) => t.id === selectedTopicId)
  const selectedSupervisor = supervisors.find((s) => s.id === selectedSupervisorId)
  const selectedCompany = selectedCompanyId ? companies.find((c) => c.id === selectedCompanyId) : null

  const companyOptions = selectedTopic?.companyId
    ? [companies.find((c) => c.id === selectedTopic.companyId)].filter(Boolean) as typeof companies
    : companies.slice(0, 4)

  const canConfirm = !!selectedTopicId && !!selectedSupervisorId

  const handleConfirm = () => {
    if (!canConfirm) return
    const decision: FinalDecisionType = {
      topicId: selectedTopicId,
      supervisorId: selectedSupervisorId,
      companyId: selectedCompanyId,
    }
    setFinalDecision(decision)
    completeFeature('final-decision')
    setConfirmed(true)
    setTopicOpen(false)
    setSupervisorOpen(false)
  }

  if (confirmed && finalDecision) {
    const topic = topics.find((t) => t.id === finalDecision.topicId)
    const supervisor = supervisors.find((s) => s.id === finalDecision.supervisorId)
    const company = finalDecision.companyId ? companies.find((c) => c.id === finalDecision.companyId) : null

    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="ds-title-md text-foreground">Final Decision</h2>
          <p className="ds-body mt-2 text-muted-foreground">Your thesis combination is confirmed. You're ready for the planning phase.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-foreground/20 bg-background"
        >
          <div className="flex items-center gap-3 border-b border-border bg-foreground px-5 py-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
              <Check className="size-4" strokeWidth={2.5} />
            </span>
            <div>
              <p className="ds-label text-background">Combination confirmed</p>
              <p className="ds-caption text-background/70">Your thesis journey is now locked in</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {/* Topic */}
            <div className="px-5 py-4">
              <p className="ds-caption mb-1 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <Sparkles className="size-3" />
                Topic
              </p>
              <p className="ds-title-sm text-foreground">{topic?.title}</p>
              {topic && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {topic.fieldIds.slice(0, 3).map((fid) => (
                    <span key={fid} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{fieldName(fid)}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Supervisor */}
            <div className="px-5 py-4">
              <p className="ds-caption mb-1 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                <GraduationCap className="size-3" />
                Supervisor
              </p>
              <p className="ds-label text-foreground">
                {supervisor?.title} {supervisor?.firstName} {supervisor?.lastName}
              </p>
              {supervisor && (
                <p className="ds-caption mt-0.5 text-muted-foreground">
                  {supervisor.researchInterests.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>

            {/* Company */}
            {company && (
              <div className="px-5 py-4">
                <p className="ds-caption mb-1 flex items-center gap-1.5 uppercase tracking-[0.14em] text-muted-foreground">
                  <Building2 className="size-3" />
                  Company
                </p>
                <p className="ds-label text-foreground">{company.name}</p>
                <p className="ds-caption mt-0.5 text-muted-foreground">
                  {company.domains.slice(0, 2).join(' · ')}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setConfirmed(false); setTopicOpen(true); setSupervisorOpen(true) }}
              className="ds-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              Change decision →
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="ds-title-md text-foreground">Final Decision</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Select your final topic, supervisor, and optional company combination.
          This locks in your direction before moving to the planning phase.
        </p>
        {(favouriteTopicIds.length > 0 || shortlistedSupervisorIds.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {favouriteTopicIds.length > 0 && (
              <span className="ds-caption flex items-center gap-1 rounded-full border border-foreground/30 px-2.5 py-1 text-foreground">
                <Bookmark className="size-3 fill-current" />
                {favouriteTopicIds.length} bookmarked topic{favouriteTopicIds.length !== 1 ? 's' : ''}
              </span>
            )}
            {shortlistedSupervisorIds.length > 0 && (
              <span className="ds-caption flex items-center gap-1 rounded-full border border-foreground/30 px-2.5 py-1 text-foreground">
                <GraduationCap className="size-3" />
                {shortlistedSupervisorIds.length} shortlisted supervisor{shortlistedSupervisorIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: Topic */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <button
            type="button"
            onClick={() => setTopicOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ds-badge font-semibold ${selectedTopicId ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground'}`}>
                {selectedTopicId ? <Check className="size-3" strokeWidth={2.5} /> : '1'}
              </span>
              <div className="text-left">
                <p className="ds-label text-foreground">Choose Topic</p>
                {selectedTopic && (
                  <p className="ds-caption text-muted-foreground line-clamp-1">{selectedTopic.title}</p>
                )}
              </div>
            </div>
            {topicOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {topicOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="divide-y divide-border">
                  {topicOptions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setSelectedTopicId(t.id); setSelectedCompanyId(t.companyId ?? null); setTopicOpen(false) }}
                      className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/40 ${selectedTopicId === t.id ? 'bg-secondary' : ''}`}
                    >
                      <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedTopicId === t.id ? 'border-foreground bg-foreground text-background' : 'border-border'}`}>
                        {selectedTopicId === t.id && <Check className="size-2.5" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="ds-label text-foreground leading-snug">{t.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.fieldIds.slice(0, 2).map((fid) => (
                            <span key={fid} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{fieldName(fid)}</span>
                          ))}
                          {favouriteTopicIds.includes(t.id) && (
                            <span className="ds-caption flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                              <Bookmark className="size-2.5 fill-current" />
                              Bookmarked
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: Supervisor */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <button
            type="button"
            onClick={() => setSupervisorOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ds-badge font-semibold ${selectedSupervisorId ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground'}`}>
                {selectedSupervisorId ? <Check className="size-3" strokeWidth={2.5} /> : '2'}
              </span>
              <div className="text-left">
                <p className="ds-label text-foreground">Choose Supervisor</p>
                {selectedSupervisor && (
                  <p className="ds-caption text-muted-foreground">
                    {selectedSupervisor.title} {selectedSupervisor.firstName} {selectedSupervisor.lastName}
                  </p>
                )}
              </div>
            </div>
            {supervisorOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {supervisorOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="divide-y divide-border">
                  {supervisorOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedSupervisorId(s.id); setSupervisorOpen(false) }}
                      className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/40 ${selectedSupervisorId === s.id ? 'bg-secondary' : ''}`}
                    >
                      <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedSupervisorId === s.id ? 'border-foreground bg-foreground text-background' : 'border-border'}`}>
                        {selectedSupervisorId === s.id && <Check className="size-2.5" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0">
                        <p className="ds-label text-foreground">{s.title} {s.firstName} {s.lastName}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.researchInterests.slice(0, 2).map((r, i) => (
                            <span key={i} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{r}</span>
                          ))}
                          {shortlistedSupervisorIds.includes(s.id) && (
                            <span className="ds-caption flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                              <Bookmark className="size-2.5 fill-current" />
                              Shortlisted
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 3: Company (optional) */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ds-badge font-semibold ${selectedCompanyId ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground'}`}>
                {selectedCompanyId ? <Check className="size-3" strokeWidth={2.5} /> : '3'}
              </span>
              <div>
                <p className="ds-label text-foreground">Company <span className="ds-caption text-muted-foreground font-normal">(optional)</span></p>
                {selectedCompany && (
                  <p className="ds-caption text-muted-foreground">{selectedCompany.name}</p>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border">
            <div className="divide-y divide-border">
              <button
                type="button"
                onClick={() => setSelectedCompanyId(null)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/40 ${!selectedCompanyId ? 'bg-secondary' : ''}`}
              >
                <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${!selectedCompanyId ? 'border-foreground bg-foreground text-background' : 'border-border'}`}>
                  {!selectedCompanyId && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <p className="ds-label text-muted-foreground">Academic only — no company partner</p>
              </button>
              {companyOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/40 ${selectedCompanyId === c.id ? 'bg-secondary' : ''}`}
                >
                  <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedCompanyId === c.id ? 'border-foreground bg-foreground text-background' : 'border-border'}`}>
                    {selectedCompanyId === c.id && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <div>
                    <p className="ds-label text-foreground">{c.name}</p>
                    <p className="ds-caption text-muted-foreground">{c.domains.slice(0, 2).join(' · ')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-4 ds-label text-background transition-colors hover:bg-foreground/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="size-4" />
          Confirm my decision
        </button>
      </div>
    </div>
  )
}
