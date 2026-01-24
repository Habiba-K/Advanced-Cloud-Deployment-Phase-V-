# Tasks: UI & Homepage Design

**Input**: Design documents from `/specs/003-ui-homepage/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested in spec. Manual testing checklist provided in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with frontend-only changes:
- **Frontend**: `frontend/app/`, `frontend/components/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and base components needed by all user stories

- [x] T001 Create homepage components directory at frontend/components/homepage/
- [x] T002 [P] Create Container component in frontend/components/ui/Container.tsx
- [x] T003 [P] Create Section component in frontend/components/ui/Section.tsx

**Checkpoint**: Base layout components ready for all pages ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create components that MUST exist before ANY user story can be implemented

**⚠️ CRITICAL**: User stories 1, 2, and 5 depend on these components

- [x] T004 [P] Create FeatureCard component in frontend/components/homepage/FeatureCard.tsx
- [x] T005 [P] Create EmptyState component in frontend/components/ui/EmptyState.tsx

**Checkpoint**: All reusable components ready - user story implementation can now begin ✓

---

## Phase 3: User Story 1 - First Visitor Views Homepage (Priority: P1) 🎯 MVP

**Goal**: Replace redirect-only homepage with dedicated landing page showing value proposition

**Independent Test**: Visit `/` without authentication → See homepage with headline, features, CTAs (not a redirect)

**Acceptance Criteria**:
- Homepage displays at `/` for unauthenticated users
- Clear value proposition headline visible
- At least 3 feature highlights displayed
- Prominent "Sign Up" and "Sign In" buttons

### Implementation for User Story 1

- [x] T006 [US1] Replace homepage content in frontend/app/page.tsx with hero section (headline, subheadline)
- [x] T007 [US1] Add Sign Up and Sign In CTA buttons to hero section in frontend/app/page.tsx
- [x] T008 [US1] Add features section with 3 FeatureCard components in frontend/app/page.tsx
- [x] T009 [US1] Implement server-side auth check in frontend/app/page.tsx (redirect authenticated users to /dashboard)
- [x] T010 [US1] Ensure homepage uses Container component for max-width constraint in frontend/app/page.tsx
- [x] T011 [US1] Add responsive layout classes (mobile single-column, desktop 3-column features) in frontend/app/page.tsx

**Checkpoint**: Homepage is fully functional and testable - visit `/` to verify ✓

---

## Phase 4: User Story 2 - User Navigates from Homepage to Authentication (Priority: P1)

**Goal**: Ensure CTA buttons work correctly and authenticated users are redirected

**Independent Test**: Click "Sign Up" → Navigate to /signup; Click "Sign In" → Navigate to /signin; Visit `/` when logged in → Redirect to /dashboard

**Acceptance Criteria**:
- Sign Up button navigates to /signup
- Sign In button navigates to /signin
- Authenticated users redirected to /dashboard

### Implementation for User Story 2

- [x] T012 [US2] Verify Link components for Sign Up CTA point to /signup in frontend/app/page.tsx
- [x] T013 [US2] Verify Link components for Sign In CTA point to /signin in frontend/app/page.tsx
- [x] T014 [US2] Add "← Back to Home" link to signin page in frontend/app/signin/page.tsx
- [x] T015 [US2] Add "← Back to Home" link to signup page in frontend/app/signup/page.tsx

**Checkpoint**: Full navigation flow works - Homepage ↔ Auth pages ↔ Dashboard ✓

---

## Phase 5: User Story 3 - User Experiences Responsive Design (Priority: P2)

**Goal**: All pages adapt correctly to mobile (320px+), tablet (768px+), and desktop (1024px+)

**Independent Test**: View homepage, signin, signup at 320px, 768px, 1024px → No horizontal scroll, readable content

**Acceptance Criteria**:
- Mobile: Content stacks vertically
- Tablet: 2-column feature grid on homepage
- Desktop: 3-column feature grid, side-by-side layouts
- No horizontal scrolling at any viewport

### Implementation for User Story 3

- [x] T016 [P] [US3] Add responsive padding and spacing to Container component in frontend/components/ui/Container.tsx
- [x] T017 [P] [US3] Add responsive padding to Section component in frontend/components/ui/Section.tsx
- [x] T018 [US3] Ensure homepage hero section is responsive (text sizing, button stacking) in frontend/app/page.tsx
- [x] T019 [US3] Ensure features grid is responsive (1-col mobile, 2-col tablet, 3-col desktop) in frontend/app/page.tsx
- [x] T020 [US3] Verify auth pages (signin, signup) are centered and responsive in frontend/app/signin/page.tsx and frontend/app/signup/page.tsx

**Checkpoint**: All pages render correctly at all breakpoints ✓

---

## Phase 6: User Story 4 - User Experiences Consistent UI Design (Priority: P2)

**Goal**: Typography, spacing, colors, and components are consistent across all pages

**Independent Test**: Navigate through homepage, signin, signup, dashboard → Styles match visually

**Acceptance Criteria**:
- Heading styles consistent (size, weight, color)
- Button styles consistent (primary, secondary variants)
- Card and container styles consistent
- Spacing and padding consistent

### Implementation for User Story 4

