---
name: understand-codebase
description: Systematically understand a codebase by analyzing structure, architecture, dependencies, and creating a knowledge base
---

# Understand Codebase Skill

Systematically analyze and understand a codebase.

## When to Use
- User says "understand codebase", "read codebase", "analyze codebase"
- Starting work on an unfamiliar project
- Need to create documentation or onboarding materials

## Workflow

### 1. Project Structure
```
- List top-level files and directories
- Identify project type (language, framework)
- Find configuration files (package.json, pyproject.toml, Cargo.toml, etc.)
- Check for README, docs, CONTRIBUTING files
```

### 2. Entry Points
```
- Find main entry points (main.py, index.ts, main.rs, etc.)
- Identify API routes/endpoints
- Check for CLI commands
- Look for test entry points
```

### 3. Architecture Analysis
```
- Map module/package structure
- Identify core components
- Find dependency injection or configuration patterns
- Check for design patterns (MVC, repository, etc.)
```

### 4. Key Files
```
- Configuration files
- Database models/schemas
- Core business logic
- API handlers/controllers
- Utility functions
```

### 5. Dependencies
```
- External dependencies (from package files)
- Internal module dependencies
- Environment variables required
- Third-party integrations
```

### 6. Create Knowledge Base
```
- Document architecture in checkpoint §7
- Note key patterns and conventions
- List important file paths
- Identify potential issues or areas for improvement
```

## Output Format
Document findings in checkpoint.md §7 Discovered knowledge:
- Architecture overview
- Key file paths with purpose
- Patterns and conventions used
- Dependencies and integrations
- Potential issues or improvements