---
inclusion: always
---

# Development Guidelines

## Custom Commands (Slash Commands)

Custom commands are defined in `.agents/commands/`. Access them via command palette (`Ctrl-O` in CLI, `Cmd/Alt-Shift-A` in VS Code).

- **Markdown files** (`.md`): Contents inserted into prompt input
- **Executable files** (with `#!` shebang): Output inserted into prompt input

Available commands:

| Command | Description |
|---------|-------------|
| `/addtask` | Add a new task |
| `/analyze` | Analyze code or files |
| `/bugfinder` | Find bugs in codebase |
| `/cat` | Display file contents |
| `/code` | Write or generate code |
| `/commit` | Create git commits |
| `/copycode` | Copy code patterns |
| `/deepcode` | Deep code analysis |
| `/deepdive` | Deep dive into topics |
| `/deepthink` | Deep thinking/reasoning |
| `/docs` | Generate documentation |
| `/exec` | Execute commands |
| `/gitlabreview` | GitLab code review |
| `/gitmerge` | Git merge operations |
| `/guide` | Generate guides |
| `/how` | Explain how things work |
| `/plan` | Create plans |
| `/pr-review` | PR code review with categorized feedback |
| `/plancode` | Plan code implementation |
| `/prisma` | Prisma database operations |
| `/recheck` | Re-check/verify work |
| `/research` | Research topics |
| `/review` | Code review |
| `/search` | Search codebase |
| `/searchlib` | Search libraries |
| `/setup` | Project setup |
| `/sophia` | Sophia workflow |
| `/story` | Story/narrative tasks |
| `/taskcode` | Task-based coding |
| `/uidesign` | UI design tasks |

## Common Development Commands

**Backend:**
- `cd backend && npm run dev` - Development with --watch flag
- `cd backend && npm start` - Production server

**Frontend:**
- `cd frontend && npm run dev` - Vite dev server (port 3000)
- `cd frontend && npm run build` - Production build

## Code Style Conventions

### Backend (Node.js + Express)
- ES6 modules with `.js` extension in imports
- Async/await pattern throughout
- camelCase for functions and variables

### Frontend (React + Vite)
- Functional components with hooks
- PascalCase for component names: `ConfigPanel.jsx`
- Tailwind CSS for styling
