I will implement the "Soulful Prompt" fine-tuning strategy by modifying the configuration and the adapter engine.

### 1. Update Configuration (`src/config/config.json`)
I will add a `negative_prompt` field to the global constraints to provide clear "Don'ts" for the AI.
- **concise**: "Avoid verbose explanations or repeating the user's prompt."
- **strict_ts**: "Do not use 'any' type or implicit 'any'."
- **functional**: "Avoid imperative loops (for/while) and side effects."
- **no_deps**: "Do not suggest installing new packages for trivial tasks."
- **zh_response**: "Do not translate standard technical terms (e.g. React, Component, Hook)."

### 2. Refactor Adapter Engine (`src/utils/adapter-engine.js`)
I will completely rewrite `generateFinalPrompt` to support the new 3-dimensional strategy:

**A. Semantic Weighting**
- Use `# ROLE: ... [!]` for the role definition.
- Use `## PRIMARY GOAL: ...` for the mode goal.
- Add `[CRITICAL]` markers for high-priority sections.

**B. Structural Formatting**
- Encapsulate rules and constraints within XML-style tags for better LLM parsing:
  ```xml
  <rules>
    ...
  </rules>
  <constraints>
    ...
  </constraints>
  ```

**C. Negative Constraints Integration**
- When a constraint is selected, I will combine its `prompt` (positive) and `negative_prompt` (negative) into a single, strong instruction.
- Example output: `- Concise Mode: Be extremely concise. [NEGATIVE: Avoid verbose explanations...]`

### 3. Verification
- I will execute `npm run sync` to rebuild the project.
- I will verify the generated prompt format by using the "Export" feature in the UI (simulated or by checking the logic).
