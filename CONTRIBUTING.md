# Contributing to Sendlib

First off, thank you for considering contributing to Sendlib! We want to make the contribution process as simple and effective as possible.

To keep our codebase clean and our history traceable, we follow a strict "Issue First" workflow. Please read through the following guidelines before starting any work.

## The Workflow

### 1. Open an Issue
Before writing any code, **you must open an issue**. 
- Go to the Issues tab and select the appropriate template (Bug Report, Feature Request, or Chore).
- Fill out the template completely.
- **Wait for approval:** A maintainer must approve the issue (usually via a comment or an `approved` label) before you start working on it. This ensures nobody wastes time writing code for a feature or fix that hasn't been agreed upon.

### 2. Branch Out
Once your issue is approved, create a branch for your work. Use a descriptive name that relates to your issue.

### 3. Open a Pull Request
When your code is ready, open a Pull Request (PR).
- Use the provided PR template.
- **Link the issue:** You must reference the approved issue in the PR description (e.g., `Closes #123`). 
- **Checklist:** Ensure you have completed all items on the PR checklist.

### 4. Continuous Integration (CI)
Every PR triggers our automated CI pipeline via GitHub Actions.
- Your code must pass `pnpm lint`.
- Your code must pass `pnpm build`.
- If the CI fails, the PR cannot be merged. Please check the logs and push fixes to your branch.

### 5. Review and Merge
All PRs require a review from the repository owner (`@samueltuoyo15`). Once your PR is approved and the CI pipeline is green, it will be merged into the `main` branch.

## Local Development

1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Copy `.env.example` to `.env.local` and fill in the required variables (see the README for instructions on obtaining the Sendlib API credentials).
4. Run `pnpm dev` to start the development server.

Happy building!
