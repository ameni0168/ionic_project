# Sprint-Based Project Architecture

## 1. Goal

Your platform currently supports:

- `jobs`: project postings
- `proposals`: freelancer applications
- `orders`: gig/service orders

Today, a `job` becomes `in_progress` as soon as a proposal is accepted. That works for simple flows, but it is too limited for real freelance delivery because:

- there is no formal project decomposition
- payment is not tied to validated deliverables
- client and freelancer negotiation after acceptance is too light
- tracking, revisions, delays, and escrow are hard to manage

The recommended evolution is to introduce a `contract` layer and a `sprint plan` layer between proposal acceptance and execution.

Core idea:

1. A client publishes a job or hires a freelancer directly.
2. A freelancer is selected.
3. A contract is created.
4. The freelancer proposes a sprint breakdown.
5. The client approves or requests changes.
6. Approved sprints become executable work units.
7. Each sprint is submitted, reviewed, validated, and paid independently.


## 2. Architecture Decisions

These are the implementation decisions that should be treated as rules from the start.

### A. Separate hiring from execution

- `jobs` remain the marketplace entry point
- `proposals` remain the pre-contract negotiation layer
- `contracts` become the execution root for custom work
- `orders` remain dedicated to gig and catalog purchases

Proposal acceptance must end the hiring workflow and start a `contract`. It must not directly start delivery.

### B. Store sprint definitions inside `sprint_plans`

The `sprint_plans` collection should contain the proposed sprint line items in an embedded `sprints` array. When a plan is approved, those embedded items are materialized into the standalone `sprints` collection.

This matters because:

- a plan version must be reviewable as a whole
- a rejected plan should remain auditable without touching executable sprint records
- approval should create an immutable snapshot of what was agreed

### C. Store money in integer minor units

Use integer minor units everywhere:

- `amount_cents`
- `price_cents`
- `total_price_cents`
- `fee_cents`
- `tax_cents`

Do not use float values for money in MongoDB documents or API contracts.

### D. Treat some contract fields as cached projections

These fields are useful, but they are derived and should be updated transactionally whenever dependent records change:

- `contract.current_sprint_id`
- `contract.completed_sprints_count`
- `contract.total_sprints_count`
- `contract.total_estimated_amount_cents`
- `contract.total_approved_amount_cents`

### E. Enforce one active sprint in phase 1

Phase 1 should allow only one executable sprint at a time.

That means:

- at most one sprint can be `ready` or `in_progress`
- the next sprint unlocks only after the current sprint is approved and payout handling is completed according to policy

Parallel sprints can be added later with explicit dependencies.

### F. Add audit events from phase 1

Every major state transition should produce an append-only activity event. This can start as a lightweight `activity_logs` collection even if admin tooling comes later.


## 3. Recommended Domain Model

### Existing collections to keep

#### `jobs`

Represents the initial client need.

Suggested additions:

- `workflow_type`: `single_delivery` | `sprint_based`
- `engagement_mode`: `job_post` | `direct_hire`
- `hiring_status`: `open` | `shortlisting` | `proposal_selected` | `contract_created` | `closed_without_hire`
- `selected_proposal_id`
- `selected_freelancer_id`
- `contract_id`
- `updated_at`

Important:

- `status` should remain business-visible project state
- `hiring_status` should track hiring progression only
- do not overload `status` with both marketplace and delivery concerns

Recommended `job.status`:

- `draft`
- `open`
- `under_review`
- `active`
- `completed`
- `cancelled`
- `archived`

Example:

```json
{
  "_id": "job_123",
  "title": "Build mobile app MVP",
  "description": "Client brief...",
  "budget_min_cents": 150000,
  "budget_max_cents": 300000,
  "budget_type": "fixed",
  "deadline": "2026-06-30",
  "category": "Mobile Development",
  "experience_level": "expert",
  "client_id": "client_1",
  "skills": ["Ionic", "Flask", "MongoDB"],
  "workflow_type": "sprint_based",
  "engagement_mode": "job_post",
  "status": "active",
  "hiring_status": "contract_created",
  "selected_proposal_id": "proposal_77",
  "selected_freelancer_id": "freelancer_9",
  "contract_id": "contract_42",
  "created_at": "2026-04-27T10:00:00Z",
  "updated_at": "2026-04-27T12:00:00Z"
}
```

