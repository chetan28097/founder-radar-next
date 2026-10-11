# Founder Radar Architecture & Requirement Drift Reviewer

The **Architecture & Requirement Drift Reviewer** (`workflow_reviewer.py`) is an automated developer workflow tool designed to enforce specification compliance, security best practices, and integration safety for **Founder Radar**.

---

## 🔍 Purpose & Background

In fast-paced agentic development and hackathon sprints, projects frequently suffer from:
1. **Architectural Drift**: Accidentally importing legacy packages, creating cross-directory dependencies, or accumulating circular links.
2. **Credential Leakage**: Unintentionally committing `.env` or staging live API tokens into public or team repositories.
3. **Requirement Creep**: Implementing explicitly excluded features (e.g. founder comparison, unsolicited automated messaging, or fake financial modeling).
4. **Factual Hallucination**: Allowing AI models to declare founders as "verified" without concrete timestamp evidence.
5. **Session Loss**: Failing to capture reproducible development steps and checkpoint records in Git.

The Drift Reviewer continuously monitors the codebase and verifies all 5 core integrity pillars.

---

## 📋 The 5 Verification Checks

| Check Name | Category | Severity | Description & Rule |
| :--- | :--- | :--- | :--- |
| **Clean Project Isolation** | Architecture | `HIGH` | Scans all Python source files to ensure zero runtime dependencies or imports from legacy directories (`from founder.` or `import founder.`). |
| **Secret Hygiene & Credential Protection** | Security | `CRITICAL` | Ensures `.gitignore` explicitly excludes `.env` and confirms that no live secrets or `.env` files are tracked by Git (`git status --porcelain`). |
| **Explicit Exclusions** | Requirements | `MEDIUM` | Verifies that explicitly prohibited features (founder comparison tables, comparison routes, comparison prompts) are completely excluded from the codebase. |
| **Factual Grounding & Transition Evidence** | Product Integrity | `HIGH` | Validates that `CrustdataService` implements deterministic 3-tier classification (`verified`, `unverified`, `insufficient_evidence`) and never fabricates startup signals based solely on employer departure. |
| **Entire Checkpoint & Session Integration** | Developer Workflow | `HIGH` | Inspects `.entire/settings.json`, `.agents/hooks.json`, and executes `entire status` to confirm active agent session recording and commit-checkpointing. |

---

## 🛠️ How to Execute

From the project root:

```bash
python workflow_reviewer.py
```

### Sample Output

```markdown
# Founder Radar Architecture & Requirement Drift Reviewer Report
**Review Status**: 5/5 Checks Passed
**Repository**: founder-radar-next
**Target Remote**: https://github.com/chetan28097/founder-radar-next

## Findings & Verification Summary

| Requirement Checked | Category | Status | Severity | Evidence | Recommended Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Clean Project Isolation** | Architecture | `PASS` | NONE | No runtime references to legacy 'founder' codebase found. | Inspect module imports across backend/app/. |
| **Secret Hygiene & Credential Protection** | Security | `PASS` | NONE | .gitignore excludes .env. No live credential files are tracked by Git. | Verify git status and git check-ignore backend/.env. |
| **Explicit Exclusions (No Comparison, CFO.ai deferred)** | Requirements | `PASS` | NONE | Founder comparison feature is completely excluded as required. | Review API routers and frontend navigation tabs. |
| **Factual Grounding & Transition Evidence** | Product Integrity | `PASS` | NONE | CrustdataService implements 3-tier deterministic classification: verified, unverified, and insufficient_evidence. | Check CrustdataService._evaluate_transition. |
| **Entire Checkpoint & Session Integration** | Developer Workflow | `PASS` | NONE | Entire enabled with Antigravity agent hook. CLI output: ● Enabled · branch main ... | Run 'entire status' and 'entire checkpoint list'. |
```

---

## 🔄 Entire CLI Integration Workflow

Founder Radar uses the Entire CLI (`v0.11.4`) with the Antigravity agent:
1. `entire enable --agent antigravity`: Automatically links agent tool executions to local Git checkpoints.
2. `entire status`: Displays active tracking branch, enabled agents, and sync status.
3. `entire checkpoint list`: Lists recorded checkpoints.
4. `entire checkpoint explain HEAD`: Explains what happened in the latest checkpoint.

All checkpoints are retained locally on the `main` branch with Git-refs tracking.
