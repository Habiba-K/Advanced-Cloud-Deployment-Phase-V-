# Data Model: UI & Homepage Design

**Feature Branch**: `003-ui-homepage`
**Date**: 2026-01-24

## Overview

This feature is **frontend-only** and does not introduce new data entities or modify the database schema.

## Existing Entities (Reference Only)

The following entities already exist and will be displayed in the improved UI:

### User (read-only for this feature)
Used for displaying user information in the dashboard header.

| Field | Type | Display Usage |
|-------|------|---------------|
| id | UUID | Not displayed |
| email | string | Dashboard header, profile |
| name | string (optional) | Dashboard header greeting |

### Task/Todo (read-only for this feature)
Used for displaying task list in dashboard.

| Field | Type | Display Usage |
|-------|------|---------------|
| id | UUID | Edit/delete actions |
| title | string | Task card title |
| description | string (optional) | Task card body (truncated) |
| status | enum (pending/completed) | Checkbox, filtering |
| priority | enum (low/medium/high) | Visual indicator |
| due_date | date (optional) | Task card, sorting |
| completed_at | timestamp (optional) | Completed state indicator |
| created_at | timestamp | Sort order |

## UI State (Component Props)

### Homepage Props

```typescript
// No props needed - uses server-side session check
interface HomePageProps {}
```

### FeatureCard Props

```typescript
interface FeatureCardProps {
  icon: React.ReactNode  // Placeholder icon or emoji
  title: string          // Feature name
  description: string    // Brief description
}
```

### EmptyState Props

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}
```

### Container Props

```typescript
interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'  // max-width variants
}
```

### Section Props

```typescript
interface SectionProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'  // vertical padding
  background?: 'white' | 'gray' | 'primary'
}
```

## No Database Changes Required

This feature:
- Does not add new tables
- Does not modify existing schemas
- Does not require migrations
- Uses existing API endpoints without modification
