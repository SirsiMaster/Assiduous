# Git Hooks for Assiduous

This directory contains Git hooks to enforce code quality and commit standards for the Assiduous project.

## Available Hooks

### commit-msg
Validates commit messages against the Conventional Commits specification.

**Features:**
- Enforces conventional commit format: `type(scope): subject`
- Validates commit types (feat, fix, docs, etc.)
- Checks subject line length (max 50 characters)
- Provides helpful error messages and examples
- Warns about capitalization and punctuation issues

## Installation

### Option 1: Manual Installation (Recommended for individual developers)

1. Copy the hook to your local Git hooks directory:
```bash
cp scripts/hooks/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg
```

2. Configure Git to use the commit message template:
```bash
git config commit.template .gitmessage
```

### Option 2: Automated Installation

Run the installation script from the project root:
```bash
./scripts/hooks/install.sh
```

### Option 3: Global Installation (For all your projects)

1. Set up a global Git hooks directory:
```bash
mkdir -p ~/.git-hooks
cp scripts/hooks/commit-msg ~/.git-hooks/
chmod +x ~/.git-hooks/commit-msg
```

2. Configure Git to use the global hooks:
```bash
git config --global core.hooksPath ~/.git-hooks
```

3. Configure the commit template globally:
```bash
git config --global commit.template /path/to/assiduous/.gitmessage
```

## Uninstallation

To remove the hooks:

```bash
rm .git/hooks/commit-msg
git config --unset commit.template
```

For global configuration:
```bash
git config --global --unset core.hooksPath
git config --global --unset commit.template
```

## Commit Message Format

All commit messages must follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes
- **build**: Build system or dependency changes
- **revert**: Reverting a previous commit

### Examples

Good commit messages:
```
feat(api): add property valuation endpoint
fix(auth): resolve token expiration issue
docs: update API documentation
refactor(search): optimize database queries
test(api): add unit tests for valuation service
```

Bad commit messages:
```
Fixed bug           # Missing type
feat: updated code  # Vague, past tense
FEAT: Add feature   # Wrong case
feat: add feature.  # Ends with period
```

## Bypassing Hooks (Emergency Only)

If you absolutely need to bypass the hook validation:

```bash
git commit --no-verify -m "your message"
```

**Warning:** This should only be used in emergencies. All commits should follow the convention.

## Troubleshooting

### Hook not executing
1. Check file permissions: `ls -la .git/hooks/commit-msg`
2. Ensure the file is executable: `chmod +x .git/hooks/commit-msg`

### Hook conflicts with GUI clients
Some Git GUI clients may not respect local hooks. Configure your client to use the command-line Git or check its hook settings.

### Windows compatibility
On Windows, you may need to:
1. Use Git Bash or WSL
2. Ensure line endings are LF, not CRLF
3. Check that bash is available in your PATH

## Contributing

To modify or add new hooks:
1. Edit the hook files in `scripts/hooks/`
2. Test thoroughly on multiple platforms
3. Update this README with usage instructions
4. Submit a pull request with your changes

## Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Assiduous Contributing Guide](../../.github/CONTRIBUTING.md)
