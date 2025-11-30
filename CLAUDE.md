# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cuin is a Component Usage Inspector tool for React projects that analyzes and visualizes component usage patterns.

### Architecture

This project uses a pnpm workspace monorepo structure with three packages:

- **packages/analyzer**: Core analysis engine written in Rust (NAPI-RS)
  - Uses OXC (Oxidation Compiler) to parse JSX/TSX files
  - Analyzes component usage locations, props, and import sources
  - Provides Node.js bindings via NAPI-RS

- **packages/cli**: TypeScript CLI tool
  - Executes analysis using the analyzer package
  - Starts a development server (h3) to serve the UI
  - Uses `gunshi` framework for command-line argument parsing

- **packages/ui**: Web interface built with SolidJS
  - Uses SolidStart (Vinxi) for SPA/SSR rendering
  - Visualizes analysis results
  - Displays component usage locations and props statistics

### Key Technologies

- **Rust**: OXC, NAPI-RS, rayon (parallel processing)
- **TypeScript**: tsdown (build), tsx (development)
- **SolidJS**: SolidStart, Vinxi, @ark-ui/solid
- **Build Tools**: Turbo (monorepo build), Biome + Ultracite (lint/format)

## Development Commands

### Build

```bash
# Build all packages
pnpm build

# Build analyzer only (Rust)
cd packages/analyzer && pnpm build

# Build CLI only
cd packages/cli && pnpm build
```

### Development

```bash
# Start UI development server
pnpm dev:ui

# Run CLI in development mode
pnpm dev:cli
```

### Testing & Linting

```bash
# Run all tests
pnpm test

# Run UI tests only
cd packages/ui && pnpm test

# Run UI tests with UI
cd packages/ui && pnpm test:ui

# Run analyzer (Rust) tests
cd packages/analyzer && pnpm test

# Type checking
pnpm typecheck

# Lint and format check
pnpm check

# Lint and format auto-fix
pnpm fix

# Analyzer (Rust) lint and format
cd packages/analyzer && pnpm check
cd packages/analyzer && pnpm fix
```

### Running Single Tests

```bash
# Vitest (UI)
cd packages/ui && pnpm test -- <test-file-pattern>

# Cargo (analyzer)
cd packages/analyzer && cargo test <test-name>
```

## Important Code Structure Points

### Analysis Flow

1. **CLI** (`packages/cli/src/commands/dev.ts`): User specifies path and runs command
2. **Analyzer** (`packages/analyzer/src/lib.rs`): Calls `analyze()` function via NAPI
3. **Service** (`packages/analyzer/src/service.rs`): Walks project tree to collect files
4. **Parser** (`packages/analyzer/src/parser.rs`): Parses JSX elements and imports using OXC
5. **Resolver** (`packages/analyzer/src/resolver.rs`): Resolves import paths and retrieves package info
6. **Analyze** (`packages/analyzer/src/analyze.rs`): Links component definitions to usage locations, computes props statistics
7. **Result** (`packages/analyzer/src/result.rs`): Serializes to JSON and returns
8. **UI**: Fetches results via CLI server and visualizes them

### Dependency Management

- `pnpm-workspace.yaml` uses `catalog` to centrally manage common dependency versions
- Separated by package type: `catalog:analyzer`, `catalog:cli`, `catalog:ui`, `catalog:build`, `catalog:test`
- Turbo dependencies defined in `turbo.json` (`@ikuma-t/cuin#build` depends on `@cuin/ui#build`)

### Rust Build Process

- `packages/analyzer` uses NAPI-RS to generate Node.js bindings
- Build artifacts output to `bindings/` directory
- CLI depends on `packages/analyzer` as the `cuin-analyzer` package

### SolidJS Routing

- File-based routing located in `packages/ui/src/routes` directory
- `app.tsx` uses `DataProvider` and `HeaderProvider` for global state management

## Important Notes

- Node.js version: `^20.19.0 || >=22.12.0` (managed in `.node-version`)
- Package manager: `pnpm@10.18.3`
- Rust Edition: `2024` (see Cargo.toml)
- When building analyzer, be aware of native module builds for `@parcel/watcher` and `esbuild`
