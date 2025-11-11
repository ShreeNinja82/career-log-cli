# career-log-cli

> Generate professional career logs from git commits - works completely offline with optional AI enhancement. Support for PR integration as well.

## Installation

### Global Installation

Install the CLI globally to use it from anywhere:

```bash
npm install -g career-log-cli
```

After installation, use the `career-log` command:

```bash
career-log --repo ./your-repo
```

### Use without Installation (npx)

Run directly without installing (great for one-time use):

```bash
npx career-log-cli --repo ./your-repo
```

## Requirements

- **Node.js** >= 18.0.0
- A git repository to analyze

## Quick Start

### Basic Usage (100% Offline, Private)

```bash
career-log --repo ./your-repo --output career-log.json
```

This runs completely offline with zero external API calls. All processing happens locally on your machine.

### Enterprise Mode (Guaranteed Privacy)

For maximum privacy assurance, use enterprise mode:

```bash
career-log --repo ./your-repo --enterprise
```

Enterprise mode:
- ✅ Disables all external API calls (including AI features)
- ✅ Skips PR parsing (no GitHub/GitLab API access)
- ✅ Ensures 100% data-local processing
- ✅ Perfect for sensitive repositories

### With Optional AI Enhancement

**OpenAI (requires API key):**
```bash
career-log --repo ./your-repo --api-key YOUR_OPENAI_API_KEY
```

**Local Ollama (runs on your machine):**
```bash
career-log --repo ./your-repo --use-local-llm
```

**Privacy Note:** When using AI features:
- OpenAI: Your commit data is sent to OpenAI's servers
- Ollama: All processing happens locally on your machine (recommended for privacy)

## Why Use PR Parsing & AI Enhancement?

### PR Parsing Benefits

**Problem:** Many commit messages are generic or unhelpful:
- "fix"
- "update"
- "merge branch"
- "WIP"

**Solution:** PR parsing extracts meaningful information from Pull Requests:

**Without PR Parsing:**
```
Achievement: "fix" (from commit message)
```

**With PR Parsing:**
```
Achievement: "Implement user authentication with OAuth2 and JWT tokens" (from PR title)
```

**Benefits:**
- ✅ **Better achievements** - PR titles are usually more descriptive than commit messages
- ✅ **Context-rich** - PR descriptions provide additional context about the work
- ✅ **Professional output** - More suitable for resumes and career logs
- ✅ **Automatic fallback** - Only uses PR info when commit messages are unhelpful

**Example:**
```bash
# Commit message: "fix #123"
# PR #123 title: "Optimize database queries reducing response time by 40%"
# Result: Achievement uses PR title instead of "fix"
```

### AI Enhancement Benefits

**Problem:** Pattern-based generation is good, but can be generic:
- "Implemented API feature affecting 5 modules"
- "Fixed Database bug"
- "Made Backend improvements"

**Solution:** AI enhancement generates more nuanced, professional achievements:

**Without AI:**
```
Achievement: "Implemented API feature affecting 5 modules"
Confidence: 0.75
```

**With AI (OpenAI/Ollama):**
```
Achievement: "Designed and implemented RESTful API endpoints with rate limiting and authentication, improving system scalability"
Confidence: 0.95
```

**Benefits:**
- ✅ **More professional** - AI generates resume-ready statements
- ✅ **Context-aware** - Understands the full scope of changes
- ✅ **Nuanced language** - Uses professional terminology
- ✅ **Higher confidence** - Better quality output (0.95 vs 0.75)
- ✅ **Local option** - Ollama runs entirely on your machine

**When to Use:**
- Creating professional career logs for resumes
- Generating detailed achievement reports
- When pattern-based output feels too generic
- For important career milestones

**Privacy-Conscious Option:**
Use `--use-local-llm` with Ollama for AI enhancement without sending data to external servers:
```bash
career-log --repo ./repo --use-local-llm
# All AI processing happens on your machine
```

## Examples

### Generate career log from current directory

```bash
career-log --repo . --output my-career-log.json
```

### Filter by date

```bash
career-log --repo ./my-project --since 2024-01-01
```

### Filter by author (useful for multi-contributor repos)

```bash
career-log --repo ./my-project --author "your-email@example.com"
```

### Different output formats

**Markdown:**
```bash
career-log --repo ./my-project --format md --output career-log.md
```

**JSON (default):**
```bash
career-log --repo ./my-project --format json --output career-log.json
```

