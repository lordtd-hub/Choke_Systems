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

## Project Notes

- Architecture and delegation rules live in [AGENTS.md](AGENTS.md).
- Implementation architecture is summarized in [ARCHITECTURE.md](ARCHITECTURE.md).
- The implementation roadmap lives in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
- Source-of-truth sample specs are:
  - `calculus1_course.yaml`
  - `calculus1_weekly_plan.yaml`
