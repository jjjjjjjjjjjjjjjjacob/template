# .agent Directory

This directory contains AI assistant rules and patterns for the template repository.

## Structure

```
.agent/
├── README.md                      # This file
├── rules.md                       # Main AI assistant rules
├── rules/                         # Specific rule sets
│   ├── backend-patterns.mdc       # Backend development rules
│   ├── command-execution.mdc      # Safe command execution
│   ├── convex.mdc                 # Convex-specific patterns
│   ├── frontend-patterns.mdc      # Frontend development rules
│   ├── no-linter-fixes.mdc        # Linter handling
│   ├── no-skipped-tests.mdc       # Test requirements
│   ├── no-watch-processes.mdc     # Process management
│   ├── reference-scripts.mdc      # Script usage
│   ├── testing-guidelines.mdc     # Testing patterns
│   ├── typescript.mdc             # TypeScript rules
│   ├── use-bun.mdc               # Package manager
│   └── workspace-separation.mdc   # Monorepo structure
└── docs/
    └── implementation-patterns.md  # Proven implementation patterns
```

## Purpose

The `.agent/` directory provides:

1. **Rules**: Strict guidelines that override default AI behavior
2. **Patterns**: Proven implementation patterns from this codebase
3. **Context**: Repository-specific conventions and architecture

## Usage

### For AI Assistants

1. **Always read `rules.md` first** - Contains mandatory overrides
2. **Check relevant rule files** in `rules/` for workspace-specific guidance
3. **Reference patterns** in `docs/` for implementation examples
4. **Follow the rules exactly** - They override all default behaviors

### For Developers

1. Keep rules concise and actionable
2. Include code examples in patterns
3. Update when discovering new patterns
4. Don't duplicate information
