/**
 * Feature: Literature Search
 * Search the SLSP swisscovery catalog for academic literature.
 * Students can search, browse results, bookmark sources, and ask Co-Pilot about them.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bookmark, CheckCircle2, Loader2, BookOpen,
  User, Calendar, Building2, X, Sparkles, AlertCircle, RotateCcw, Tag,
} from 'lucide-react'
import { searchSLSP, type SLSPRecord } from '@/lib/slsp'
import { useThesisStore } from '@/stores/thesis-store'
import { topics, type Topic } from '@/data/mock'

interface LiteratureSearchProps {
  onOpenCoPilot: (prompt?: string) => void
}

// ── Detail drawer ────────────────────────────────────────────────────

function DetailDrawer({
  record,
  isSaved,
  onToggleSave,
  onAsk,
  onClose,
}: {
  record: SLSPRecord
  isSaved: boolean
  onToggleSave: (record: SLSPRecord) => void
  onAsk: (record: SLSPRecord) => void
  onClose: () => void
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="size-4 text-foreground" />
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Subjects */}
          {record.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {record.subjects.map((s, i) => (
                <span key={i} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground flex items-center gap-1">
                  <Tag className="size-2.5" />{s}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="ds-title-sm text-foreground leading-snug">{record.title}</h2>

          {/* Meta */}
          <div className="flex flex-col gap-2">
            {record.authors.length > 0 && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="ds-body text-foreground">{record.authors.join(', ')}</p>
              </div>
            )}
            {record.year && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="ds-body text-foreground">{record.year}</p>
              </div>
            )}
            {record.publisher && (
              <div className="flex items-center gap-2">
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="ds-body text-foreground">{record.publisher}</p>
              </div>
            )}
            {record.isbn && (
              <p className="ds-caption text-muted-foreground/60">ISBN {record.isbn}</p>
            )}
          </div>

          {/* Abstract */}
          {record.abstract && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="ds-caption font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Abstract</p>
              <p className="ds-body text-foreground leading-relaxed">{record.abstract}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => onAsk(record)}
              className="flex items-center justify-center gap-2 rounded-full bg-ai px-4 py-3 ds-label text-background transition-all hover:opacity-90"
            >
              <Sparkles className="size-4" />
              Ask Co-Pilot about this source
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(record)}
              className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 ds-label transition-colors ${
                isSaved
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <Bookmark className={`size-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Remove from saved' : 'Save source'}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

// ── Result card ──────────────────────────────────────────────────────

function ResultCard({
  record,
  isSaved,
  onToggleSave,
  onAsk,
  onOpen,
}: {
  record: SLSPRecord
  isSaved: boolean
  onToggleSave: (record: SLSPRecord) => void
  onAsk: (record: SLSPRecord) => void
  onOpen: (record: SLSPRecord) => void
}) {
  return (
    <div
      onClick={() => onOpen(record)}
      className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-background p-4 transition-all duration-150 ${
        isSaved ? 'border-foreground/30' : 'border-border hover:border-foreground/20 hover:shadow-sm'
      }`}
    >
      {/* Subjects as tags */}
      {record.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {record.subjects.slice(0, 4).map((s, i) => (
            <span key={i} className="ds-caption rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="ds-label text-foreground leading-snug">{record.title}</h3>

      {/* Abstract (if available) */}
      {record.abstract && (
        <p className="ds-small text-muted-foreground line-clamp-3 leading-relaxed">{record.abstract}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        {record.authors.length > 0 && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <User className="size-3" />
            {record.authors.slice(0, 2).join(', ')}
            {record.authors.length > 2 ? ` +${record.authors.length - 2}` : ''}
          </span>
        )}
        {record.year && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3" />
            {record.year}
          </span>
        )}
        {record.publisher && (
          <span className="ds-caption flex items-center gap-1 text-muted-foreground">
            <Building2 className="size-3" />
            {record.publisher}
          </span>
        )}
        {record.isbn && (
          <span className="ds-caption text-muted-foreground/60">
            ISBN {record.isbn}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSave(record) }}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ds-caption font-medium transition-colors ${
            isSaved
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          }`}
        >
          <Bookmark className={`size-3 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAsk(record) }}
          className="flex items-center gap-1.5 rounded-full bg-ai px-3 py-1.5 ds-caption font-medium text-background transition-all hover:opacity-90"
        >
          <Sparkles className="size-3" />
          Ask Co-Pilot
        </button>
      </div>
    </div>
  )
}

// ── Saved literature drawer ──────────────────────────────────────────

function SavedDrawer({
  onClose,
  onAsk,
}: {
  onClose: () => void
  onAsk: (record: SLSPRecord) => void
}) {
  const { savedLiterature, removeLiterature } = useThesisStore()

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="ds-title-sm text-foreground">Saved Sources</h2>
            <p className="ds-caption text-muted-foreground mt-0.5">{savedLiterature.length} source{savedLiterature.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {savedLiterature.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <BookOpen className="mx-auto mb-2 size-6 text-muted-foreground/30" />
              <p className="ds-small text-muted-foreground/60">No sources saved yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedLiterature.map((rec) => (
                <div key={rec.id} className="group rounded-xl border border-border bg-background p-4">
                  <h3 className="ds-label text-foreground leading-snug">{rec.title}</h3>
                  <p className="ds-caption mt-1 text-muted-foreground">
                    {rec.authors.slice(0, 3).join(', ')}{rec.year ? ` (${rec.year})` : ''}
                  </p>
                  {rec.publisher && (
                    <p className="ds-caption mt-0.5 text-muted-foreground/60">{rec.publisher}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAsk(rec)}
                      className="flex items-center gap-1.5 rounded-full bg-ai px-3 py-1.5 ds-caption font-medium text-background transition-all hover:opacity-90"
                    >
                      <Sparkles className="size-3" />
                      Ask Co-Pilot
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLiterature(rec.id)}
                      className="ds-caption rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────

export function LiteratureSearch({ onOpenCoPilot }: LiteratureSearchProps) {
  const {
    completeFeature, uncompleteFeature, tasks, savedLiterature, addLiterature, removeLiterature,
    finalDecision, favouriteTopicIds,
  } = useThesisStore()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SLSPRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openRecord, setOpenRecord] = useState<SLSPRecord | null>(null)

  const isDone = tasks.some((t) => t.featureId === 'copilot-literature' && t.status === 'done')

  // Generate search suggestions from student's actual topic choices
  const suggestions = (() => {
    const items: string[] = []
    const seen = new Set<string>()

    const addUnique = (label: string) => {
      const key = label.toLowerCase()
      if (!seen.has(key)) { seen.add(key); items.push(label) }
    }

    // From final decision topic
    if (finalDecision?.topicId) {
      const topic = topics.find((t: Topic) => t.id === finalDecision.topicId)
      if (topic) addUnique(topic.title)
    }

    // From favourite/bookmarked topics
    for (const id of favouriteTopicIds) {
      const topic = topics.find((t: Topic) => t.id === id)
      if (topic) addUnique(topic.title)
    }

    // Fill up with generic fallbacks if student hasn't chosen topics yet
    if (items.length < 3) {
      addUnique('Sustainable supply chain management')
      addUnique('Machine learning applications')
      addUnique('Digital transformation SME')
    }

    return items.slice(0, 4)
  })()

  const doSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const data = await searchSLSP(trimmed, 20)
      setResults(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed'
      setError(msg)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    doSearch(suggestion)
  }

  const handleToggleSave = (record: SLSPRecord) => {
    if (savedLiterature.some((r) => r.id === record.id)) {
      removeLiterature(record.id)
    } else {
      addLiterature(record)
    }
  }

  const handleAsk = (record: SLSPRecord) => {
    const authorsStr = record.authors.length > 0
      ? ` by ${record.authors.slice(0, 2).join(' and ')}`
      : ''
    const yearStr = record.year ? ` (${record.year})` : ''
    const prompt = `I found this source in the library catalog: "${record.title}"${authorsStr}${yearStr}. ${record.abstract ? `The abstract says: "${record.abstract.slice(0, 200)}..."` : ''} How relevant is this for my thesis? What key insights should I look for when reading it?`
    onOpenCoPilot(prompt)
  }

  const isSaved = (id: string) => savedLiterature.some((r) => r.id === id)

  return (
    <div className="mx-auto w-full ds-layout-narrow">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-ai">
          <BookOpen className="size-5 text-background" />
        </div>
        <h2 className="ds-title-md text-foreground">Literature Search</h2>
        <p className="ds-body mt-2 text-muted-foreground">
          Search the Swiss academic library catalog (swisscovery) for books, papers, and theses relevant to your research. Save sources and discuss them with your Co-Pilot.
        </p>
      </div>

      {/* Mark as done + saved counter */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="ds-small text-muted-foreground">
            Found enough sources? Mark this step as complete.
          </p>
          {savedLiterature.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ds-caption flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <Bookmark className="size-3 fill-current" />
              {savedLiterature.length} saved
            </button>
          )}
        </div>
        {isDone ? (
          <div className="flex items-center gap-2">
            <span className="ds-caption flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-background">
              <CheckCircle2 className="size-3.5" />
              Done
            </span>
            <button
              type="button"
              onClick={() => uncompleteFeature('copilot-literature')}
              className="ds-caption flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => completeFeature('copilot-literature')}
            className="ds-caption flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/30 px-3 py-1.5 text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <CheckCircle2 className="size-3.5" />
            Mark as done
          </button>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, papers, theses in Swiss libraries..."
            className="ds-body w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-24 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-foreground px-3 py-1.5 ds-caption font-medium text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Search suggestions (shown before first search) */}
      {!searched && (
        <div className="mb-6">
          <p className="ds-caption mb-2.5 text-muted-foreground">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="ds-caption rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-all hover:border-foreground/30 hover:bg-secondary hover:text-foreground"
              >
                <Tag className="mr-1 inline size-3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ds-body ml-2 text-muted-foreground">Searching swisscovery...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="ds-label text-destructive">Search failed</p>
            <p className="ds-caption mt-0.5 text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="mx-auto mb-2 size-6 text-muted-foreground/30" />
          <p className="ds-small text-muted-foreground/60">No results found. Try different keywords.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="ds-caption mb-3 text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} from swisscovery
          </p>
          <div className="grid-2-col">
            {results.map((rec) => (
              <ResultCard
                key={rec.id}
                record={rec}
                isSaved={isSaved(rec.id)}
                onToggleSave={handleToggleSave}
                onAsk={handleAsk}
                onOpen={setOpenRecord}
              />
            ))}
          </div>
        </>
      )}

      {/* Saved sources drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <SavedDrawer
            onClose={() => setDrawerOpen(false)}
            onAsk={(rec) => { setDrawerOpen(false); handleAsk(rec) }}
          />
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {openRecord && (
          <DetailDrawer
            record={openRecord}
            isSaved={isSaved(openRecord.id)}
            onToggleSave={handleToggleSave}
            onAsk={(rec) => { setOpenRecord(null); handleAsk(rec) }}
            onClose={() => setOpenRecord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