- [x] T021 [P] [US4] Review and standardize heading styles across homepage in frontend/app/page.tsx
- [x] T022 [P] [US4] Improve signin page layout and spacing in frontend/app/signin/page.tsx
- [x] T023 [P] [US4] Improve signup page layout and spacing in frontend/app/signup/page.tsx
- [x] T024 [US4] Verify Button component usage is consistent across all pages (primary/secondary variants)
- [x] T025 [US4] Verify Card component styling matches across signin, signup, and dashboard

**Checkpoint**: Visual consistency achieved across all pages ✓

---

## Phase 7: User Story 5 - User Experiences Improved Dashboard Layout (Priority: P3)

**Goal**: Dashboard has improved visual hierarchy, empty state, and responsive layout

**Independent Test**: Login with user that has no tasks → See empty state with CTA; Login with tasks → See improved layout

**Acceptance Criteria**:
- Empty state displayed when user has no tasks
- Task list has clear visual separation
- Create task form is visually distinct
- Mobile layout stacks form and task list

### Implementation for User Story 5

- [x] T026 [US5] Add EmptyState component to dashboard when no tasks exist in frontend/app/dashboard/page.tsx
- [x] T027 [US5] Improve header visual hierarchy in frontend/app/dashboard/page.tsx
- [x] T028 [US5] Enhance task list card separation and visual hierarchy in frontend/app/dashboard/page.tsx
- [x] T029 [US5] Improve create task form section visibility in frontend/app/dashboard/page.tsx
- [x] T030 [US5] Verify responsive layout (form above task list on mobile) in frontend/app/dashboard/page.tsx

**Checkpoint**: Dashboard is fully polished with empty state and improved layout ✓

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and consistency checks across all user stories

- [x] T031 Cross-page typography consistency review (all pages)
- [x] T032 Cross-page button style consistency review (all pages)
- [x] T033 Cross-page spacing consistency review (all pages)
- [x] T034 Manual responsive testing at 320px, 375px, 768px, 1024px, 1440px viewports
- [x] T035 Verify all interactive elements have visible hover and focus states
- [x] T036 Run quickstart.md validation checklist

**Checkpoint**: All phases complete - UI/Homepage feature fully implemented ✓

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── Creates FeatureCard, EmptyState
    │
    ├──────────────────────────────────────────┐
    ▼                                          ▼
Phase 3 (US1: Homepage) ──────────────► Phase 4 (US2: Navigation)
    │                                          │
    ▼                                          ▼
Phase 5 (US3: Responsive) ◄────────────────────┘
    │
    ▼
Phase 6 (US4: Consistency)
    │
    ▼
Phase 7 (US5: Dashboard)
    │
    ▼
Phase 8 (Polish)
```

### User Story Dependencies

| User Story | Depends On | Can Run Parallel With |
|------------|------------|----------------------|
| US1 (Homepage) | Phase 2 (FeatureCard) | None - MVP priority |
| US2 (Navigation) | US1 (Homepage must exist) | US3, US4 (once US1 done) |
| US3 (Responsive) | US1, US2 (pages must exist) | US4 |
| US4 (Consistency) | US1, US2 (pages must exist) | US3 |
| US5 (Dashboard) | Phase 2 (EmptyState) | After US1-4 recommended |

### Within Each User Story

- Layout components before page implementation
- Core structure before responsive adjustments
- Functionality before polish

### Parallel Opportunities

**Phase 1-2 (Foundational)**:
```bash
# These can run in parallel:
Task: "Create Container component in frontend/components/ui/Container.tsx"
Task: "Create Section component in frontend/components/ui/Section.tsx"
Task: "Create FeatureCard component in frontend/components/homepage/FeatureCard.tsx"
Task: "Create EmptyState component in frontend/components/ui/EmptyState.tsx"
```

**Phase 5 (Responsive)**:
```bash
# These can run in parallel:
Task: "Add responsive padding to Container in frontend/components/ui/Container.tsx"
Task: "Add responsive padding to Section in frontend/components/ui/Section.tsx"
```

**Phase 6 (Consistency)**:
```bash
# These can run in parallel:
Task: "Improve signin page in frontend/app/signin/page.tsx"
Task: "Improve signup page in frontend/app/signup/page.tsx"
Task: "Review homepage headings in frontend/app/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T011)
4. **STOP and VALIDATE**: Visit `/` - homepage should display with hero, features, CTAs
5. Deploy/demo if ready - this is a complete MVP!

### Incremental Delivery

1. Setup + Foundational → Components ready
2. User Story 1 → Homepage works → **Demo MVP**
3. User Story 2 → Navigation works → Homepage ↔ Auth flow complete
4. User Story 3 → Responsive design → Mobile-ready
5. User Story 4 → Consistent styling → Professional look
6. User Story 5 → Dashboard polish → Complete feature
7. Polish phase → Final validation

### Task Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Phase 1: Setup | 3 | 2 |
| Phase 2: Foundational | 2 | 2 |
| Phase 3: US1 Homepage | 6 | 0 |
| Phase 4: US2 Navigation | 4 | 0 |
| Phase 5: US3 Responsive | 5 | 2 |
| Phase 6: US4 Consistency | 5 | 3 |
| Phase 7: US5 Dashboard | 5 | 0 |
| Phase 8: Polish | 6 | 0 |
| **Total** | **36** | **9** |

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No automated tests required (manual testing per quickstart.md)
- All tasks are frontend-only (no backend changes)
