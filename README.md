# ScriptStash

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | Download                             | Architecture          |
| -------- | ------------------------------------ | --------------------- |
| Windows  | `ScriptStash-1.0.0-x64-Setup.exe`    | x64 (Intel/AMD)       |
| Windows  | `ScriptStash-1.0.0-arm64-Setup.exe`  | ARM64                 |
| Windows  | `.zip` portable                      | x64 / ARM64           |
| macOS    | `ScriptStash-darwin-x64-1.0.0.zip`   | Intel (x64)           |
| macOS    | `ScriptStash-darwin-arm64-1.0.0.zip` | Apple Silicon (ARM64) |
| Linux    | `ScriptStash-1.0.0-x86_64.AppImage`  | x64 (Universal)       |
| Linux    | `ScriptStash-1.0.0-arm64.AppImage`   | ARM64 (Universal)     |
| Android  | `.apk` (experimental)                | ARM64                 |

### Building from Source

```bash
# Clone the repository
git clone https://github.com/mememan2010gaming/ScriptStash.git
cd scriptstash

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for your platform
npm run make
```

## Requirements

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- For video downloads: **yt-dlp** (automatically downloaded on first use)

## Development

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Available Scripts

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Start the app in development mode           |
| `npm run start`         | Alias for dev                               |
| `npm run lint`          | Run ESLint to check code quality            |
| `npm run lint:fix`      | Automatically fix linting issues            |
| `npm run format`        | Format code with Prettier                   |
| `npm run test`          | Run the test suite                          |
| `npm run test:watch`    | Run tests in watch mode                     |
| `npm run test:coverage` | Generate test coverage report               |
| `npm run make`          | Build distributable packages                |
| `npm run package`       | Package the app without creating installers |

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Configuration

ScriptStash stores its configuration locally using encrypted storage. The configuration includes:

- Authentication cookies (encrypted)
- Download path preferences
- Download history
- Application settings

Configuration is stored in:

- **Windows**: `%APPDATA%/scriptstash/`
- **macOS**: `~/Library/Application Support/scriptstash/`
- **Linux**: `~/.config/scriptstash/`

## Contributing

We welcome contributions! Please read the following guidelines:

1. **Fork the repository** - All contributions must come through pull requests to the main repository
2. **Create a branch** - Use descriptive branch names (`feature/new-feature`, `fix/bug-description`)
3. **Follow code style** - Run `npm run lint` and `npm run format` before committing
4. **Write tests** - Add tests for new functionality
5. **Submit a PR** - Include a clear description of your changes

### Code Style

- We use [ESLint](https://eslint.org/) with Standard config
- Code is formatted with [Prettier](https://prettier.io/)
- Use meaningful variable and function names
- Add comments for complex logic

### Pull Request Process

1. Ensure all tests pass (`npm test`)
2. Update documentation if needed
3. Request review from maintainers
4. Squash commits before merging

## License

This project is licensed under a custom license. See the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Contact the maintainers privately
3. Allow time for a fix before disclosure

## Acknowledgments

- [Electron](https://www.electronjs.org/) - Framework
- [Electron Forge](https://www.electronforge.io/) - Build tooling
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Video downloads
- All our amazing contributors!

---
