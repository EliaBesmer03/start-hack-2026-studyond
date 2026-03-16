# Brand: Voice, Tone, and Design Language

## Voice and Tone

Studyond speaks differently to each audience while maintaining a consistent brand personality.

### Students
**Core tone:** Warm, supportive, peer-like. Use "du" form in German.

- Use "you" language; speak directly to the student
- Avoid corporate jargon (no "synergy," "leverage," "optimize")
- Acknowledge the stress of thesis writing -- validate it
- Use active verbs ("find," "explore," "match") not passive ("be matched")
- Short, clear sentences; concrete over abstract
- Never condescending or overly promotional
- Emphasize student agency: they're in control

**Do:** "Real topics from companies building in your field. Match with a topic in 20 minutes. Free, no strings."

**Don't:** "Leverage our synergistic platform to optimize your thesis outcome pipeline."

### Companies
**Core tone:** Professional, outcome-driven, ROI-focused.

- Use business language; assume familiarity with talent and strategy terms
- Quantify where possible (cost per candidate, time-to-hire)
- Lead with outcomes, not features ("500 qualified proposals" not "matching platform")
- Concise; respect their time
- Professional but not stiff

**Do:** "Source qualified talent through live thesis projects. Average cost per candidate: 60% less than traditional recruiting."

**Don't:** "Our easy-to-use platform helps you find students! Sign up and we'll take care of everything."

### Universities
**Core tone:** Formal but accessible, institutional, governance-aware.

- Use institutional language (governance, accreditation, academic integrity)
- Focus on alignment with university values
- Respect academic autonomy; position as enabling, not controlling
- Emphasize partnership, not vendor-customer dynamic

**Do:** "Strengthen curriculum relevance through structured industry partnerships. Academic control remains with faculty."

**Don't:** "Sign up now and start connecting your students with companies! It's super easy!"

### Cross-Audience Pattern: "Missing Out" Narrative
Frame the status quo cost before presenting the solution. Use sparingly (1-2 per page). Always pair with positive resolution. Never fear-monger.

- Students: "What if I pick the wrong topic?" → "Here are real topics matched to your field."
- Companies: "By the time you interview, competitors have already engaged." → "Connect with students during their thesis -- 6 months before they hit the job market."
- Universities: "Accreditation asks for industry linkage data, but we have no real data." → "Every interaction is tracked automatically."

---

## Design Language

### Brand Personality
- **Approachable** -- rounded corners, warm tones, gentle spacing
- **Editorial** -- serif headlines, typographic hierarchy inspired by magazines
- **Minimal** -- black/white/gray foundation, color used sparingly for meaning
- **Professional** -- clean lines, generous whitespace, no visual clutter

### Design Principles
1. **Content first** -- UI fades into the background; typography and images carry the page
2. **Quiet confidence** -- no flashy gradients or neon accents. Authority from restraint
3. **Functional color** -- color means something (type badges, status). Never decorative
4. **Consistent rhythm** -- same spacing and grid cadence across pages
5. **Progressive disclosure** -- subtle hover states reveal more; nothing screams for attention

### Color System
Monochrome by default with semantic accents. Built on OKLCH color space.

- **Light mode:** White backgrounds, near-black text, light gray secondary elements
- **Dark mode:** Automatic inversion via design tokens
- **Accent:** Warm yellow text selection (light), muted gold (dark)
- **No decorative color** -- only for badges, status indicators, and entity types

### Typography

| Role | Font | Use |
|---|---|---|
| Headlines (display/hero) | Crimson Text (serif) | Hero titles, one per page maximum |
| Body and UI | Geist Variable (sans-serif) | Everything else |

Key rules:
- Serif is reserved for display-layer only (hero headlines)
- All other headings, cards, body text use sans-serif
- Accessibility-first heading hierarchy (semantic h1, h2, h3 in logical order)

### Spacing and Layout
- **Container:** Max 1360px, centered
- **Grid:** 3+9 editorial layout (3-col margin + 9-col content)
- **Section spacing:** 48-96px between major sections
- **Card grid:** Responsive 1 → 2 → 3 → 4 columns

### Components

**Buttons:** Always fully rounded. Variants: default (dark), secondary (light gray), outline, ghost, link.

**Cards:** Standard radius ~10px. Image cards (4:5 portrait), featured cards (3:2 landscape), compact text-only cards. Hover: slight image zoom + title color shift.

**Icons:** Tabler Icons. Standard size 16px.

**Shadows:** Very sparingly -- almost only on hover states.

### Animation
- 150ms for micro-interactions
- 300ms standard (card hover, avatar expand)
- No bounce, no elastic, no overshoot -- everything smooth and measured
- Card hover: image zooms slightly, title color warms

### Responsive Breakpoints

| Breakpoint | Width | Key change |
|---|---|---|
| Mobile | < 768px | Single column, hamburger nav |
| sm | 640px | 2-column card grids |
| lg | 1024px | 3+9 grid activates, desktop nav |
| xl | 1280px | 4-column cards |

### Do's and Don'ts

**Do:**
- Use serif only for display-layer hero titles
- Use fully rounded buttons always
- Use card radius tokens (never raw values)
- Use section dividers to label content groups
- Keep hover animations to 300ms with simple transforms

**Don't:**
- Use color for content type indicators (use geometric animation instead)
- Use shadows on static elements
- Use "display" style more than once per page
- Use serif on body text, small headings, or UI elements
- Add bounce or elastic easing