#### `proposals`

Keep it for pre-contract negotiation.

Suggested additions:

- `proposal_type`: `job_application` | `direct_hire_response`
- `pricing_model`: `fixed_total` | `sprint_estimate`
- `price_cents`
- `currency`
- `initial_sprint_outline`: optional lightweight draft before formal sprint planning
- `revision_notes`: array of client feedback before acceptance
- `status`: `pending` | `shortlisted` | `accepted` | `rejected` | `withdrawn`

Important:

Once accepted, the proposal should not directly drive delivery. It should create a `contract`.

#### `orders`

Your current `orders` collection appears aligned with gig purchases.

Recommendation:

- keep `orders` for gig and catalog orders
- use `contracts` for custom project execution
- if you need unified reporting later, create it at service or analytics level rather than forcing `orders` and `contracts` into one schema


## 4. New Collections

### `contracts`

This becomes the central execution object after a freelancer is selected.

Purpose:

- links client, freelancer, and source job or proposal
- stores agreed commercial terms
- acts as the parent entity for sprint plans, sprints, payments, revisions, and disputes

Suggested schema:

```json
{
  "_id": "contract_42",
  "job_id": "job_123",
  "proposal_id": "proposal_77",
  "client_id": "client_1",
  "freelancer_id": "freelancer_9",
  "source_type": "job",
  "workflow_type": "sprint_based",
  "title": "Build mobile app MVP",
  "description_snapshot": "Snapshot of scope at contract creation",
  "currency": "USD",
  "pricing_type": "fixed_by_sprint",
  "total_estimated_amount_cents": 240000,
  "total_approved_amount_cents": 260000,
  "escrow_enabled": true,
  "status": "awaiting_sprint_plan",
  "active_sprint_plan_id": null,
  "current_sprint_id": null,
  "completed_sprints_count": 0,
  "total_sprints_count": 0,
  "start_date": null,
  "target_end_date": null,
  "completed_at": null,
  "cancelled_at": null,
  "created_at": "2026-04-27T12:00:00Z",
  "updated_at": "2026-04-27T12:30:00Z"
}
```

Recommended contract statuses:

- `awaiting_sprint_plan`
- `sprint_plan_under_review`
- `active`
- `paused`
- `in_dispute`
- `completed`
- `cancelled`

### `sprint_plans`

Represents a versioned sprint proposal for a contract.

Why a separate collection:

- the freelancer may submit several plan revisions
- the client may reject and ask for changes
- you need auditability and rollback
- the approved version must remain frozen even after future plan drafts exist

Suggested schema:

```json
{
  "_id": "plan_11",
  "contract_id": "contract_42",
  "version": 1,
  "created_by": "freelancer_9",
  "summary": "3-sprint plan for MVP delivery",
  "currency": "USD",
  "total_price_cents": 260000,
  "total_duration_days": 24,
  "status": "submitted",
  "client_feedback": null,
  "sprints": [
    {
      "sequence": 1,
      "title": "Authentication",
      "description": "Login, registration, JWT, password reset",
      "goals": [
        "Client can create account",
        "Freelancer can login securely"
      ],
      "deliverables": [
        "Auth API endpoints",
        "Mobile login screens",
        "Basic access control"
      ],
      "duration_days": 5,
      "price_cents": 60000,
      "max_revisions": 2
    }
  ],
  "submitted_at": "2026-04-28T09:00:00Z",
  "reviewed_at": null,
  "approved_at": null,
  "rejected_at": null,
  "created_at": "2026-04-28T08:30:00Z",
  "updated_at": "2026-04-28T09:00:00Z"
}
```

Recommended statuses:

- `draft`
- `submitted`
- `revision_requested`
- `approved`
- `rejected`
- `superseded`

### `sprints`

Stores the executable sprint records. These are created only after a sprint plan is approved.

Suggested schema:

