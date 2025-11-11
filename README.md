# Career Log CLI

Generate professional career achievements from your git commits with zero privacy concerns.

**Local-first • Enterprise-safe • AI-optional • 100% Offline**

---

## What It Does

Career Log CLI analyzes your git repository and generates polished, resume-ready achievement statements from your commit history. Perfect for:

- **Building your portfolio** with documented contributions
- **Performance reviews** with concrete accomplishments
- **Resume/LinkedIn updates** with professional language
- **Career tracking** across multiple projects
- **Teams documenting** collective contributions

### Example

```bash
$ career-log generate --repo ~/my-project

Extracting commits from repository...
Analyzing impact signals...
Generating achievements...

✓ Generated 42 achievements
✓ High-impact: 8 achievements
✓ Medium-impact: 18 achievements
✓ Saved to career-log.json
```

**Input:** Messy commit like `"fix stuff"`

**Output:** Professional achievement like `"Fixed critical authentication bug affecting all users, implemented JWT token validation and improved security posture"`

---

### Zero External Data Transmission (By Default)

Career Log CLI **never** sends your code outside your computer **unless you explicitly opt-in**.

#### Default Behavior: Completely Offline
```bash
career-log generate --repo ~/my-project
```

- ✅ Runs entirely locally
- ✅ No internet connection required
- ✅ No data leaves your device
- ✅ Proprietary/confidential code stays private
- ✅ Enterprise-compliant (no security reviews needed)

**How it works:**
- Analyzes git history on your machine
- Extracts commit metadata (author, date, files changed, diff)
- Generates achievements using pattern matching
- Outputs JSON file to your disk
- No external API calls

#### Optional: AI Enhancement (Opt-In Only)

```bash
# Only if you provide an API key
career-log generate --repo ~/my-project --api-key sk-xxx...
```

When you provide an API key, Career Log CLI sends **only the diff content and commit message** to OpenAI for polishing. You remain in full control:

- ✅ You choose if AI is used
- ✅ You provide your own API key
- ✅ You pay directly to OpenAI
- ✅ You see what data is sent before it's transmitted
- ✅ You can opt-out at any time

**What is NOT sent:**
- Repository name or path
- Author names or email addresses
- Timestamps or dates
- Repository URL or origin
- Any metadata outside the diff and message

#### Enterprise Mode: Guaranteed Offline

```bash
career-log generate --repo ~/my-project --enterprise
```

Enterprise mode ensures:
- ✅ Zero external API calls, period
- ✅ No internet connection attempted
- ✅ Pattern-based generation only (no AI)
- ✅ Suitable for air-gapped environments
- ✅ Compliant with strictest security policies

---

## 🛡️ Data Security & Compliance

### What We Don't Collect

Career Log CLI is a **local-only tool**. We don't:

- ❌ Collect any user data
- ❌ Store commits or code anywhere
- ❌ Track usage or analytics
- ❌ Connect to external databases
- ❌ Require sign-ups or accounts
- ❌ Send telemetry

### What Stays On Your Machine

All data processing happens on your device:

- Local git repository analysis
- Diff parsing
- Pattern matching
- Achievement generation
- JSON file output

Your repository, commits, and code never leave your computer (unless you explicitly opt into AI enhancement and provide your own API key).

### Enterprise & Compliance

Career Log CLI is suitable for:

- **HIPAA** (healthcare) – No data transmission
- **PCI-DSS** (finance) – Local-only processing
- **SOC 2** (regulated industries) – No external dependencies
- **GDPR** (EU) – User has full control, no data storage
- **FedRAMP** (government) – Air-gapped compatible
- **NIST** (cybersecurity) – No third-party data sharing
- **Company security policies** – No external calls, no approvals needed

---

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

## FAQ

### Q: Does my code get sent anywhere?
**A:** No. By default, Career Log CLI runs entirely offline. Your code never leaves your computer. If you use `--api-key`, only the diff and commit message are sent to OpenAI—no author names, timestamps, or metadata.

### Q: Can I use this in an enterprise with strict security policies?
**A:** Yes. Use `--enterprise` flag for guaranteed offline operation. No internet connection is attempted, no external APIs are called. Suitable for HIPAA, PCI-DSS, FedRAMP, and air-gapped environments.

### Q: How much does it cost?
**A:** Career Log CLI is free and open-source. If you use `--api-key` for AI enhancement, you pay directly to OpenAI (~$0.01-0.05 per repo analysis). No fees to us.

### Q: Does this work with GitHub Enterprise Server?
**A:** Yes. Career Log CLI analyzes local git history, so it works with any git repository—GitHub, GitLab, Bitbucket, self-hosted, or on-premise.

### Q: Can I use this without git?
**A:** Not currently. Career Log CLI analyzes git commit history. Future versions may support other sources (email, chat, manual input).

### Q: What if my commit messages are really bad?
**A:** Career Log CLI analyzes the actual code diff, not just the commit message. It extracts impact from:
- File types and sizes
- Code patterns (caching, security fixes, testing)
- Critical infrastructure changes

Poor commit messages are fine—the code tells the story.

### Q: Can I edit achievements after generation?
**A:** Yes. The JSON output is editable. You can manually refine achievements or export them in various formats for resumes and profiles.

### Q: Which platforms can I export to?
**A:** The JSON output can be used anywhere—pasted into resumes, uploaded to LinkedIn, shared with managers, or imported into career platforms and portfolio tools.

---


## License

MIT License – See LICENSE file for details

## Support

- **GitHub Issues:** Report bugs and request features
- **Discussions:** Questions and community help

---

## Privacy Policy

**Career Log CLI Privacy Policy**

Career Log CLI respects your privacy. This is our commitment:

### What We Collect

**Locally:** Nothing. All processing happens on your device.

**If you use `--api-key`:** We don't collect anything. OpenAI handles your data per their privacy policy.

### What We Don't Do

- ❌ We don't store your code
- ❌ We don't store your commits
- ❌ We don't track usage
- ❌ We don't collect analytics
- ❌ We don't share data with third parties
- ❌ We don't require accounts or sign-ups

### Your Data

Your repository and code remain your property. Career Log CLI is a tool that runs on your machine. We have no access to it.

### Questions?

If you have privacy concerns, please open an issue on GitHub.
