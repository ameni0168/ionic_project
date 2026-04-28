# Sprint-Based Workflow — Frontend Implementation Plan

## Information Gathered

### Backend Status (✅ Already Implemented)
- Models: `contract_model`, `sprint_plan_model`, `sprint_model`, `payment_model`, `activity_log_model`
- Services: `contract_service`, `sprint_plan_service`, `sprint_service`, `payment_service`
- Routes:
  - `POST /api/contracts`
  - `GET /api/contracts/<id>`
  - `POST /api/contracts/<id>/sprint-plans`
  - `POST /api/sprint-plans/<id>/submit`
  - `POST /api/sprint-plans/<id>/review`
  - `GET /api/contracts/<id>/sprints`
  - `POST /api/sprints/<id>/start`
  - `POST /api/sprints/<id>/submit`
  - `POST /api/sprints/<id>/review`
  - `POST /api/sprints/<id>/fund`
  - `GET /api/contracts/<id>/payments`

### Frontend Status (✅ Implemented)
- Existing: jobs, proposals, client/freelancer dashboards, gigs, orders
- New: contracts, sprint plans, sprints, payments UI

## Plan

### Phase 1 — Services & Models ✅
1. ~~**Create `contract.service.ts`** — CRUD + list by client/freelancer~~
2. ~~**Create `sprint-plan.service.ts`** — create, update, submit, review plans~~
3. ~~**Create `sprint.service.ts`** — start, submit, review sprints + list~~
4. ~~**Create `payment.service.ts`** — fund sprint, list payments, summarize~~

### Phase 2 — Pages ✅
5. ~~**Create `contract-list.page`** — list contracts for client & freelancer~~
6. ~~**Create `contract-detail.page`** — contract workspace with sprint timeline~~
7. ~~**Create `sprint-plan-builder.page`** — freelancer creates/edits sprint plan~~
8. ~~**Create `sprint-plan-review.page`** — client approves/requests revision~~
9. ~~**Create `sprint-workspace.page`** — freelancer submits sprint work~~
10. ~~**Create `sprint-review.page`** — client reviews sprint submission~~

### Phase 3 — Integration ✅
11. ~~**Update `app.routes.ts`** — register all new routes~~
12. ~~**Update `client-dashboard.page`** — link to contracts, show active contracts~~
13. ~~**Update `freelancer-dashboard.page`** — link to contracts, show active contracts~~
14. ~~**Update `proposal.page`** — navigate to contract after acceptance~~
15. ~~**Update `jobs.page`** — show contract link for jobs with contracts~~

### Phase 4 — Polish ✅
16. ~~**Status badge helpers** — map raw statuses to user-friendly labels/colors~~
17. ~~**Monetary formatting** — cents → display currency~~
18. ~~**Timeline component** — visual sprint progress~~

## Files Created
- `projet_mobile/src/app/services/contract.service.ts`
- `projet_mobile/src/app/services/sprint-plan.service.ts`
- `projet_mobile/src/app/services/sprint.service.ts`
- `projet_mobile/src/app/services/payment.service.ts`
- `projet_mobile/src/app/pages/contract-list/contract-list.page.ts`
- `projet_mobile/src/app/pages/contract-list/contract-list.page.html`
- `projet_mobile/src/app/pages/contract-list/contract-list.page.scss`
- `projet_mobile/src/app/pages/contract-detail/contract-detail.page.ts`
- `projet_mobile/src/app/pages/contract-detail/contract-detail.page.html`
- `projet_mobile/src/app/pages/contract-detail/contract-detail.page.scss`
- `projet_mobile/src/app/pages/sprint-plan-builder/sprint-plan-builder.page.ts`
- `projet_mobile/src/app/pages/sprint-plan-builder/sprint-plan-builder.page.html`
- `projet_mobile/src/app/pages/sprint-plan-builder/sprint-plan-builder.page.scss`
- `projet_mobile/src/app/pages/sprint-plan-review/sprint-plan-review.page.ts`
- `projet_mobile/src/app/pages/sprint-plan-review/sprint-plan-review.page.html`
- `projet_mobile/src/app/pages/sprint-plan-review/sprint-plan-review.page.scss`
- `projet_mobile/src/app/pages/sprint-workspace/sprint-workspace.page.ts`
- `projet_mobile/src/app/pages/sprint-workspace/sprint-workspace.page.html`
- `projet_mobile/src/app/pages/sprint-workspace/sprint-workspace.page.scss`
- `projet_mobile/src/app/pages/sprint-review/sprint-review.page.ts`
- `projet_mobile/src/app/pages/sprint-review/sprint-review.page.html`
- `projet_mobile/src/app/pages/sprint-review/sprint-review.page.scss`

## Files Edited
- `projet_mobile/src/app/app.routes.ts` — Added 7 new routes
- `projet_mobile/src/app/pages/proposal/proposal.page.ts` — Navigate to contracts after acceptance

## Follow-up
- Test navigation flow: Job → Proposal → Contract → Sprint Plan → Sprints
- Verify role-based permissions in UI

