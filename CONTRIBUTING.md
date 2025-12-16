# Contributing to cuin

Thank you for your interest in contributing to cuin! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: See `.node-version` or `engines` field in `package.json`
- **pnpm**: See `packageManager` field in `package.json`
- **Rust**: See `edition` in `packages/analyzer/Cargo.toml`
  - Required components: `rustfmt`, `clippy`

### Getting Started

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/<your-username>/cuin.git
cd cuin
```

2. Install dependencies:

```bash
pnpm install
```

3. Build all packages:

```bash
pnpm build
```

## Project Structure

This project uses a pnpm workspace monorepo with two packages:

| Package | Description | Technology |
|---------|-------------|------------|
| `packages/analyzer` | Core analysis engine | Rust + NAPI-RS |
| `packages/cuin` | CLI + Web interface | TypeScript + SolidJS |

## Development Commands

### Root Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev:ui` | Start UI development server |
| `pnpm dev:cli` | Run CLI in development mode |
| `pnpm test` | Run all tests |
| `pnpm check` | Lint and format check |
| `pnpm fix` | Auto-fix lint and format issues |
| `pnpm typecheck` | TypeScript type check |

### Rust-specific Commands (in `packages/analyzer`)

| Command | Description |
|---------|-------------|
| `pnpm check` | Run clippy and rustfmt check |
| `pnpm fix` | Auto-fix with clippy and rustfmt |
| `cargo test` | Run Rust tests |

## Coding Standards

### TypeScript / JavaScript

- We use [Biome](https://biomejs.dev/) with [Ultracite](https://github.com/haydenbleasel/ultracite) presets for linting and formatting
- Run `pnpm check` to verify your code before committing
- Run `pnpm fix` to auto-fix issues

### Rust

- We use `clippy` for linting and `rustfmt` for formatting
- Run `pnpm check` in `packages/analyzer` to verify
- Run `pnpm fix` in `packages/analyzer` to auto-fix

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `build` | Build system or external dependencies |
| `chore` | Other changes that don't modify src or test files |
| `ci` | CI/CD configuration changes |
| `style` | Code style changes (formatting, etc.) |

### Examples

```
feat: add component usage filtering
fix(ui): resolve prop display issue
docs: update README with installation instructions
feat(analyzer): support TypeScript path aliases
```

## Pull Request Process

1. **Fork and branch**: Create a feature branch from `main`

```bash
git checkout -b feat/your-feature-name
```

2. **Make changes**: Implement your feature or fix

3. **Test locally**: Ensure all tests and checks pass

```bash
pnpm check
pnpm typecheck
pnpm test
```

4. **Commit**: Write clear commit messages following the convention

5. **Push and create PR**: Push your branch and open a pull request

6. **CI checks**: Wait for the automated checks to pass
   - TypeScript workflow: Biome check, type check, tests
   - Rust workflow: clippy, rustfmt, cargo test

7. **Review**: Address any feedback from maintainers

8. **Merge**: Once approved, your PR will be merged

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for version management and releases.

### For Contributors

When making changes that should be released:

1. Create a changeset:

```bash
pnpm changeset
```

2. Select the packages affected (`@ikuma-t/cuin` and/or `@ikuma-t/cuin-analyzer`)
3. Choose the version bump type (patch/minor/major)
4. Write a summary of the changes
5. Commit the generated `.changeset/*.md` file with your PR

### For Maintainers

The release process is automated:

1. When PRs with changesets are merged to `main`, a "Release" PR is automatically created
2. The Release PR accumulates all pending changesets and updates versions/changelogs
3. When the Release PR is merged:
   - Packages are published to npm
   - A GitHub Release is created with auto-generated release notes
   - A git tag is created (e.g., `v0.0.16`)

If a release fails, you can re-run the workflow from GitHub Actions (no need to create a new tag).

## Reporting Issues

### Bug Reports

When reporting a bug, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, etc.)

### Feature Requests

When requesting a feature, please include:

- A clear description of the problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## License

By contributing to cuin, you agree that your contributions will be licensed under the [MIT License](LICENSE).
