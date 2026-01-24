# Implementation Plan: UI & Homepage Design

**Branch**: `003-ui-homepage` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ui-homepage/spec.md`

## Summary

Create an attractive, public homepage at `/` and improve UI consistency and responsiveness across the entire frontend application. This is a frontend-only feature with no backend or API changes. The implementation enhances first impressions for hackathon judges and end users through modern, clean design and intuitive navigation.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16+ (App Router)
**Primary Dependencies**: React 19, Tailwind CSS 4.x, next/navigation
**Storage**: N/A (frontend-only, no database changes)
**Testing**: Manual responsive testing, visual review
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: Homepage loads within 2 seconds, no layout shifts
**Constraints**: No blocking animations, WCAG AA color contrast
**Scale/Scope**: 4 pages modified, 5 new components created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Security-First Design ✅
- **Status**: PASS
- **Assessment**: No backend changes, no new data exposure. Homepage is intentionally public. Auth state checked server-side before rendering.

### Correctness and Reliability ✅
- **Status**: PASS
- **Assessment**: Existing API contracts unchanged. UI improvements do not affect data flow or business logic.

### Clean Architecture ✅
- **Status**: PASS
- **Assessment**: New components follow existing patterns. Reusable UI components in `/components/ui/`, page-specific in `/components/homepage/`. No layer violations.

### Maintainability ✅
- **Status**: PASS
- **Assessment**: New components are modular and reusable. Follows existing Tailwind + TypeScript patterns. Design tokens centralized in Tailwind config.

### Modern Full-Stack Standards ✅
- **Status**: PASS
- **Assessment**: Mobile-first responsive design. Server Components for homepage (SEO/performance). Follows Next.js App Router patterns.

### Test-Driven Development ⏭️
- **Status**: N/A (not requested)
- **Assessment**: Testing not explicitly requested in spec. Manual testing checklist provided in quickstart.md.

### All Gates: ✅ PASSED

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-homepage/
├── plan.md              # This file
├── research.md          # Design decisions and alternatives
├── data-model.md        # Component prop interfaces
├── quickstart.md        # Development and testing guide
├── contracts/           # API contract notes (no changes)
│   └── README.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # To be created by /sp.tasks
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── page.tsx              # MODIFY: Replace redirect with homepage
│   ├── layout.tsx            # EXISTS: Root layout (no changes)
│   ├── globals.css           # EXISTS: Global styles (no changes)
│   ├── signin/
│   │   └── page.tsx          # MODIFY: Add back-to-home, improve layout
│   ├── signup/
│   │   └── page.tsx          # MODIFY: Add back-to-home, improve layout
│   └── dashboard/
│       └── page.tsx          # MODIFY: Add empty state, improve layout
├── components/
│   ├── ui/
│   │   ├── Button.tsx        # EXISTS: May extend with outline variant
│   │   ├── Card.tsx          # EXISTS: May add padding variants
│   │   ├── Input.tsx         # EXISTS: No changes needed
│   │   ├── Container.tsx     # NEW: Max-width responsive wrapper
│   │   ├── Section.tsx       # NEW: Vertical spacing wrapper
│   │   └── EmptyState.tsx    # NEW: Empty state display component
│   ├── homepage/
│   │   └── FeatureCard.tsx   # NEW: Feature highlight card
│   ├── auth/
│   │   ├── SigninForm.tsx    # EXISTS: No changes needed
│   │   └── SignupForm.tsx    # EXISTS: No changes needed
│   └── tasks/
│       ├── TaskList.tsx      # EXISTS: No changes needed
│       ├── TaskCard.tsx      # EXISTS: May improve visual hierarchy
│       └── TaskForm.tsx      # EXISTS: No changes needed
├── lib/
│   ├── auth.ts               # EXISTS: getSession() used for auth check
│   └── utils.ts              # EXISTS: cn() utility
└── tailwind.config.ts        # EXISTS: Already configured correctly
```

**Structure Decision**: Using existing web application structure. Frontend-only changes within `/frontend` directory. No new directories except `/components/homepage/` for homepage-specific components.

## Complexity Tracking

> No violations - all gates passed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Implementation Phases

### Phase 1: Base UI Components (P2 priority - foundation)

Create reusable components that support responsive design and consistent styling.

#### 1.1 Container Component
- **File**: `frontend/components/ui/Container.tsx`
- **Purpose**: Max-width wrapper with responsive horizontal padding
- **Props**: `size` (sm/md/lg/xl/full), `children`, `className`
- **Implementation**: Use Tailwind `max-w-*` classes with responsive padding

#### 1.2 Section Component
- **File**: `frontend/components/ui/Section.tsx`
- **Purpose**: Vertical spacing wrapper for page sections
- **Props**: `spacing` (sm/md/lg), `background` (white/gray/primary), `children`, `className`
- **Implementation**: Use Tailwind padding and background color classes

#### 1.3 EmptyState Component
- **File**: `frontend/components/ui/EmptyState.tsx`
- **Purpose**: Display when no items exist (e.g., no tasks)
- **Props**: `icon`, `title`, `description`, `action` (optional CTA)
- **Implementation**: Centered layout with muted colors

