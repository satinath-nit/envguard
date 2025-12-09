# Contributing to EnvGuard

Thank you for your interest in contributing to EnvGuard! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/envguard.git`
3. Install dependencies: `npm install`
4. Create a branch for your changes: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- [Task](https://taskfile.dev/) (optional, for automation)

### Installation

```bash
npm install
```

### Available Commands

Using npm:
```bash
npm run build      # Build the package
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

Using Task (if installed):
```bash
task setup         # Initial setup
task check         # Run all checks
task ci            # Full CI pipeline
```

## Making Changes

### Code Style

- We use TypeScript with strict mode enabled
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- No `any` types - use proper typing

### Commit Messages

Follow the conventional commits specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:
```
feat: add semver validator
fix: handle empty string in bool validator
docs: update README with new examples
```

### Testing

- Write tests for all new features
- Ensure all existing tests pass
- Aim for high test coverage
- Test edge cases and error conditions

Run tests:
```bash
npm run test
npm run test:coverage
```

### Type Safety

- Ensure TypeScript compiles without errors
- Use strict typing throughout
- Export types for public APIs

Run type checking:
```bash
npm run typecheck
```

## Pull Request Process

1. Ensure all tests pass locally
2. Update documentation if needed
3. Add your changes to the CHANGELOG (if applicable)
4. Create a pull request with a clear description
5. Link any related issues
6. Wait for code review

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] All tests pass
- [ ] Commit messages follow conventions

## Adding New Validators

When adding a new validator:

1. Add the validator function in `src/validators.ts`
2. Export it from `src/index.ts`
3. Add comprehensive tests in `tests/validators.test.ts`
4. Update the README with usage examples
5. Add TypeScript types if needed

Example structure for a new validator:

```typescript
export function myValidator(options: MyValidatorOptions = {}): Validator<MyType> {
  return createValidator('my-type', options, (value, key) => {
    // Validation logic here
    if (!isValid(value)) {
      throw new EnvValidationError(key, 'error message', value);
    }
    return transformedValue;
  });
}
```

## Reporting Issues

When reporting issues, please include:

- Node.js version
- npm version
- Operating system
- Minimal reproduction code
- Expected vs actual behavior
- Error messages (if any)

## Feature Requests

Feature requests are welcome! Please:

- Check existing issues first
- Describe the use case
- Explain why existing features don't meet your needs
- Provide examples if possible

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
