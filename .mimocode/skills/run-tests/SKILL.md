---
name: run-tests
description: Run project tests with automatic detection of test framework and appropriate commands
---

# Run Tests Skill

Automatically detect and run project tests.

## When to Use
- After making code changes
- Before committing changes
- When user asks to run tests
- Validating fixes or new features

## Auto-Detection

### Python Projects
Look for:
- `pyproject.toml` with pytest
- `setup.py` or `setup.cfg`
- `tests/` directory
- `.venv/` virtual environment

Command:
```bash
.venv/bin/python -m pytest tests/ -q --tb=line
```

### TypeScript/JavaScript Projects
Look for:
- `package.json` with test script
- `tsconfig.json`
- `jest.config.*` or `vitest.config.*`

Command:
```bash
npx tsc --noEmit  # Type check first
npm test          # Then run tests
```

### Rust Projects
Look for:
- `Cargo.toml`
- `src/` directory

Command:
```bash
cargo test
```

### Go Projects
Look for:
- `go.mod`
- `*_test.go` files

Command:
```bash
go test ./...
```

## Workflow

### 1. Detect Project Type
```
- Check for language-specific config files
- Identify test framework
- Find test directory
```

### 2. Run Type Check (if applicable)
```
- TypeScript: npx tsc --noEmit
- Python: mypy or pyright (if configured)
```

### 3. Run Tests
```
- Use detected test command
- Capture output
- Check for failures
```

### 4. Analyze Results
```
- Report pass/fail counts
- Show failed test details
- Suggest fixes if possible
```

## Tips
- Run type checks before tests
- Use `-x` flag to stop on first failure (pytest)
- Use `--timeout` to prevent hanging tests
- Ignore problematic tests with `--ignore` if needed