```json
{
  "_id": "sprint_1",
  "contract_id": "contract_42",
  "sprint_plan_id": "plan_11",
  "sequence": 1,
  "title": "Authentication",
  "description": "Login, registration, JWT, password reset",
  "goals": [
    "Client can create account",
    "Freelancer can login securely"
  ],
  "deliverables": [
    "Auth API endpoints",
    "Mobile login screens",
    "Basic access control"
  ],
  "duration_days": 5,
  "price_cents": 60000,
  "currency": "USD",
  "status": "pending_funding",
  "planned_start_date": null,
  "start_date": null,
  "due_date": null,
  "actual_submitted_at": null,
  "approved_at": null,
  "rejected_at": null,
  "revision_count": 0,
  "max_revisions": 2,
  "submission_note": null,
  "client_feedback": null,
  "attachments": [],
  "created_at": "2026-04-28T09:00:00Z",
  "updated_at": "2026-04-28T09:00:00Z"
}
```

Recommended statuses:

- `draft`
- `pending_funding`
- `ready`
- `in_progress`
- `submitted`
- `changes_requested`
- `approved`
- `payment_released`
- `late`
- `cancelled`
- `blocked`
- `disputed`

Phase 1 rule:

- only one sprint should be executable at a time

### `sprint_reviews`

Tracks submission and review history separately from sprint state.

Suggested schema:

```json
{
  "_id": "review_100",
  "contract_id": "contract_42",
  "sprint_id": "sprint_1",
  "submitted_by": "freelancer_9",
  "submission_note": "Auth completed and deployed on staging",
  "attachments": [
    {
      "type": "link",
      "url": "https://staging.example.com"
    }
  ],
  "status": "submitted",
  "review_result": null,
  "reviewed_by": null,
  "review_note": null,
  "created_at": "2026-05-02T14:00:00Z",
  "reviewed_at": null
}
```

Review results:

- `approved`
- `changes_requested`
- `rejected`

### `payments`

A unified payment ledger.

Suggested schema:

```json
{
  "_id": "payment_90",
  "contract_id": "contract_42",
  "sprint_id": "sprint_1",
  "client_id": "client_1",
  "freelancer_id": "freelancer_9",
  "type": "escrow_release",
  "amount_cents": 60000,
  "currency": "USD",
  "status": "held",
  "provider": "stripe",
  "provider_reference": "pi_xxx",
  "funded_at": "2026-04-29T10:00:00Z",
  "released_at": null,
  "failed_at": null,
  "refunded_at": null,
  "meta": {
    "fee_cents": 6000,
    "tax_cents": 0
  },
  "created_at": "2026-04-29T10:00:00Z",
  "updated_at": "2026-04-29T10:00:00Z"
}
```

Recommended statuses:

- `pending_funding`
- `held`
- `authorized`
- `released`
- `failed`
- `refunded`
- `partially_refunded`
- `cancelled`
- `disputed`

### `notifications`

Central event-driven notification storage.

Suggested schema:

```json
{
  "_id": "notif_1",
  "user_id": "client_1",
  "type": "sprint_plan_submitted",
  "title": "New sprint plan submitted",
  "message": "The freelancer submitted a sprint plan for Build mobile app MVP",
  "entity_type": "contract",
  "entity_id": "contract_42",
  "read": false,
  "channels": ["in_app"],
  "created_at": "2026-04-28T09:01:00Z"
}
```

### `activity_logs`

Recommended from phase 1 for auditability.

Suggested schema:

```json
{
  "_id": "activity_1",
  "entity_type": "contract",
  "entity_id": "contract_42",
  "event_type": "sprint_plan_approved",
  "actor_id": "client_1",
  "meta": {
    "sprint_plan_id": "plan_11"
  },
  "created_at": "2026-04-28T10:00:00Z"
}
```

### Optional future collections

- `disputes`
- `penalties`
- `contract_messages`
- `sprint_dependencies`
- `change_requests`


## 5. Relationships

Recommended relationships:

- `client 1-N jobs`
- `job 1-N proposals`
- `job 0..1 contract` for custom project flow
- `proposal 0..1 contract`
- `contract 1-N sprint_plans`
- `contract 1-N sprints`
- `sprint_plan 1-N sprints`
- `sprint 1-N sprint_reviews`
- `sprint 1-1 or 1-N payments` depending on funding model
- `user 1-N notifications`