### With PR parsing (enhances achievement quality)

```bash
career-log --repo ./my-project --github-token YOUR_GITHUB_TOKEN
```

**Value:** PR parsing extracts descriptive titles from Pull Requests when commit messages are generic, resulting in more professional achievements.

**Privacy Note:** PR parsing requires API tokens and makes external API calls. Use `--skip-pr` to disable.

### Skip PR parsing (privacy-focused)

```bash
career-log --repo ./my-project --skip-pr
```

### Limit commits and skip low-impact

```bash
career-log --repo ./my-project --limit 50 --skip-low-impact
```

### Get help

```bash
career-log --help
```

## Options

| Option | Short | Description | Privacy Impact | Default |
|--------|-------|-------------|----------------|---------|
| `--repo <path>` | `-r` | Git repository path | None (local only) | Current directory |
| `--output <file>` | `-o` | Output file path | None (local only) | `career-log.json` |
| `--limit <number>` | `-l` | Maximum commits to process | None (local only) | `100` |
| `--since <date>` | `-s` | Only commits since date (ISO format) | None (local only) | None |
| `--author <email\|name>` | `-a` | Filter by author | None (local only) | None |
| `--format <json\|md>` | | Output format | None (local only) | `json` |
| `--enterprise` | | Enterprise mode (no external APIs) | ✅ 100% private | `false` |
| `--skip-pr` | | Skip PR parsing (no API calls) | ✅ No external calls | `false` |
| `--skip-low-impact` | | Randomly skip 50% of low-impact commits | None (local only) | `false` |
| `--api-key <key>` | | OpenAI API key (enables AI) | ⚠️ Sends data to OpenAI | None |
| `--use-local-llm` | | Use local Ollama instance | ✅ Local processing | `false` |
| `--ollama-model <model>` | | Ollama model name | ✅ Local processing | `llama3.2` |
| `--github-token <token>` | | GitHub API token for PR details | ⚠️ Calls GitHub API | None |
| `--gitlab-token <token>` | | GitLab API token for PR details | ⚠️ Calls GitLab API | None |
| `--gitlab-url <url>` | | GitLab instance URL | ⚠️ Calls GitLab API | `https://gitlab.com` |
| `--confidence-threshold <0-1>` | | Minimum confidence for pattern matching | None (local only) | `0.5` |
| `--verbose` | `-v` | Detailed logging | None (local only) | `false` |
| `--help` | `-h` | Show help | None | - |
| `--version` | `-V` | Show version | None | - |

## Privacy & Security

### Data Handling

- **Local Processing**: All git parsing and analysis happens on your machine
- **No Telemetry**: Zero tracking, analytics, or data collection
- **No Network Calls by Default**: Works completely offline
- **Optional External Services**: AI and PR features are opt-in only

### Privacy Levels

1. **Maximum Privacy (Enterprise Mode)**
   ```bash
   career-log --repo ./repo --enterprise
   ```
   - Zero external API calls
   - 100% local processing
   - No data transmission

2. **High Privacy (Default)**
   ```bash
   career-log --repo ./repo
   ```
   - Local git parsing
   - Pattern-based achievement generation
   - No external API calls
   - PR parsing disabled by default

3. **Moderate Privacy (PR Parsing)**
   ```bash
   career-log --repo ./repo --github-token TOKEN
   ```
   - Local git parsing
   - Calls GitHub/GitLab API for PR details only
   - No AI features

4. **Lower Privacy (AI Enhancement)**
   ```bash
   career-log --repo ./repo --api-key KEY
   ```
   - Sends commit data to OpenAI
   - Consider using `--use-local-llm` instead for local AI

### Recommended Privacy Settings

**For maximum privacy:**
```bash
career-log --repo ./repo --enterprise --skip-pr
```

**For privacy with local AI:**
```bash
career-log --repo ./repo --use-local-llm --skip-pr
```

**For privacy with PR details:**
```bash
career-log --repo ./repo --github-token TOKEN --skip-low-impact
```

## Features

- ✅ **Works completely offline** - Pattern-based generation, no external APIs required
- ✅ **Enterprise-compliant** - Zero data transmission with `--enterprise` flag
- ✅ **Optional AI enhancement** - OpenAI or local Ollama support
- ✅ **Impact analysis** - Automatically detects high/medium/low impact commits
- ✅ **Multiple output formats** - JSON, Markdown, CSV

## License

MIT
