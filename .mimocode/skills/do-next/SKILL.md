---
name: do-next
description: Continue working through a task list by reading checkpoint, implementing next tasks, running tests, and committing
---

# Do Next Skill

Continue working through a task list systematically.

## When to Use
- User says "do next", "do next work", "do next task", "continue"
- Resuming work on a project with pending tasks
- Picking up where you left off in a session

## Workflow

### 1. Read Current State
```
- Read checkpoint.md for current intent and task tree
- Check task list for pending/in-progress items
- Review last commit and uncommitted changes
```

### 2. Identify Next Task
```
- Find first 🔄 (in-progress) or ⏳ (pending) task
- If no tasks exist, check §2 Next concrete action in checkpoint
- Read relevant code files mentioned in checkpoint
```

### 3. Implement
```
- Read the files that need modification
- Make focused edits (one task at a time)
- Run relevant tests after each change
```

### 4. Validate
```
- Run project-specific test command:
  - Python: `.venv/bin/python -m pytest tests/ -q --tb=line`
  - TypeScript: `npx tsc --noEmit`
  - Rust: `cargo test`
- Fix any failures before proceeding
```

### 5. Commit
```
- Stage changes: git add -A
- Review: git diff --cached --stat
- Commit with descriptive message
```

### 6. Update State
```
- Mark completed tasks with ✅
- Update checkpoint §5 Current work
- Note any new discoveries in §7
```

## Tips
- Work on one task at a time
- Run tests after each significant change
- Commit after completing each task or logical unit
- If blocked, note the blocker and move to next task