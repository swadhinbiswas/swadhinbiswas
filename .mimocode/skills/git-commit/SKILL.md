---
name: git-commit
description: Systematic git workflow for staging, reviewing, and committing changes
---

# Git Commit Skill

Systematic git workflow for committing changes.

## When to Use
- After completing a task or feature
- Before switching to a new task
- When user asks to commit changes

## Workflow

### 1. Check Status
```bash
git status
```

### 2. Stage Changes
```bash
git add -A
```

### 3. Review Staged Changes
```bash
git diff --cached --stat
```
This shows a summary of files changed and line counts.

### 4. Review Detailed Diff (Optional)
```bash
git diff --cached
```
Review the actual changes to ensure correctness.

### 5. Write Commit Message
Follow conventional commit format:
```
<type>: <description>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Adding tests
- `chore`: Maintenance

### 6. Commit
```bash
git commit -m "type: description"
```

### 7. Verify
```bash
git log --oneline -1
git status
```

## Tips
- Commit often, in small logical units
- Write clear, concise commit messages
- Review diffs before committing
- Don't commit secrets or credentials
- Use `git diff --cached --stat` for quick overview