---
id: 048
title: Add Priority Color Border to Task Cards
stage: green
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-advanced-features-local-deploy
branch: 001-advanced-features-local-deploy
user: user
command: direct-request
labels: ["ui", "task-card", "priority", "visual-indicator", "trello-style"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/tasks/TaskCard.tsx
tests:
  - None (UI improvement requiring manual testing)
---

## Prompt

task me mediun, high,low kay hisaab se bleck ho yahan puri line per color araha hai

(Translation: In tasks, there should be a block/bar according to medium, high, low priority - currently color is showing on the whole line)

**User wanted:** Colored left border on task cards based on priority (like Trello cards)

## Response snapshot

Added colored left border to task cards based on priority level:

### **Changes to TaskCard.tsx**

**Priority Border Colors:**
```javascript
const priorityBorderColors = {
  low: 'border-l-green-500',
  medium: 'border-l-blue-500',
  high: 'border-l-red-500'
}
```

**Applied to Card:**
```jsx
<Card
  className={`... border-l-4 ${priorityBorderColors[task.priority]}`}
  ...
>
```

### **Visual Result**

**Before:**
- Priority badge (small pill) in top-right corner
- No visual indicator on card itself

**After:**
- 4px colored left border on entire card
- Green border = Low priority
- Blue border = Medium priority
- Red border = High priority
- Priority badge still visible for explicit label

### **Design Benefits**

✅ **Quick Visual Scanning** - Users can instantly see priority without reading badges
✅ **Trello-Style Pattern** - Familiar design pattern from popular task management apps
✅ **Color Coding** - Standard traffic light colors (green=low, blue=medium, red=high)
✅ **Non-Intrusive** - Subtle left border doesn't overwhelm the card design
✅ **Complements Badge** - Works alongside existing priority badge for clarity

### **Color Scheme**

- **Low Priority:** `border-l-green-500` - Green (calm, not urgent)
- **Medium Priority:** `border-l-blue-500` - Blue (moderate attention)
- **High Priority:** `border-l-red-500` - Red (urgent, important)

### **Technical Implementation**

- `border-l-4` - 4px left border width
- Dynamic class based on `task.priority` value
- Maintains existing card styling and hover effects
- Works in both light and dark modes

## Outcome

- ✅ Impact: Improved visual priority indication - users can scan task list faster
- 🧪 Tests: Manual testing required to verify colors display correctly
- 📁 Files: Modified 1 file (TaskCard.tsx)
- 🔁 Next prompts: Test on frontend, verify all three priority levels show correct colors
- 🧠 Reflection: Simple but effective visual improvement. The left border pattern is widely used in task management apps (Trello, Asana, ClickUp) because it provides instant visual feedback without cluttering the interface.

## Evaluation notes (flywheel)

- Failure modes observed: None anticipated
- Graders run and results (PASS/FAIL): N/A (UI change)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Could add darker border colors for dark mode, or add subtle glow effect on high priority tasks
