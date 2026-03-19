/**
 * SLSP (Swiss Library Service Platform) SRU search service.
 * Queries swisscovery via SRU 1.2 and parses MARC21/XML responses.
 */

export interface SLSPRecord {
  id: string
  title: string
  authors: string[]
  year: string
  publisher: string
  isbn: string
  language: string
  subjects: string[]
  abstract: string
}

const SRU_BASE = '/api/slsp/view/sru/41SLSP_NETWORK'

// Common English/German stop words to remove from keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'on', 'to', 'with',
  'by', 'at', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'its', 'it', 'this', 'that', 'their', 'your', 'our', 'my',
  'how', 'what', 'which', 'who', 'where', 'when', 'why',
  'not', 'but', 'so', 'if', 'than', 'too', 'very',
  'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'für', 'von',
  'im', 'in', 'auf', 'an', 'mit', 'zu', 'nach', 'bei', 'über',
])

/**
 * Extract meaningful keywords from a query string.
 * Splits on spaces/hyphens/punctuation, removes stop words and short tokens.
 */
function extractKeywords(query: string): string[] {
  return query
    .replace(/[-–—/]/g, ' ')          // split hyphenated words
    .replace(/[^\w\sÀ-ÿ]/g, '')      // remove punctuation
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    // deduplicate
    .filter((w, i, arr) => arr.indexOf(w) === i)
}

/**
 * Build a CQL query that searches keywords across title AND subject fields.
 * Strategy: combine keywords with AND for precision,
 * but search each keyword across multiple fields with OR.
 */
function buildCQLQuery(keywords: string[]): string {
  if (keywords.length === 0) return ''

  // Each keyword: search in title OR subject OR all
  // CQL is NOT URL-encoded here — encoding happens in executeSRUQuery
  const clauses = keywords.map((kw) =>
    `(alma.title="${kw}" OR alma.subjects="${kw}" OR alma.all_for_ui="${kw}")`,
  )

  // Combine with AND — all keywords must match somewhere
  return clauses.join(' AND ')
}

/**
 * Execute a single SRU query and return parsed records.
 */
async function executeSRUQuery(cql: string, maxRecords: number): Promise<SLSPRecord[]> {
  // Encode the entire CQL query as one value
  const url = `${SRU_BASE}?version=1.2&operation=searchRetrieve&recordSchema=marcxml&query=${encodeURIComponent(cql)}&maximumRecords=${maxRecords}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`SLSP SRU error: ${res.status}`)
  }

  const xml = await res.text()
  return parseSRUResponse(xml)
}

/**
 * Build adjacent keyword pairs (bigrams) from the original word order.
 * E.g. ["demand", "forecasting", "perishable", "goods"] →
 *      ["demand forecasting", "forecasting perishable", "perishable goods"]
 */
function extractBigrams(query: string): string[] {
  const words = query
    .replace(/[-–—/]/g, ' ')
    .replace(/[^\w\sÀ-ÿ]/g, '')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))

  const bigrams: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`)
  }
  return bigrams
}

/**
 * Score how relevant a record is to the original search keywords.
 * Checks title, subjects, and abstract for keyword matches.
 * Returns a number ≥ 0 (higher = more relevant).
 */
function scoreRecord(record: SLSPRecord, keywords: string[]): { score: number; matchedKeywords: number } {
  const titleLower = record.title.toLowerCase()
  const subjectsLower = record.subjects.join(' ').toLowerCase()
  const abstractLower = record.abstract.toLowerCase()

  let score = 0
  let matchedKeywords = 0

  for (const kw of keywords) {
    let matched = false
    // Title matches are most valuable
    if (titleLower.includes(kw)) { score += 3; matched = true }
    // Subject matches are very valuable
    if (subjectsLower.includes(kw)) { score += 2; matched = true }
    // Abstract matches
    if (abstractLower.includes(kw)) { score += 1.5; matched = true }

    if (matched) matchedKeywords++
  }

  return { score, matchedKeywords }
}

/**
 * Search the SLSP swisscovery catalog via SRU.
 * Uses a multi-strategy approach:
 * 1. Bigram phrase searches (e.g. "demand forecasting") for high precision
 * 2. Cascading AND keyword searches (3→2→1 keywords)
 * 3. Results are scored by relevance and deduplicated
 *
 * @param query  Free-text search query (can be a full thesis title)
 * @param maxRecords  Maximum number of results (default 20)
 */