Logical model:

```text
Client -> Job -> Proposals -> Accepted Proposal -> Contract
Contract -> Sprint Plans -> Approved Plan -> Sprints
Sprint -> Reviews -> Approval
Sprint -> Payment -> Release
```


## 6. Workflow and Business Logic

### A. Job-based hiring flow

1. Client publishes a `job`.
2. Freelancers submit `proposals`.
3. Client reviews and accepts one proposal.
4. System creates a `contract`.
5. Job becomes linked to the contract.
6. Freelancer creates or updates a draft `sprint_plan`.
7. Freelancer submits the sprint plan.
8. Client approves or requests revision.
9. When approved, plan status becomes `approved`.
10. System materializes `sprints` from the approved plan.
11. Client funds sprint 1 or all sprints based on policy.
12. Sprint 1 becomes `ready`, then `in_progress`.
13. Freelancer submits sprint deliverables.
14. Client approves or requests changes.
15. If approved, payment for that sprint is released.
16. Next sprint unlocks.
17. Contract completes after the last sprint is approved and paid.

### B. Direct-hire flow

1. Client selects freelancer directly.
2. Platform creates a preliminary `contract` with `awaiting_sprint_plan`.
3. Freelancer submits a sprint plan.
4. The same review and execution flow applies.

### C. Revision flow

1. Sprint is `submitted`.
2. Client chooses `changes_requested`.
3. Sprint status returns to `changes_requested`.
4. Revision counter increments.
5. Freelancer resubmits.
6. If revision limit is exceeded, allow paid extra revision or dispute workflow.

### D. Cancellation flow

Possible cases:

- before contract creation: cancel the job or reject all proposals
- after contract creation but before funding: contract can be cancelled with no payout
- after funding but before sprint completion: refund logic depends on policy
- after partial completion: contract closes with partial payouts already released


## 7. State Machines

### Job states

Recommended `job.status`:

- `draft`
- `open`
- `under_review`
- `active`
- `completed`
- `cancelled`
- `archived`

Recommended `job.hiring_status`:

- `open`
- `shortlisting`
- `proposal_selected`
- `contract_created`
- `closed_without_hire`

### Contract states

- `awaiting_sprint_plan`
- `sprint_plan_under_review`
- `active`
- `paused`
- `in_dispute`
- `completed`
- `cancelled`

### Sprint plan states

- `draft`
- `submitted`
- `revision_requested`
- `approved`
- `rejected`
- `superseded`

### Sprint states

- `draft`
- `pending_funding`
- `ready`
- `in_progress`
- `submitted`
- `changes_requested`
- `approved`
- `payment_released`
- `late`
- `blocked`
- `disputed`
- `cancelled`

### Payment states

- `pending_funding`
- `held`
- `authorized`
- `released`
- `failed`
- `refunded`
- `partially_refunded`
- `cancelled`
- `disputed`


## 8. Business Rules

Recommended core rules:

1. A contract must have exactly one active approved sprint plan at a time.
2. Only the assigned freelancer can create or edit sprint plans.
3. The client cannot edit sprint content directly; they can only approve, reject, or request revision.
4. No sprint can start until the contract is active and the sprint funding policy is satisfied.
5. A sprint payment can only be released after sprint approval.
6. A sprint cannot be marked approved twice.
7. Only one current sprint should be executable in phase 1.
8. Once a new sprint plan version is approved, older submitted or draft plan versions become `superseded`.
9. Every approval or rejection must create an audit event.
10. Monetary amounts must be stored as integer minor units.
11. A `submitted` sprint must always produce a `sprint_reviews` record.
12. `contract.current_sprint_id` must point only to a sprint in `ready`, `in_progress`, `submitted`, or `changes_requested`.


## 9. API Design

Below is a REST design compatible with your current Flask route style.

### Contracts

#### `POST /api/contracts`

Create a contract after proposal acceptance or direct hire.

Request:

