# ReadTrack — Claude Code Instructions

## 1. Project Overview

ReadTrack is a simple, modern reading-tracking app designed to help people
read consistently and maintain momentum — "Strava for reading".

Like Strava, reading is recorded as sessions, progress is visible, and
consistency (streaks, weekly/monthly totals) is motivating. Following other
readers and seeing their sessions in a feed is part of the product.

The goal is not to build a complicated book-management platform.

### Core features (current focus)

1. 📖 Currently Reading — books in progress, separate from finished books
2. 📊 Reading Progress — pages read vs. total pages, shown as %
3. ⏱️ Reading Session — start/stop timer, plus manual entry as a fallback
4. 📅 Reading Calendar — which days the user read
5. 🔥 Reading Streak — consecutive reading days
6. 📈 Weekly / Monthly Stats — simple totals (time, pages, sessions)

Existing social features (People/follow, Feed) stay as they are.
Do not expand them unless requested.

The core philosophy is:

> Help users read more, not spend more time managing their reading.

Prioritize simplicity, clarity, and actual usefulness.

---

## 2. Development Principles

### Build the smallest useful version first

- Do not overbuild.
- Do not add features that were not requested.
- Do not build speculative features "for later".
- Prefer the simplest implementation that solves the current problem.
- Avoid unnecessary dependencies.
- Avoid unnecessary abstractions.
- Avoid premature optimization.

Before implementing a feature, ask:

1. What user problem does this solve?
2. Is this necessary for the current version?
3. Can the same result be achieved more simply?

If a feature is not clearly necessary, do not implement it.

### Do not assume requirements

If a requirement is ambiguous and could materially change the implementation,
ask before making a large architectural decision.

For small UI or implementation details, choose the simplest sensible option.

---

## 3. Product Priorities

Prioritize features in this order:

1. Core reading experience
2. Reading progress
3. Simple reading tracking
4. Clear visual feedback
5. Ease of use
6. Delightful but restrained UI

Do NOT prioritize:

- Complex social features beyond following and a simple feed
- Gamification beyond streaks (no points, levels, badges)
- Excessive statistics beyond simple weekly/monthly totals
- Complicated recommendation engines
- Unnecessary notifications
- Complex customization
- Features designed only to make the app look more sophisticated

---

## 4. UX Principles

ReadTrack should feel:

- Calm
- Minimal
- Modern
- Focused
- Intuitive
- Lightweight

A user should understand the main screen immediately.

Minimize:

- Cognitive load
- Number of clicks
- Visual clutter
- Unnecessary settings
- Dense information
- Repetitive UI

Every screen should have a clear primary purpose.

---

## 5. UI / Design Rules

Use the installed design skills when appropriate:

- Taste / design-taste-frontend
- Taste / image-to-code
- UI UX Pro Max
- Playwright CLI

### Color palette — black & white

| Role | Color |
|---|---|
| Background | `#FFFFFF` |
| Text | `#111111` |
| Secondary text | `#6E6E6E` |
| Border | `#E2E2E2` |
| Accent / primary button | `#111111` |

Colors live in `src/constants/theme.ts` (with an inverted dark mode).
No other accent colors. Create hierarchy with weight, size and spacing,
not color. Use the shared `Screen`, `AppButton`, `TextField` and
`ThemedText` components instead of raw inline styles.

Prefer:

- Strong visual hierarchy
- Consistent spacing
- Clear typography
- Restrained color usage
- Consistent component patterns
- Responsive layouts
- Accessible contrast
- Clear interactive states

Do not:

- Randomly introduce colors
- Use excessive gradients
- Use excessive shadows
- Use decorative elements without purpose
- Create unnecessarily complex animations
- Make every section visually compete for attention

The design should feel intentional rather than template-like.

---

## 6. Accessibility

Accessibility is part of the product, not an optional enhancement.

Always consider:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Appropriate color contrast
- Accessible labels
- Button states
- Form validation
- Responsive layouts
- Screen-reader-friendly structure

Do not rely on color alone to communicate important information.

---

## 7. Responsive Design

The app must work well on:

- Desktop
- Tablet
- Mobile

Do not design only for desktop and patch mobile later.

When implementing responsive layouts:

- Prefer flexible layouts.
- Avoid fixed widths when unnecessary.
- Prevent horizontal scrolling.
- Ensure touch targets are appropriately sized.
- Test important flows at mobile viewport sizes.

---

## 8. Code Quality

