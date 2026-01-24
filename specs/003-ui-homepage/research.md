# Research: UI & Homepage Design

**Feature Branch**: `003-ui-homepage`
**Date**: 2026-01-24

## Research Summary

This feature is frontend-only with no backend changes. All technical context is known from the existing codebase.

---

## Decision 1: Homepage Route Strategy

**Decision**: Replace redirect-only `app/page.tsx` with a dedicated homepage component that checks auth state and shows homepage content or redirects to dashboard.

**Rationale**:
- Current `app/page.tsx` only redirects (to `/signin` or `/dashboard`)
- Need to show actual content at `/` for unauthenticated users
- Use Next.js server-side session check to conditionally render or redirect

**Alternatives considered**:
- Middleware-based redirect: Rejected - adds complexity, harder to debug
- Client-side auth check: Rejected - causes flash of content, poor UX

---

## Decision 2: Design System Approach

**Decision**: Extend existing Tailwind configuration and component library rather than introducing new design system.

**Rationale**:
- Tailwind CSS already configured with color palette (primary, gray scales)
- Existing components (Button, Card, Input) follow consistent patterns
- `globals.css` already defines component classes (`btn-primary`, `input-field`, etc.)
- Minimal changes needed - extend rather than replace

**Alternatives considered**:
- shadcn/ui: Rejected - overkill for current scope, adds significant dependencies
- Radix UI: Rejected - unnecessary for simple UI improvements
- CSS-in-JS: Rejected - inconsistent with existing Tailwind approach

---

## Decision 3: Responsive Breakpoint Strategy

**Decision**: Use Tailwind's mobile-first responsive utilities with existing breakpoints (xs:320px, sm:640px, md:768px, lg:1024px, xl:1280px).

**Rationale**:
- Breakpoints already configured in `tailwind.config.ts`
- Mobile-first approach is industry standard and already used
- Matches spec requirements (320px, 768px, 1024px)

**Alternatives considered**:
- Custom CSS media queries: Rejected - inconsistent with existing Tailwind patterns
- Container queries: Rejected - not needed for this feature scope

---

## Decision 4: Homepage Layout Structure

**Decision**: Create homepage with hero section, feature grid, and CTA section using Server Component with conditional redirect for authenticated users.

**Rationale**:
- Server Component for SEO and fast initial load
- Simple layout: Hero → Features → CTA
- Auth check happens server-side, fast redirect for authenticated users
- Aligns with Next.js App Router best practices

**Structure**:
```
Homepage
├── Hero Section
│   ├── Headline (value proposition)
│   ├── Subheadline (brief description)
│   └── CTA Buttons (Sign Up primary, Sign In secondary)
├── Features Section
│   └── 3 Feature Cards (icon placeholder, title, description)
└── Footer CTA (optional secondary call-to-action)
```

---

## Decision 5: Component Reusability

**Decision**: Create new reusable components for homepage-specific elements; extend existing components for shared elements.

**Rationale**:
- Existing `Button`, `Card`, `Input` components are well-structured
- Need new: `FeatureCard`, `Container` (max-width wrapper), `Section` (vertical spacing)
- Avoid duplicating existing component functionality

**New Components**:
| Component | Purpose | Location |
|-----------|---------|----------|
| Container | Max-width wrapper with responsive padding | `components/ui/Container.tsx` |
| Section | Vertical spacing wrapper for page sections | `components/ui/Section.tsx` |
| FeatureCard | Feature highlight with icon/title/description | `components/homepage/FeatureCard.tsx` |

---

## Decision 6: Empty State Design Pattern

**Decision**: Create reusable `EmptyState` component with icon, title, description, and optional CTA button.

**Rationale**:
- Dashboard needs empty state for users with no tasks
- Consistent pattern across application
- Reusable for other future empty states

---

## Existing Codebase Analysis

### Current Components (to extend)
| Component | Current State | Changes Needed |
|-----------|---------------|----------------|
| `Button` | 3 variants, 3 sizes, loading state | Add `outline` variant for secondary CTAs |
| `Card` | Basic white card with border | Add padding variants (sm, md, lg) |
| `Input` | Basic input field | Add label support, error display |
| `Loading` | Simple spinner | No changes needed |

### Current Pages (to improve)
| Page | Current State | Changes Needed |
|------|---------------|----------------|
| `/` (page.tsx) | Redirect only | Complete replacement with homepage |
| `/signin` | Functional but basic | Improve spacing, add back-to-home link |
| `/signup` | Functional but basic | Improve spacing, add back-to-home link |
| `/dashboard` | Functional layout | Improve visual hierarchy, empty state |

### Tailwind Configuration
- Color palette: Primary (blue), Gray scales, Red, Green, Yellow
- Breakpoints: xs (320px), sm (640px), md (768px), lg (1024px), xl (1280px)
- No changes needed to configuration

---

## Technical Constraints Confirmed

1. **Next.js App Router**: Confirmed in use
2. **Tailwind CSS**: Configured and working
3. **TypeScript**: Required for all components
4. **Better Auth**: Session available via `getSession()` from `@/lib/auth`
5. **No Backend Changes**: Frontend-only feature

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth state flash on homepage | Low | Medium | Server-side auth check with redirect |
| Responsive layout breaks | Low | Medium | Test at all breakpoints during implementation |
| Inconsistent styling | Low | Low | Use existing design tokens, review all pages |

---

## Implementation Order Recommendation

1. Create base UI components (Container, Section, FeatureCard, EmptyState)
2. Replace homepage (`app/page.tsx`)
3. Update auth pages (signin, signup) with improved layout
4. Update dashboard with visual improvements and empty state
5. Cross-page consistency review
6. Responsive testing at all breakpoints