```json
{
  "job_id": "job_123",
  "proposal_id": "proposal_77",
  "client_id": "client_1",
  "freelancer_id": "freelancer_9",
  "workflow_type": "sprint_based",
  "currency": "USD"
}
```

Response:

```json
{
  "message": "Contract created",
  "contract": {
    "_id": "contract_42",
    "status": "awaiting_sprint_plan"
  }
}
```

#### `GET /api/contracts/<contract_id>`

Response:

```json
{
  "_id": "contract_42",
  "job_id": "job_123",
  "client_id": "client_1",
  "freelancer_id": "freelancer_9",
  "status": "active",
  "total_sprints_count": 3,
  "completed_sprints_count": 1,
  "current_sprint_id": "sprint_2"
}
```

### Sprint plans

#### `POST /api/contracts/<contract_id>/sprint-plans`

Create a draft sprint plan.

Request:

```json
{
  "summary": "Initial plan for the mobile MVP",
  "currency": "USD",
  "sprints": [
    {
      "title": "Authentication",
      "description": "Login, register, JWT",
      "duration_days": 5,
      "price_cents": 60000,
      "max_revisions": 2
    },
    {
      "title": "Database Design",
      "description": "Collections, indexes, validation",
      "duration_days": 4,
      "price_cents": 50000,
      "max_revisions": 2
    }
  ]
}
```

Response:

```json
{
  "message": "Sprint plan created",
  "sprint_plan": {
    "_id": "plan_11",
    "version": 1,
    "status": "draft"
  }
}
```

#### `POST /api/sprint-plans/<plan_id>/submit`

Response:

```json
{
  "message": "Sprint plan submitted",
  "status": "submitted"
}
```

#### `POST /api/sprint-plans/<plan_id>/review`

Request:

```json
{
  "action": "request_revision",
  "feedback": "Split frontend work into 2 sprints and clarify deliverables."
}
```

or

```json
{
  "action": "approve"
}
```

Response:

```json
{
  "message": "Sprint plan approved",
  "contract_status": "active",
  "created_sprints": 3
}
```

### Sprints

#### `GET /api/contracts/<contract_id>/sprints`

Response:

```json
{
  "items": [
    {
      "_id": "sprint_1",
      "sequence": 1,
      "title": "Authentication",
      "price_cents": 60000,
      "duration_days": 5,
      "status": "payment_released"
    },
    {
      "_id": "sprint_2",
      "sequence": 2,
      "title": "Database Design",
      "price_cents": 50000,
      "duration_days": 4,
      "status": "in_progress"
    }
  ]
}
```

#### `POST /api/sprints/<sprint_id>/start`

Normally internal or freelancer-triggered depending on policy.

#### `POST /api/sprints/<sprint_id>/submit`

Request:

```json
{
  "submission_note": "Endpoints and UI are ready on staging.",
  "attachments": [
    {
      "type": "link",
      "url": "https://staging.example.com"
    }
  ]
}
```

Response:

```json
{
  "message": "Sprint submitted for review",
  "status": "submitted"
}
```

#### `POST /api/sprints/<sprint_id>/review`

Request:

```json
{
  "action": "approve",
  "feedback": "Looks good."
}
```

or

```json
{
  "action": "request_changes",
  "feedback": "Please fix session timeout and add forgot password."
}
```

Response:

```json
{
  "message": "Sprint approved and payment released",
  "sprint_status": "payment_released",
  "payment_status": "released"
}
```

### Payments

#### `POST /api/sprints/<sprint_id>/fund`

Request:

```json
{
  "payment_method_id": "pm_123",
  "amount_cents": 60000
}
```

Response:

```json
{
  "message": "Sprint funded into escrow",
  "payment": {
    "_id": "payment_90",
    "status": "held",
    "amount_cents": 60000
  }
}
```

#### `GET /api/contracts/<contract_id>/payments`

Response:

```json
{
  "items": [
    {
      "_id": "payment_90",
      "sprint_id": "sprint_1",
      "amount_cents": 60000,
      "status": "released"
    }
  ],
  "summary": {
    "funded_cents": 260000,
    "released_cents": 60000,
    "remaining_cents": 200000
  }
}
```

