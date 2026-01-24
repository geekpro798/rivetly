[![GitHub release (latest by date)](https://img.shields.io/github/v/release/geekpro798/rivetly?color=orange&logo=github)](https://github.com/geekpro798/rivetly/releases)
🚀 Rivetly: Professional AI Rules Generator
Stop fighting with LLM hallucinations. Rivetly helps you generate structured, high-quality .cursorrules, .windsurfrules, and .traerules using our unique Soulful Prompt strategy.

🌟 Why Rivetly?
Most AI rules are just static lists. Rivetly implements a 3-D Prompting Strategy to maximize LLM performance:

Semantic Weighting: Uses [!] and [CRITICAL] markers to ensure LLMs (like Claude 3.5 or GPT-4o) prioritize your core architectural principles.

Structural Formatting: Wraps rules in XML-style tags (<rules>, <constraints>) for significantly better instruction following.

Negative Constraints: Every rule includes a [NEGATIVE: ...] instruction to define what the AI must not do, drastically reducing code hallucinations.

🛠️ Key Features
Multi-Platform Support: Tailored output for Cursor, Windsurf, and Trae.

Dynamic Headers: Automatically injects metadata (Mode, Active Rules, Date) into every generated rule file for better version tracking and debugging.

One-Click Sync: Directly write rules to your project root—no manual copying required.

Mode-Based Presets: Toggle between Feature, Test, and Refactor modes to shift the AI's focus instantly.

Smart Continuity (Roadmap):

Local: Support for CONTEXT.md progress tracking.

Cloud (Incoming): Planned Cloudflare R2 integration for cross-device context roaming.

📦 Installation (Beta)
Since we are currently in the Beta phase, you can install Rivetly via the .vsix file:

Download rivetly-latest.vsix from the Releases page.

In VS Code, go to the Extensions view (Ctrl+Shift+X).

Click the ... (Views and More Actions) and select Install from VSIX....

Find the Rivetly icon in your Activity Bar and start generating.

💡 How it Works (The Engine)
Rivetly doesn't just concatenate strings. Our Adapter Engine performs real-time transformation of your settings into a professional senior architect role-play:

Markdown

# Example Output for Windsurf:
# Mode: REFACTOR | Rules: 4 | Date: 2026-01-18
<memories>
  <instruction_set>
    # ROLE: Full-stack Senior Architect [!] 
    <constraints>
      - Strict TypeScript: ... [NEGATIVE: Do not use 'any']
    </constraints>
  </instruction_set>
</memories>
🤝 Contributing & Feedback
Rivetly is built by developers, for developers.

Found a Bug? Open an Issue.

Have a Pro-Prompt? Submit a PR to src/config/config.json to share your best AI constraints.
