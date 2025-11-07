# career-log-cli

> Generate professional career logs from git commits - works completely offline with optional AI enhancement

## Installation

npm install -g career-log-cli Or use with npx (no installation required):

npx career-log-cli --repo ./careerlog## Quick Start

# Basic usage (offline, pattern-based)
career-log --repo ./careerlog --output career-log.json

# With AI enhancement
career-log --repo ./careerlog --api-key $OPENAI_API_KEY

# Enterprise mode (guaranteed offline)
career-log --repo ./careerlog --enterprise## Features

- ✅ **Works completely offline** - Pattern-based generation, no external APIs required
- ✅ **Enterprise-compliant** - Zero data transmission with `--enterprise` flag
- ✅ **Optional AI enhancement** - OpenAI or local Ollama support
- ✅ **Impact analysis** - Automatically detects high/medium/low impact commits
- ✅ **Multiple output formats** - JSON, Markdown, CSV

## License

MIT
