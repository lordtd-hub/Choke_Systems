# Choke_Systems

Contract-first learning platform prototype for course planning, weekly module generation, SBRA activities, runtime tracking, assessment, analytics, and CQI reporting.

## First-Time Setup

1. Clone the repo:

```bash
git clone https://github.com/lordtd-hub/Choke_Systems.git
cd Choke_Systems
```

2. Install Node.js.

Recommended Node version:

```bash
cat .nvmrc
```

If you use `nvm`:

```bash
nvm install
nvm use
```

If you do not use `nvm`, install a compatible Node version and then continue.

3. Install dependencies:

```bash
npm install
```

4. Verify the machine is ready:

```bash
npm run verify:machine
```

## Daily Start Workflow

Before starting work on any machine:

```bash
git pull origin main
npm install
git status
```

## Daily End Workflow

If any file changed:

```bash
git status
git add .
git commit -m "describe your change"
git push origin main
```

## Multi-Machine Rule

- Before working on a machine, pull the latest saved repo state first.
- After updating files, save the work back to the repo before stopping, switching machines, or handing off to another person or agent.
- Never continue work on an outdated local copy if a newer repo state may exist elsewhere.

## Core Verification Commands

```bash
npm run validate:contracts
npm run test:bundle
npm run test:analytics
npm run test:cqi-report
```

## One-Command Demo Output

If you want one simple product-style output for the sample course, run:

```bash
npm run run:demo:week3
```

That command will:

- generate the week 3 bundle
- simulate learner progress and scoring
- save runtime, assessment, analytics, and CQI artifacts
- write human-readable output files under `outputs/`

Main generated files:

- `outputs/catalog-dashboard-data.json`
- `outputs/catalog-dashboard.html`
- `outputs/SMAC001/course-dashboard-data.json`
- `outputs/SMAC001/course-dashboard.html`
- `outputs/SMAC001/SMAC001_w03/week-03/dashboard-data.json`
- `outputs/SMAC001/SMAC001_w03/week-03/dashboard.html`
- `outputs/SMAC001/SMAC001_w03/week-03/week-bundle.json`
- `outputs/SMAC001/SMAC001_w03/week-03/week-bundle.html`
- `outputs/SMAC001/SMAC001_w03/week-03/cqi-report.md`

If you want a fuller course build in one run, use:

```bash
npm run run:demo:course
```

That command builds weeks `1,2,3` for the sample course and refreshes:

- `outputs/catalog-dashboard-data.json`
- `outputs/catalog-dashboard.html`
- `outputs/SMAC001/course-dashboard-data.json`
- `outputs/SMAC001/course-dashboard.html`
- `outputs/SMAC001/course-workflow-summary.json`
- `outputs/SMAC001/course-workflow-summary.md`
- `outputs/SMAC001/build-history.json`
- `outputs/build-control-data.json`
- `outputs/build-control.html`

## Project Notes

- Architecture and delegation rules live in [AGENTS.md](AGENTS.md).
- Implementation architecture is summarized in [ARCHITECTURE.md](ARCHITECTURE.md).
- Current plan progress is summarized in [PROJECT_STATUS.md](PROJECT_STATUS.md).
- The implementation roadmap lives in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
- Source-of-truth sample specs are:
  - `calculus1_course.yaml`
  - `calculus1_weekly_plan.yaml`
