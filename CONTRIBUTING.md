# Contributing to ScriptStash

First off, thank you for considering contributing to ScriptStash!

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed and expected**
- **Include your environment details** (OS, Node.js version, app version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** and ensure they follow our code style
4. **Add tests** if applicable
5. **Run the test suite**: `npm test`
6. **Run the linter**: `npm run lint`
7. **Commit your changes** with a clear message
8. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/mememan2010gaming/ScriptStash.git
cd scriptstash

# Add upstream remote
git remote add upstream https://github.com/mememan2010gaming/ScriptStash.git

# Install dependencies
npm install

# Start development
npm run dev
```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript Style

- We use ESLint with Standard config
- Run `npm run lint:fix` to auto-fix issues
- Use `const` by default, `let` when reassignment is needed
- Never use `var`
- Use meaningful variable names
- Add JSDoc comments for functions

### Code Example

```javascript
/**
 * Downloads a file with progress tracking
 * @param {string} url - The URL to download from
 * @param {string} filename - The destination filename
 * @returns {Promise<void>}
 */
async function downloadFile(url, filename) {
  const response = await fetch(url)
  // ... implementation
}
```

## Project Structure

```
main/           # Electron main process
  ├── ipc/      # IPC handlers (communication with renderer)
  ├── services/ # Business logic and external services
  └── store/    # Data persistence (electron-store)

renderer/       # Frontend (HTML, CSS, JS)
  ├── scripts/  # Frontend JavaScript
  └── styles/   # CSS styles

__tests__/      # Jest test files
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- __tests__/api.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

Thank you for your contribution! 🎉
