
# Tour Tracker — Codex Instructions

## 1. Project Context

Tour Tracker is a lightweight travel checklist web application.

Before making changes, read:

1. `PRODUCT.md` — Product requirements and acceptance criteria.
2. `ARCHITECTURE.md` — Approved architecture and technical decisions.
3. `ROADMAP.md` — Implementation milestones and completion criteria.

These documents are the source of truth.

Do not introduce new features, technologies, or architectural changes without approval.

## 2. Development Workflow

Work on one milestone at a time, following `ROADMAP.md`.

For every milestone:

1. Read its requirements and acceptance criteria.
2. Inspect the existing codebase.
3. Create a short implementation plan.
4. Implement the milestone.
5. Add or update relevant tests.
6. Run verification checks.
7. Request an independent AI code review.
8. Fix blocking review findings.
9. Run verification checks again.
10. Present a milestone completion report.
11. Stop and wait for explicit user approval.

**Never automatically start the next milestone.**

If a requirement is ambiguous and materially affects implementation, ask before proceeding.

## 3. Engineering Principles

- Prefer the simplest solution satisfying the requirements.
- Keep the application runnable throughout development.
- Follow the approved technology stack.
- Use TypeScript with strict type checking.
- Organize application code by feature.
- Keep business logic separate from UI components.
- Reuse existing components and utilities.
- Avoid premature abstractions.
- Handle loading, empty, and error states.
- Do not introduce unnecessary dependencies.

Avoid microservices, message queues, background workers, and other infrastructure not required by the architecture.

## 4. Code Conventions

- Use functional React components and hooks.
- Prefer named exports for reusable modules.
- Use descriptive variable and function names.
- Keep components focused on one responsibility.
- Avoid `any` unless justified.
- Validate external input.
- Use consistent formatting.
- Do not leave unused code or commented-out implementations.
- Do not add placeholder functionality that appears operational.

Use Tailwind CSS and shadcn/ui for styling.

## 5. Database and Security

- Manage database changes through version-controlled Supabase migrations.
- Enforce authorization using PostgreSQL Row Level Security.
- Never rely solely on frontend authorization checks.
- Never expose Supabase service-role credentials in frontend code.
- Do not commit secrets or real credentials.
- Validate imported data before persistence.
- Preserve existing user data during migrations and synchronization.
- Test authorization rules for guests, regular users, and the admin.

Refer to `ARCHITECTURE.md` for the database schema and access policies.

## 6. Testing Requirements

Use the testing tools defined in `ARCHITECTURE.md`.

Before requesting review, run all applicable checks:

- TypeScript type checking
- ESLint
- Unit tests
- Production build
- Relevant integration or end-to-end tests

Do not claim a test passed unless it was executed successfully.

If a test cannot run, explain why.

Tests should focus on observable behavior and important edge cases rather than implementation details.

## 7. Independent AI Review

Every milestone requires an independent review before user approval.

### Reviewer Responsibilities

The reviewer must:

- Inspect the actual code changes.
- Compare implementation against milestone acceptance criteria.
- Check compliance with `PRODUCT.md` and `ARCHITECTURE.md`.
- Identify correctness and security issues.
- Examine important edge cases.
- Evaluate test coverage.
- Identify unnecessary complexity.

The reviewer should not rely solely on the implementation agent's summary.

### Review Execution

If the Codex environment supports subagents:

- Delegate review to a separate reviewer agent.
- Give the reviewer read-only responsibilities.
- Provide the milestone requirements and relevant code changes.
- Request a structured findings report.

If subagents are unavailable:

- Use a separate independent review session or supported code-review mechanism.
- Do not falsely report that an independent review occurred.

### Review Severity

**Critical:** Security vulnerabilities, data loss, or fundamentally broken functionality.

**High:** Major bugs, failed acceptance criteria, or significant architectural violations.

**Medium:** Nonblocking defects, weak error handling, or maintainability concerns.

**Low:** Minor improvements or cosmetic issues.

Critical and high findings must be resolved before requesting user approval.

After fixes, rerun affected tests and request another review of the changes when necessary.

## 8. Milestone Completion Report

At the end of each milestone, provide:

### Milestone: [Name]

**Implemented**
- Brief summary of completed features.

**Verification**
- Commands executed and their results.

**Independent Review**
- Reviewer used.
- Findings by severity.
- Fixes applied.

**Known Limitations**
- Remaining issues or constraints.

**How to Test**
- Commands to run the application.
- Steps to verify the delivered functionality.

**Status**
- Awaiting user approval.

Do not proceed until the user explicitly approves.

## 9. Git Conventions

- Keep changes focused on the active milestone.
- Use meaningful commit messages.
- Do not commit secrets, generated build artifacts, or dependencies.
- Avoid unrelated refactoring.
- Do not rewrite published Git history without approval.
- Do not create or merge pull requests unless requested.
- Do not push changes to remote repositories without approval.

Suggested commit format:

`feat: implement guest checklist`

`fix: preserve visited order after unchecking`

`test: add checklist merge tests`

## 10. Development Commands

Use the project's package scripts:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
```

Ensure the required scripts exist as they become relevant during development.

Use the package manager and lockfile already established in the repository.

Do not switch package managers without approval.

## 11. Scope Control

Do not implement future features merely because they are mentioned in project documents.

Specifically, do not add:

- AI-generated travel content
- Map integrations
- Image upload infrastructure
- Offline support
- Multi-admin management
- Custom backend services

unless explicitly approved.

If an alternative approach would materially improve the project, explain its trade-offs and request approval before implementing it.

## 12. Final Rule

**Implement one milestone, verify it, obtain independent review, resolve blocking issues, and stop for user approval.**

Successful code generation is not equivalent to milestone completion.