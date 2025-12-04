# Contributing to Antone

## Database Changes

- All schema changes must be reviewed by the Architect.
- New queries must include `EXPLAIN ANALYZE` output in the PR description.
- Run `pnpm validate:schema` before submitting.

## Schema Review Checklist

- [ ] No DROP COLUMN commands (deprecate instead).
- [ ] All new columns are nullable or have defaults.
- [ ] Indexes named consistently.
- [ ] Foreign keys have proper ON DELETE behavior.
- [ ] Migration SQL reviewed manually.

## Secret Detection with Gitleaks

This project uses [gitleaks](https://github.com/gitleaks/gitleaks) to prevent accidentally committing secrets like API keys and tokens.

### Installation

```bash
# macOS
brew install gitleaks

# Linux (via package manager or binary)
# Download from: https://github.com/gitleaks/gitleaks/releases

# Or via Go
go install github.com/gitleaks/gitleaks/v8@latest
```

### Running Gitleaks

```bash
# Scan the entire repository
gitleaks detect --source . -v

# Scan staged changes only (recommended before commits)
gitleaks protect --staged -v

# Scan with custom config
gitleaks detect --source . --config .gitleaks.toml -v
```

### Testing the Configuration

To verify gitleaks is correctly detecting secrets:

1. Create a test file with fake credentials:
```bash
cat > /tmp/test-secrets.txt << 'EOF'
TWITTER_API_KEY=abcdefghijklmnopqrstuvwxy
TWITTER_ACCESS_TOKEN=1234567890-abcdefghijklmnopqrstuvwxyzABCDEFGHIJK
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAA%BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
EOF
```

2. Run gitleaks on the test file:
```bash
gitleaks detect --source /tmp --config .gitleaks.toml -v
```

3. Expected output should show detected secrets:
```
Finding:     TWITTER_API_KEY=abcdefghijklmnopqrstuvwxy
Secret:      abcdefghijklmnopqrstuvwxy
RuleID:      twitter-api-key
...
```

4. Clean up the test file:
```bash
rm /tmp/test-secrets.txt
```

### Pre-commit Hook (Recommended)

Add gitleaks to your pre-commit workflow:

```bash
# In .husky/pre-commit (if using Husky)
gitleaks protect --staged -v
```

### Handling False Positives

If gitleaks flags a legitimate file (like test fixtures), add it to `.gitleaksignore`:

```
# .gitleaksignore
test/fixtures/mock-credentials.ts
```

### Custom Rules

Our `.gitleaks.toml` includes Twitter-specific rules:
- `twitter-api-key` - Detects Twitter API keys
- `twitter-access-token` - Detects Twitter access tokens
- `twitter-bearer-token` - Detects Twitter bearer tokens

To add custom rules for other services, edit `.gitleaks.toml`.
