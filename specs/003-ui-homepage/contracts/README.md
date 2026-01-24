# API Contracts: UI & Homepage Design

**Feature Branch**: `003-ui-homepage`
**Date**: 2026-01-24

## Overview

This feature is **frontend-only** and does not introduce new API endpoints or modify existing contracts.

## Existing Endpoints Used (No Changes)

The homepage and UI improvements use the following existing endpoints without modification:

### Authentication (Better Auth)
| Endpoint | Method | Usage in Feature |
|----------|--------|------------------|
| Session check | Server-side | Homepage redirect for authenticated users |

### Tasks API (FastAPI Backend)
| Endpoint | Method | Usage in Feature |
|----------|--------|------------------|
| `GET /api/{user_id}/tasks` | GET | Dashboard task list display |
| `POST /api/{user_id}/tasks` | POST | Task creation form |
| `PATCH /api/{user_id}/tasks/{id}/complete` | PATCH | Toggle task completion |
| `DELETE /api/{user_id}/tasks/{id}` | DELETE | Task deletion |

## No New Contracts Required

This feature:
- Does not add new API endpoints
- Does not modify request/response schemas
- Does not change authentication flow
- Uses existing frontend API client (`@/lib/api-client`)

## Component Interface Contracts

See `data-model.md` for TypeScript interfaces for new UI components.
