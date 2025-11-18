# Publishing Guide

This guide explains how to publish new versions of `@openconductor/cli` to npm.

## Setup (One-time)

### 1. Create an npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to **Access Tokens** → **Generate New Token**
3. Select **Automation** (for CI/CD use)
4. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/epicmotionSD/openconductor
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

## Publishing Methods

### Method 1: Using Git Tags (Recommended)

This is the easiest way to publish a new version:

```bash
# 1. Navigate to CLI package
cd packages/cli

# 2. Update version in package.json
npm version patch  # 1.0.2 → 1.0.3 (bug fixes)
# OR
npm version minor  # 1.0.2 → 1.1.0 (new features)
# OR
npm version major  # 1.0.2 → 2.0.0 (breaking changes)

# 3. Push the tag (this triggers the workflow)
git push --follow-tags

# 4. GitHub Actions will automatically publish to npm!
```

### Method 2: Using GitHub Releases

1. Go to https://github.com/epicmotionSD/openconductor/releases
2. Click **Draft a new release**
3. Create a new tag (e.g., `v1.0.3`)
4. Add release notes
5. Click **Publish release**
6. GitHub Actions will automatically publish to npm!

### Method 3: Manual Trigger

1. Go to https://github.com/epicmotionSD/openconductor/actions
2. Select **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**
5. GitHub Actions will publish if the version is new!

### Method 4: Manual Publishing (Fallback)

If GitHub Actions is not working, you can publish manually:

```bash
# 1. Make sure you're logged in
npm whoami

# 2. Navigate to CLI package
cd packages/cli

# 3. Update version
npm version patch

# 4. Publish
npm publish

# 5. Push changes
git push --follow-tags
```

## Workflow Features

The automated workflow includes:

✅ **Duplicate Prevention**: Checks if version already exists on npm
✅ **Automatic Testing**: Runs tests before publishing
✅ **Multiple Triggers**: Tags, releases, or manual dispatch
✅ **Error Handling**: Skips publishing if version exists

## Monitoring

- **GitHub Actions**: Check workflow runs at https://github.com/epicmotionSD/openconductor/actions
- **npm Package**: View published versions at https://www.npmjs.com/package/@openconductor/cli
- **Download Stats**: Monitor at https://npm-stat.com/charts.html?package=@openconductor/cli

## Troubleshooting

### "Version already exists" Error

The version in `package.json` already exists on npm. Update it:

```bash
cd packages/cli
npm version patch  # or minor/major
git push --follow-tags
```

### "NPM_TOKEN not found" Error

The GitHub secret is missing. Follow the setup steps above to add it.

### Workflow Not Triggering

Make sure you're pushing tags:

```bash
git push --follow-tags
```

Or manually trigger from GitHub Actions UI.

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.x): Bug fixes, no breaking changes
- **MINOR** (1.x.0): New features, backward compatible
- **MAJOR** (x.0.0): Breaking changes

## Pre-release Versions

For testing releases:

```bash
# Create a beta version
npm version prerelease --preid=beta  # 1.0.2 → 1.0.3-beta.0

# Publish with beta tag
npm publish --tag beta

# Users install with: npm install @openconductor/cli@beta
```

## Changelog

After publishing, update the changelog:

```bash
# Generate changelog from git commits
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Or manually update CHANGELOG.md with changes
```
