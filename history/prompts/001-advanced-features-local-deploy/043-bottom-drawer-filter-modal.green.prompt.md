---
id: 043
title: Convert Mobile Filter Modal to Bottom Drawer
stage: green
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-advanced-features-local-deploy
branch: 001-advanced-features-local-deploy
user: user
command: direct-request
labels: ["ui", "mobile", "drawer", "modal", "ux-improvement"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/ui/Modal.tsx
tests:
  - None (UI/UX improvement requiring manual testing)
---

## Prompt

abhi bhi form ky pichay ka black hai ,pichay page dikhna cahiay

(Translation: The form still has black behind it, the page should be visible behind it)

## Response snapshot

Converted the full-screen modal to a bottom drawer/sheet pattern for better mobile UX:

**Modal Component Updates (Modal.tsx):**

1. **Conditional Rendering Based on Size:**
   - When `size='full'`: Renders as bottom drawer (mobile pattern)
   - Other sizes: Renders as centered modal (desktop pattern)

2. **Bottom Drawer Features:**
   - Positioned at bottom of screen (`fixed inset-x-0 bottom-0`)
   - Takes up max 85% of viewport height (`max-h-[85vh]`)
   - Rounded top corners (`rounded-t-2xl`)
   - Drag handle indicator at top (visual affordance)
   - Page content above drawer remains visible
   - Scrollable content area

3. **Backdrop Improvements:**
   - Very light and transparent (`bg-opacity-20`)
   - Subtle blur effect (`backdrop-blur-sm`)
   - Allows page content to show through

**UX Benefits:**
- Users can see the task list above the drawer
- Familiar mobile pattern (bottom sheet)
- Visual drag handle suggests swipe-to-close (future enhancement)
- Less intrusive than full-screen modal
- Better context awareness - users see what they're filtering

**Technical Implementation:**
- Conditional rendering: `isDrawer = size === 'full'`
- Bottom drawer: `fixed inset-x-0 bottom-0` positioning
- Center modal: `flex items-center justify-center` positioning
- Both share same backdrop and close behavior

## Outcome

- ✅ Impact: Significantly improved mobile UX - page content now visible behind filter drawer
- 🧪 Tests: Manual testing required on mobile devices to verify drawer behavior
- 📁 Files: Modified 1 file (Modal.tsx)
- 🔁 Next prompts: Test on mobile, consider adding swipe-to-close gesture, verify scroll behavior
- 🧠 Reflection: Bottom drawer is the standard mobile pattern for filters/options. Much better UX than full-screen modal that hides all context.

## Evaluation notes (flywheel)

- Failure modes observed: None anticipated
- Graders run and results (PASS/FAIL): N/A (UI/UX change)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add slide-up animation transition, or implement swipe-down-to-close gesture
