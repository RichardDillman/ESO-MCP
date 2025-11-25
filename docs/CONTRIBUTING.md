# Contributing to ESO-MCP

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ESO-MCP.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit: `git commit -m "feat: your feature description"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

## 📝 Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Run `pnpm lint` before committing
- Run `pnpm type-check` to verify types
- Format with Prettier: `pnpm format`

## 🧪 Testing

```bash
# Run type checking
pnpm type-check

# Test specific functionality
pnpm tsx scripts/test-*.ts
```

## 📚 Adding New Data

### Adding a New Scraper

1. Create scraper in `src/scrapers/your-scraper.ts`
2. Extend Prisma schema in `prisma/schema.prisma`
3. Run migration: `pnpm db:migrate`
4. Add MCP tool in `src/index.ts`
5. Document in relevant docs/ file

### Adding New MCP Tools

Tools should follow this pattern:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'your_tool',
      description: 'Clear description of what it does',
      inputSchema: {
        type: 'object',
        properties: {
          param: { type: 'string', description: 'Parameter description' }
        },
        required: ['param']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'your_tool') {
    // Implementation
  }
});
```

## 🗄️ Database Changes

1. Modify `prisma/schema.prisma`
2. Create migration: `pnpm db:migrate`
3. Update TypeScript types if needed
4. Test with `pnpm db:studio`

## 📖 Documentation

- Update README.md for user-facing changes
- Add/update docs/ for detailed guides
- Include examples in code comments
- Document MCP tools in README

## 🐛 Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)
- Relevant logs or screenshots

## 💡 Feature Requests

Include:
- Use case and motivation
- Proposed solution
- Alternatives considered
- Impact on existing features

## 📋 Commit Message Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add heroism potion to consumables database
fix: correct scribing validation for arcanist skills
docs: update ESO Logs integration guide
```

## 🔐 Security

Never commit:
- `.env` files
- API credentials
- Personal information
- Database files

These are already in `.gitignore` but double-check!

## 📬 Questions?

- Open an issue for discussion
- Email: rdillman@gmail.com
- Check existing issues and PRs first

## 🙏 Thank You!

Every contribution helps make ESO-MCP better for the community!