#### 1.4 FeatureCard Component
- **File**: `frontend/components/homepage/FeatureCard.tsx`
- **Purpose**: Display feature highlight on homepage
- **Props**: `icon`, `title`, `description`
- **Implementation**: Card-style layout with icon, text hierarchy

### Phase 2: Homepage (P1 priority - core feature)

Replace the redirect-only homepage with a dedicated landing page.

#### 2.1 Homepage Content
- **File**: `frontend/app/page.tsx`
- **Type**: Server Component
- **Sections**:
  1. **Hero**: Headline, subheadline, primary CTA (Sign Up), secondary CTA (Sign In)
  2. **Features**: 3 FeatureCards in responsive grid
  3. **Footer CTA**: Optional secondary call-to-action

#### 2.2 Auth State Handling
- Check session server-side using `getSession()`
- Authenticated users → redirect to `/dashboard`
- Unauthenticated users → render homepage content

#### 2.3 Responsive Layout
- Mobile: Single column, stacked sections
- Tablet: 2-column feature grid
- Desktop: 3-column feature grid, wider hero

### Phase 3: Auth Pages Enhancement (P2 priority)

Improve signin and signup page layouts for consistency.

#### 3.1 Signin Page
- **File**: `frontend/app/signin/page.tsx`
- **Changes**:
  - Add "← Back to Home" link above form
  - Improve vertical spacing
  - Ensure consistent Card usage

#### 3.2 Signup Page
- **File**: `frontend/app/signup/page.tsx`
- **Changes**:
  - Add "← Back to Home" link above form
  - Improve vertical spacing
  - Ensure consistent Card usage

### Phase 4: Dashboard Enhancement (P3 priority)

Improve dashboard visual hierarchy and add empty state.

#### 4.1 Empty State
- Display EmptyState component when user has no tasks
- Include CTA to create first task
- Friendly, encouraging messaging

#### 4.2 Layout Improvements
- Improve header visual hierarchy
- Enhance task list card separation
- Improve form section visibility

#### 4.3 Responsive Improvements
- Mobile: Stack form above task list
- Tablet/Desktop: Side-by-side layout (existing)

### Phase 5: Consistency Review (P2 priority)

Cross-page review to ensure design system consistency.

#### 5.1 Typography Check
- Heading sizes consistent across pages
- Body text sizes consistent
- Font weights appropriate

#### 5.2 Component Consistency
- Button styles (primary, secondary, danger) identical
- Card styles (padding, shadow, border) identical
- Input styles identical

#### 5.3 Spacing Consistency
- Section spacing consistent
- Container padding consistent
- Card margins consistent

### Phase 6: Responsive Testing (P2 priority)

Manual testing at all breakpoints.

#### 6.1 Test Viewports
- 320px (small mobile)
- 375px (standard mobile)
- 768px (tablet)
- 1024px (desktop)
- 1440px (large desktop)

#### 6.2 Test Criteria
- No horizontal scrolling
- No overlapping elements
- Text remains readable
- CTAs remain accessible
- Forms are usable at all sizes

## Dependencies and Order

```
Phase 1 (Base Components)
    ├── Container
    ├── Section
    ├── EmptyState
    └── FeatureCard
         │
         ▼
Phase 2 (Homepage) ──── depends on all Phase 1 components
         │
         ▼
Phase 3 (Auth Pages) ─── can parallel with Phase 4
         │
         ▼
Phase 4 (Dashboard) ──── depends on EmptyState
         │
         ▼
Phase 5 (Consistency) ─── depends on all pages complete
         │
         ▼
Phase 6 (Testing) ────── final validation
```

## Success Criteria Mapping

| Success Criteria | Implementation Phase | Verification |
|------------------|---------------------|--------------|
| SC-001: Homepage loads < 2s | Phase 2 | Server Component, no heavy assets |
| SC-002: No horizontal scroll | Phase 6 | Manual viewport testing |
| SC-003: Homepage to signup < 3 clicks | Phase 2 | 1 click (CTA button) |
| SC-004: Homepage to signin < 2 clicks | Phase 2 | 1 click (CTA button) |
| SC-005: Consistent styles | Phase 5 | Visual review all pages |
| SC-006: 3+ features visible | Phase 2 | FeatureCards in hero section |
| SC-007: No layout breaks | Phase 6 | Manual viewport testing |
| SC-008: Visible focus/hover states | Phase 1-4 | Existing Button component has these |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth state causes content flash | Low | Medium | Server-side auth check with redirect |
| Inconsistent styling after changes | Low | Low | Phase 5 dedicated to consistency review |
| Responsive layout issues | Medium | Medium | Phase 6 comprehensive testing |

## Follow-up Items

1. **After Implementation**: Run `/sp.tasks` to generate task breakdown
2. **Future Consideration**: Dark mode support (out of scope for this feature)
3. **Future Consideration**: Animation polish (out of scope for this feature)
