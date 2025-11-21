# Contributing to CC Mate

Thank you for your interest in contributing to CC Mate! This guide will help you get started with development, building, and contributing to the project.

## 🛠️ Development Setup

### Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** 18+ with **pnpm** (required package manager)
- **Rust** 1.70+ and **Cargo**
- **Tauri CLI** dependencies for your platform

#### Installing pnpm

```bash
# If you don't have pnpm installed
npm install -g pnpm
```

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/djyde/ccmate.git
cd ccmate
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start development server**

```bash
pnpm tauri dev
```

The application will open in a new window with hot-reload enabled for both frontend and backend changes.

## 🚀 Build Commands

### Development

```bash
# Check TypeScript for errors (recommended before commits)
pnpm tsc --noEmit

# Start development server with hot reload
pnpm tauri dev

# Start frontend only (useful for UI development)
pnpm dev
```

### Code Quality

```bash
# Format code with Biome
pnpm exec biome check .

# Format code (Biome)
pnpm exec biome format .

# TypeScript type checking
pnpm tsc --noEmit
```

## 📋 Development Guidelines

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Follow the code style guidelines
- Add comments for complex logic
- Update documentation if needed
- Test your changes thoroughly

### 3. Quality Checks

```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Format code
pnpm exec biome format .

# Run any existing tests
# (test commands will be added here when available)
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
# or
git commit -m "fix: resolve your bug description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a pull request with a clear description
- Link any relevant issues
- Wait for code review

## 🐛 Bug Reports

When reporting bugs, please include:

- **OS and version**
- **CC Mate version**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Relevant logs or screenshots**

## 💡 Feature Requests

When requesting features:

- **Use case**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?
- **Additional context**: Any other relevant information

## 🤝 Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Documentation**: Check existing docs first

## 📋 Code Review Process

All contributions go through code review to ensure:

- Code quality and maintainability
- Adherence to project guidelines
- Proper testing and documentation
- Security considerations

Check the [GitHub Issues](https://github.com/djyde/ccmate/issues) for specific items that need help.

## 🙏 Recognition

Contributors are recognized in:

- Release notes for significant contributions
- README contributors section (for substantial contributions)
- GitHub contributor statistics

Thank you for contributing to CC Mate! 🎉

---

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (AGPL v3).