Write code that is:

- Simple
- Readable
- Maintainable
- Consistent with the existing codebase

Before creating a new component, check whether an existing component
can be reused.

Avoid:

- Duplicate components
- Duplicate styling
- Unnecessary utility functions
- Deeply nested abstractions
- Large files when smaller components would be clearer

Do not refactor unrelated code unless necessary for the requested change.

---

## 9. Dependencies

Do not install a new package unless there is a clear reason.

Before adding a dependency:

1. Check whether the functionality already exists.
2. Check whether it can be implemented simply without a dependency.
3. Consider whether the dependency adds unnecessary complexity.

Keep the dependency footprint small.

---

## 10. Working With Existing Code

Before making significant changes:

1. Inspect the relevant files.
2. Understand the existing structure.
3. Reuse existing patterns.
4. Make the smallest necessary change.

Do not rewrite working code simply because another approach looks cleaner.

Preserve existing functionality unless the task explicitly requires changing it.

---

## 11. Browser Testing

Use Playwright when browser verification is useful.

For meaningful UI changes:

1. Start the application.
2. Open the relevant page.
3. Test the primary user flow.
4. Check for console errors.
5. Check the layout at relevant viewport sizes.
6. Fix issues found during testing.
7. Re-test after fixing.

Do not assume that code compiling means the UI works.

---

## 12. Design-to-Code

When given a screenshot, reference image, or visual design:

- Analyze the layout before coding.
- Identify typography, spacing, hierarchy, and components.
- Reproduce the visual intent accurately.
- Use the image-to-code skill when appropriate.
- Do not blindly copy implementation details from an image.

Prioritize the overall visual hierarchy and user experience over pixel-level
matching when exact implementation details are unavailable.

---

## 13. Feature Development Workflow

For a new feature:

### Step 1 — Understand
Identify exactly what is being requested.

### Step 2 — Inspect
Check the existing code and relevant components.

### Step 3 — Plan
Choose the smallest reasonable implementation.

### Step 4 — Implement
Make the change without unnecessary modifications.

### Step 5 — Test
Verify the relevant user flow.

### Step 6 — Review
Check:

- Does it solve the requested problem?
- Did anything unnecessary get added?
- Does it match the existing design?
- Does it work on mobile?
- Are there errors or regressions?

---

## 14. Do Not Overbuild

This rule is especially important for ReadTrack.

If the requested feature could be implemented in several ways,
choose the simplest version.

For example:

Do NOT automatically add:

- Richer social profiles, comments, likes or kudos
- AI recommendations
- Complex analytics
- Achievements
- Badges
- Push notifications

(User accounts, following, the feed and the reading streak already exist —
keep them, but do not expand them unless requested.)
- Multiple subscription tiers
- Admin dashboards
- Complex backend architecture

unless they are explicitly requested and justified by the product requirements.

---

## 15. Product Validation

Do not assume that every proposed feature is valuable.

When appropriate, distinguish between:

- A real user problem
- A nice-to-have
- A developer-driven feature
- A feature that increases complexity without meaningful value

If a proposed feature appears unnecessary, say so before implementing it.

The goal is to build a useful product, not the largest possible product.

---

## 16. Communication Style

When working with the project:

- Be concise.
- State what you are doing.
- Explain important decisions briefly.
- Do not give long explanations unless requested.
- If something is uncertain, state the uncertainty clearly.
- If there is a significantly better simpler approach, recommend it.

When a task is complete, briefly report:

1. What changed
2. What was tested
3. Any remaining issue

---

## 17. Security

Never expose secrets.

Do not commit:

- API keys
- Passwords
- Authentication tokens
- Private credentials
- `.env` secrets

Use environment variables for sensitive configuration.

---

## 18. Git Safety

Do not run destructive Git commands unless explicitly requested.

Avoid:

- `git reset --hard`
- Deleting branches
- Removing large numbers of files
- Overwriting user changes

Before destructive operations, explain what will happen and ask for confirmation.

---

## 19. Current Skillset

The project currently uses these Claude Code skills where appropriate:

- Taste — design-taste-frontend
- Taste — image-to-code
- Playwright CLI
- UI UX Pro Max

Use the appropriate skill rather than manually reproducing functionality
that the skill is specifically designed to provide.

---

## 20. Final Rule

When in doubt:

> Do less, but do it well.

Build the smallest useful version of ReadTrack,
keep the experience simple,
and only add complexity when there is a clear user or product reason.