### Notifications

#### `GET /api/notifications`

#### `POST /api/notifications/<notification_id>/read`


## 10. Backend Service Layer Recommendation

Your current backend shape is:

- `backend/app/routes/`
- `backend/app/models/`
- route-heavy request handling with direct Mongo access

Recommended new backend modules:

- `models/contract_model.py`
- `models/sprint_plan_model.py`
- `models/sprint_model.py`
- `models/payment_model.py`
- `models/notification_model.py`
- `models/activity_log_model.py`

- `services/contract_service.py`
- `services/sprint_plan_service.py`
- `services/sprint_service.py`
- `services/payment_service.py`
- `services/notification_service.py`
- `services/activity_log_service.py`

- `routes/contract_routes.py`
- `routes/sprint_plan_routes.py`
- `routes/sprint_routes.py`
- `routes/payment_routes.py`
- `routes/notification_routes.py`

Recommended service responsibilities:

### `contract_service.py`

- create contract from accepted proposal
- create direct-hire contract
- update cached sprint counters and current sprint pointer
- complete or cancel contract

### `sprint_plan_service.py`

- create draft plan
- update existing draft
- submit plan
- review plan
- approve plan and materialize executable sprints

### `sprint_service.py`

- list contract sprints
- start next eligible sprint
- submit sprint work
- review sprint submission
- unlock next sprint

### `payment_service.py`

- create payment record
- fund sprint
- release payment
- summarize funded and released totals

### `notification_service.py`

- create in-app notifications for workflow events

### `activity_log_service.py`

- append audit events for every important transition


## 11. Required Refactor in Existing Flow

Current behavior in [proposal_routes.py](/c:/Users/bouch/Desktop/ionic_project/backend/app/routes/proposal_routes.py) is:

- accepting a proposal immediately updates the job to `in_progress`
- the job also gets `assigned_freelancer`

Recommended new behavior:

1. Accept proposal.
2. Mark proposal as `accepted`.
3. Reject competing proposals for the same job.
4. Create `contract`.
5. Update job with:
   `selected_proposal_id`
   `selected_freelancer_id`
   `contract_id`
   `status = active`
   `hiring_status = contract_created`
6. Contract starts with `awaiting_sprint_plan`.
7. Write audit events and notifications.

The key change is conceptual:

- proposal acceptance completes hiring
- contract and sprints drive execution

Also update [job_model.py](/c:/Users/bouch/Desktop/ionic_project/backend/app/models/job_model.py) and [proposal_model.py](/c:/Users/bouch/Desktop/ionic_project/backend/app/models/proposal_model.py) so the schemas include the new fields and stop using the old `open | in_progress | closed` simplification.


## 12. Phase 1 Implementation Plan

This is the best rollout for the current Flask app.

### Phase 1 scope

- create `contracts`
- create `sprint_plans`
- create `sprints`
- add `activity_logs`
- adapt proposal acceptance flow
- support sprint plan draft, submit, review, and approval

### Phase 1 endpoints

- `POST /api/contracts`
- `GET /api/contracts/<contract_id>`
- `POST /api/contracts/<contract_id>/sprint-plans`
- `POST /api/sprint-plans/<plan_id>/submit`
- `POST /api/sprint-plans/<plan_id>/review`
- `GET /api/contracts/<contract_id>/sprints`

### Phase 1 success criteria

- accepting a proposal creates a contract instead of starting work directly
- a freelancer can create a draft plan with embedded sprint line items
- a client can request revision or approve the plan
- plan approval generates standalone sprint records
- only the first sprint becomes actionable
- the rest remain blocked by workflow state


## 13. Phase 2 and Later

### Phase 2

- sprint submission and validation
- payment ledger
- basic notifications

### Phase 3

- escrow integration
- revision limits
- due dates and lateness rules
- disputes and penalties

### Phase 4

- analytics
- auto reminders
- admin moderation tools
- change request workflows


## 14. UI and UX Recommendations

### Client side

Add a project detail screen with:

- project header
- contract status
- total budget approved
- amount funded
- amount released
- sprint progress timeline

Sprint list card content:

- sprint number and title
- status badge
- price
- due date
- revision count
- primary action button

Client actions per sprint:

- `Fund`
- `Review submission`
- `Approve`
- `Request changes`
- `Open dispute`

Best visualization:

- vertical timeline for mobile
- segmented status chips
- progress bar with `X / Y sprints completed`

### Freelancer side

Add a contract workspace with:

- sprint plan builder
- reorderable sprint list
- total price and duration calculator
- current sprint workspace
- submission panel with attachments and notes

Freelancer actions:

- create or edit plan draft
- submit plan
- revise after feedback
- start sprint
- submit sprint work
- view payment history

### UX rules

- never show raw database states directly; map them to clear labels
- always show the next action for the current user
- show deadlines and blocked reasons prominently
- keep monetary history visible per sprint


## 15. Roles and Permissions

### Freelancer permissions

Allowed:

- view assigned contracts
- create and edit own sprint plan drafts
- submit sprint plans
- revise rejected plans
- start available sprint
- submit sprint deliverables
- reply to revision requests
- view payment statuses

Not allowed:

- approve own sprint
- release payment
- edit client feedback
- modify approved sprint price without resubmitting plan

### Client permissions

Allowed:

- accept and reject proposals
- create direct-hire contracts
- review sprint plans
- approve or request sprint plan changes
- fund sprint escrow
- review sprint submissions
- approve sprint or request revision
- open dispute
- cancel under policy rules

Not allowed:

- edit freelancer plan directly
- mark sprint delivered on behalf of freelancer
- release unpaid sprint without a payment record

### Admin permissions

Recommended:

- override disputes
- view all contracts and payments
- force refund or partial release
- suspend users
- inspect audit trails


## 16. Notification Events

Trigger notifications for:

- proposal accepted
- contract created
- sprint plan submitted
- sprint plan revision requested
- sprint plan approved
- sprint funded
- sprint started
- sprint submitted
- sprint changes requested
- sprint approved
- payment released
- deadline approaching
- sprint overdue
- dispute opened

Channels:

- in-app mandatory
- email optional
- push optional


## 17. MongoDB Indexing Recommendations

### `jobs`

- `{ client_id: 1, created_at: -1 }`
- `{ status: 1, category: 1 }`
- `{ selected_freelancer_id: 1 }`

### `proposals`

- `{ job_id: 1, created_at: -1 }`
- `{ freelancer_id: 1, created_at: -1 }`
- unique partial intent on `{ job_id: 1, freelancer_id: 1 }`

### `contracts`

- `{ client_id: 1, status: 1, updated_at: -1 }`
- `{ freelancer_id: 1, status: 1, updated_at: -1 }`
- `{ job_id: 1 }`

### `sprint_plans`

- `{ contract_id: 1, version: -1 }`
- `{ contract_id: 1, status: 1 }`

### `sprints`

- `{ contract_id: 1, sequence: 1 }`
- `{ contract_id: 1, status: 1 }`
- `{ freelancer_id: 1, status: 1, due_date: 1 }`

### `payments`

- `{ contract_id: 1, created_at: -1 }`
- `{ sprint_id: 1 }`
- `{ client_id: 1, status: 1 }`
- `{ freelancer_id: 1, status: 1 }`

### `notifications`

- `{ user_id: 1, read: 1, created_at: -1 }`

### `activity_logs`

- `{ entity_type: 1, entity_id: 1, created_at: -1 }`
- `{ actor_id: 1, created_at: -1 }`


## 18. Best Practical Recommendation for This App

For your current stack, the cleanest path is:

1. Keep `jobs`, `proposals`, and `orders`.
2. Do not overload `orders` to represent sprint-based project execution.
3. Introduce `contracts` as the execution root for custom projects.
4. Version sprint proposals with `sprint_plans`, including embedded sprint line items.
5. Materialize approved plans into a dedicated `sprints` collection.
6. Use integer minor units for all monetary fields.
7. Add `activity_logs` and `notifications` from the beginning.

This architecture is realistic, scalable, and much closer to how serious freelance marketplaces separate:

- hiring
- contracting
- delivery
- validation
- payout

from one another.