export async function searchSLSP(
  query: string,
  maxRecords = 20,
): Promise<SLSPRecord[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const keywords = extractKeywords(trimmed)

  if (keywords.length === 0) {
    // Fallback: use original query as-is
    const cql = `alma.all_for_ui="${trimmed}"`
    return executeSRUQuery(cql, maxRecords)
  }

  // Sort keywords by length (longest = most specific/meaningful)
  const sorted = [...keywords].sort((a, b) => b.length - a.length)

  // Build search strategies — ordered from most precise to broadest
  const cqlQueries: string[] = []

  // Strategy 1: Bigram phrase searches (highest precision)
  const bigrams = extractBigrams(trimmed)
  for (const bigram of bigrams) {
    cqlQueries.push(`alma.title="${bigram}" OR alma.subjects="${bigram}" OR alma.all_for_ui="${bigram}"`)
  }

  // Strategy 2: Cascading AND keyword searches
  const attempts = [
    sorted.slice(0, Math.min(4, sorted.length)),   // top 4 keywords AND'd
    sorted.slice(0, Math.min(3, sorted.length)),   // top 3 keywords AND'd
    sorted.slice(0, Math.min(2, sorted.length)),   // top 2 keywords AND'd
  ]
  // Deduplicate
  const seen = new Set<string>()
  for (const kws of attempts) {
    const cql = buildCQLQuery(kws)
    if (!seen.has(cql)) {
      seen.add(cql)
      cqlQueries.push(cql)
    }
  }

  // Strategy 3: Single best keyword (broadest, only used if needed)
  const singleKwCql = buildCQLQuery(sorted.slice(0, 1))

  // Execute queries and collect results
  const allResults: SLSPRecord[] = []
  const seenIds = new Set<string>()

  // Fetch from precise → broad strategies
  for (const cql of cqlQueries) {
    const results = await executeSRUQuery(cql, maxRecords)
    for (const rec of results) {
      if (!seenIds.has(rec.id)) {
        seenIds.add(rec.id)
        allResults.push(rec)
      }
    }
    // Stop early once we have plenty to score from
    if (allResults.length >= maxRecords * 2) break
  }

  // If still too few, try single keyword fallback
  if (allResults.length < maxRecords && !seen.has(singleKwCql)) {
    const results = await executeSRUQuery(singleKwCql, maxRecords)
    for (const rec of results) {
      if (!seenIds.has(rec.id)) {
        seenIds.add(rec.id)
        allResults.push(rec)
      }
    }
  }

  // Score and sort by relevance
  const scored = allResults.map((rec) => {
    const { score, matchedKeywords } = scoreRecord(rec, keywords)
    return { rec, score, matchedKeywords }
  })

  // Filter out irrelevant results:
  // For multi-keyword queries, require either:
  //   - 3+ distinct keyword matches, OR
  //   - 2+ matches with a high score (meaning title/subject matches, not just abstract)
  const filtered = scored.filter((s) => {
    if (keywords.length < 3) return s.matchedKeywords >= 1
    if (s.matchedKeywords >= 3) return true
    if (s.matchedKeywords >= 2 && s.score >= 5) return true
    return false
  })

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score)

  return filtered.slice(0, maxRecords).map((s) => s.rec)
}

/**
 * Parse SRU XML response containing MARC21 records.
 */
function parseSRUResponse(xml: string): SLSPRecord[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')

  // SRU wraps records in <record> elements within <records>
  const recordElements = doc.querySelectorAll('record recordData record')

  // Fallback: try different selectors depending on namespace handling
  const records: Element[] = recordElements.length > 0
    ? Array.from(recordElements)
    : Array.from(doc.querySelectorAll('recordData'))

  return records.map((rec) => parseMARC21Record(rec)).filter((r) => r.title)
}

/**
 * Extract fields from a single MARC21 record element.
 *
 * Key MARC21 fields:
 * - 001: Control number (ID)
 * - 100$a / 700$a: Authors
 * - 245$a + 245$b: Title + subtitle
 * - 260$b / 264$b: Publisher
 * - 260$c / 264$c: Year
 * - 020$a: ISBN
 * - 520$a: Abstract/summary
 * - 650$a: Subject headings
 * - 008 pos 35-37: Language code
 */
function parseMARC21Record(recordEl: Element): SLSPRecord {
  const getControlField = (tag: string): string => {
    // Try with namespace-aware and simple selectors
    const el =
      recordEl.querySelector(`controlfield[tag="${tag}"]`) ??
      recordEl.querySelector(`*|controlfield[tag="${tag}"]`)
    return el?.textContent?.trim() ?? ''
  }

  const getSubfields = (tag: string, code: string): string[] => {
    const datafields = recordEl.querySelectorAll(`datafield[tag="${tag}"]`)
    const results: string[] = []
    datafields.forEach((df) => {
      df.querySelectorAll(`subfield[code="${code}"]`).forEach((sf) => {
        const text = sf.textContent?.trim()
        if (text) results.push(text)
      })
    })
    return results
  }

  const getSubfield = (tag: string, code: string): string =>
    getSubfields(tag, code)[0] ?? ''

  // ID
  const id = getControlField('001') || crypto.randomUUID()

  // Title: 245$a + 245$b (subtitle)
  const titleMain = getSubfield('245', 'a').replace(/[\s/:;,]+$/, '')
  const titleSub = getSubfield('245', 'b').replace(/[\s/:;,]+$/, '')
  const title = titleSub ? `${titleMain}: ${titleSub}` : titleMain

  // Authors: 100$a (main) + 700$a (additional)
  const mainAuthor = getSubfield('100', 'a').replace(/[,]+$/, '')
  const additionalAuthors = getSubfields('700', 'a').map((a) => a.replace(/[,]+$/, ''))
  const authors = mainAuthor
    ? [mainAuthor, ...additionalAuthors]
    : additionalAuthors

  // Year: 260$c or 264$c
  const yearRaw = getSubfield('260', 'c') || getSubfield('264', 'c')
  const yearMatch = yearRaw.match(/(\d{4})/)
  const year = yearMatch?.[1] ?? ''

  // Publisher: 260$b or 264$b
  const publisher = (getSubfield('260', 'b') || getSubfield('264', 'b')).replace(/[,;]+$/, '')

  // ISBN: 020$a
  const isbn = getSubfield('020', 'a').split(' ')[0] ?? ''

  // Language: from 008 field, positions 35-37
  const field008 = getControlField('008')
  const language = field008.length >= 38 ? field008.slice(35, 38) : ''

  // Subjects: 650$a
  const subjects = getSubfields('650', 'a').map((s) => s.replace(/[.]+$/, ''))

  // Abstract: 520$a
  const abstract = getSubfield('520', 'a')

  return { id, title, authors, year, publisher, isbn, language, subjects, abstract }
}
