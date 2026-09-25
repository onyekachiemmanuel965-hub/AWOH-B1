# Stage Gate Process

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Purpose:** Lightweight gates so stages are “done” only when acceptance criteria pass — not merely because code or docs exist.

---

## Rules

1. Work only on the **authorized current stage**.
2. A stage is **not complete** until acceptance criteria are met and the completion checklist is satisfied.
3. The human project owner reviews the stage review report and decides: **Approve / Conditional / Reject**.
4. The next stage must not start until the prior stage is approved (or explicitly authorized with written conditions).
5. Security-critical shortcuts that weaken payment verification, delivery authority, or RBAC are **not allowed**.

---

## Required fields for every stage

Each stage gate document / review must cover:

| Field | Meaning |
|-------|---------|
| Objectives | What the stage must achieve |
| Scope | In / out of scope |
| Requirements | Linked requirements to satisfy |
| Dependencies | Prior stages and external inputs |
| Security considerations | Security work specific to this stage |
| Acceptance criteria | Testable pass/fail items |
| Testing expectations | What must be verified |
| Risks | Known risks entering/leaving the stage |
| Completion checklist | Concrete done checklist |
| Review status | Pending / Approved / Conditional / Rejected |

---

## Review statuses

| Status | Meaning |
|--------|---------|
| `PENDING_REVIEW` | Stage work submitted; owner not yet decided |
| `APPROVED` | Next stage may begin |
| `CONDITIONAL` | Next stage may begin only under documented conditions |
| `REJECTED` | Rework required before reconsideration |

---

## Stage 01 gate (this stage)

### Objectives

- Establish consistent project naming and charter
- Document architecture (modular monolith), stack, flows, domain model, API modules
- Document security, payments, delivery, RBAC, UI direction
- Create docs structure and stage roadmap/gates
- Produce Stage 01 review report for human approval

### Scope

**In:** Documentation only; minimal repo scaffolding for docs  
**Out:** Storefront, auth, checkout, payments, delivery logic, admin app, migrations, production deploy, Stage 02 implementation

### Requirements

See Stage 01 deliverables in the project brief and `STAGE_01_REVIEW.md`.

### Dependencies

- Project owner availability for review
- Client business facts remain largely placeholder until provided

### Security considerations

- Document security architecture without implementing it yet
- Capture customer/internal data boundary for delivery and payments
- Ensure docs do not contain real secrets

### Acceptance criteria

See `STAGE_01_REVIEW.md` §10.

### Testing expectations

- Documentation consistency review (naming, stages, no contradictions)
- No implementation leakage into later stages

### Risks

- Missing client business data delaying later stages
- Pressure to over-engineer despite deadline
- Confusion with AO Solid Base branding if not controlled

### Completion checklist

- [x] Docs folder structure created
- [x] Master project document created
- [x] Exact 10-stage roadmap documented
- [x] Stage gate process documented
- [x] Business / requirements / RBAC documented
- [x] Architecture + flows documented
- [x] Domain model documented (no migrations) — Category → Subcategory → Product
- [x] API modules documented (no API build)
- [x] Security / payments / delivery / UX docs created
- [x] Delivery + payment gate rule documented
- [x] Registered checkout MVP recommendation documented
- [x] Blocking vs configuration questions separated
- [x] Duplicate docs consolidated (stack + NFRs)
- [x] Testing + deployment notes (lightweight) created
- [x] Placeholders documented (no fabricated business facts)
- [x] Stage 01 review report created / updated after correction pass
- [x] Human project owner review decision recorded

### Review status

**APPROVED** (human project owner — Stage 02 authorized)

---

## Template for Stages 02–10

Copy this block into each future stage review file:

```markdown
# STAGE_XX_REVIEW

## Objectives
## Scope
## Requirements
## Dependencies
## Security considerations
## Acceptance criteria
## Testing expectations
## Risks
## Completion checklist
## Review status
```

Do not create Stage 02+ review files until that stage is authorized.
