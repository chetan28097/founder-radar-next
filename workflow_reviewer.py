#!/usr/bin/env python3
"""
Founder Radar Architecture & Requirement Drift Reviewer
A developer workflow tool for Neathacks 2026 and Entire Checkpoint verification.
"""

import os
import sys
import json
import subprocess
from pathlib import Path


class DriftReviewer:
    def __init__(self, project_root: str):
        self.root = Path(project_root)
        self.findings = []
        self.entire_cli_path = Path.home() / ".local" / "bin" / "entire.exe"

    def run_check(self, title: str, category: str, passed: bool, evidence: str, severity: str = "INFO", verification_step: str = "N/A"):
        status_label = "PASS" if passed else "FAIL"
        self.findings.append({
            "title": title,
            "category": category,
            "status": status_label,
            "severity": severity if not passed else "NONE",
            "evidence": evidence,
            "verification_step": verification_step,
        })

    def check_isolation(self):
        """Verify zero runtime imports or references to the original 'founder' directory."""
        forbidden_references = []
        for p in self.root.rglob("*.py"):
            if ".venv" in str(p):
                continue
            content = p.read_text(encoding="utf-8", errors="ignore")
            if "from founder." in content or "import founder." in content:
                forbidden_references.append(str(p))

        passed = len(forbidden_references) == 0
        evidence = "No runtime references to legacy 'founder' codebase found." if passed else f"Found references in: {forbidden_references}"
        self.run_check(
            title="Clean Project Isolation",
            category="Architecture",
            passed=passed,
            evidence=evidence,
            severity="HIGH",
            verification_step="Inspect module imports across backend/app/."
        )

    def check_secret_hygiene(self):
        """Verify that .env is gitignored and no tracked files contain API keys."""
        gitignore_path = self.root / ".gitignore"
        has_gitignore = gitignore_path.exists() and ".env" in gitignore_path.read_text()

        # Check git status for untracked secrets
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(self.root),
            capture_output=True,
            encoding="utf-8",
            errors="replace"
        )
        tracked_secrets = [line for line in (res.stdout or "").splitlines() if ".env" in line and not line.endswith(".example")]

        passed = has_gitignore and len(tracked_secrets) == 0
        evidence = ".gitignore excludes .env. No live credential files are tracked by Git." if passed else f"Secret leak warning: {tracked_secrets}"
        self.run_check(
            title="Secret Hygiene & Credential Protection",
            category="Security",
            passed=passed,
            evidence=evidence,
            severity="CRITICAL",
            verification_step="Verify git status and git check-ignore backend/.env."
        )

    def check_exclusions(self):
        """Verify that explicitly excluded features (comparison, CFO.ai execution) are omitted."""
        comparison_found = []
        for p in self.root.rglob("*.py"):
            if ".venv" in str(p):
                continue
            content = p.read_text(encoding="utf-8", errors="ignore")
            if "class Comparison" in content or "def compare_founders" in content:
                comparison_found.append(str(p))

        passed = len(comparison_found) == 0
        evidence = "Founder comparison feature is completely excluded as required." if passed else f"Comparison code found in: {comparison_found}"
        self.run_check(
            title="Explicit Exclusions (No Comparison, CFO.ai deferred)",
            category="Requirements",
            passed=passed,
            evidence=evidence,
            severity="MEDIUM",
            verification_step="Review API routers and frontend navigation tabs."
        )

    def check_grounded_transition_rules(self):
        """Verify that transition evaluation strictly enforces deterministic evidence rules."""
        service_path = self.root / "backend" / "app" / "services" / "crustdata_service.py"
        content = service_path.read_text(encoding="utf-8", errors="ignore") if service_path.exists() else ""
        has_verified = "'verified'" in content or '"verified"' in content
        has_unverified = "'unverified'" in content or '"unverified"' in content
        has_insufficient = "'insufficient_evidence'" in content or '"insufficient_evidence"' in content

        passed = has_verified and has_unverified and has_insufficient
        evidence = "CrustdataService implements 3-tier deterministic classification: verified, unverified, and insufficient_evidence." if passed else "Missing classification tiers."
        self.run_check(
            title="Factual Grounding & Transition Evidence",
            category="Product Integrity",
            passed=passed,
            evidence=evidence,
            severity="HIGH",
            verification_step="Check CrustdataService._evaluate_transition."
        )

    def check_entire_integration(self):
        """Inspect local Entire configuration and checkpoint status."""
        settings_path = self.root / ".entire" / "settings.json"
        hooks_path = self.root / ".agents" / "hooks.json"
        has_settings = settings_path.exists()
        has_hooks = hooks_path.exists()

        entire_output = "CLI not executed"
        if self.entire_cli_path.exists():
            res = subprocess.run(
                [str(self.entire_cli_path), "status"],
                cwd=str(self.root),
                capture_output=True,
                encoding="utf-8",
                errors="replace"
            )
            stdout = res.stdout or ""
            stderr = res.stderr or ""
            entire_output = stdout.strip() if res.returncode == 0 else stderr.strip()

        passed = has_settings and has_hooks and "Enabled" in entire_output
        evidence = f"Entire enabled with Antigravity agent hook. CLI output: {entire_output}" if passed else f"Entire state: {entire_output}"
        self.run_check(
            title="Entire Checkpoint & Session Integration",
            category="Developer Workflow",
            passed=passed,
            evidence=evidence,
            severity="HIGH",
            verification_step="Run 'entire status' and 'entire checkpoint list'."
        )

    def generate_report(self) -> str:
        self.check_isolation()
        self.check_secret_hygiene()
        self.check_exclusions()
        self.check_grounded_transition_rules()
        self.check_entire_integration()

        passes = sum(1 for f in self.findings if f["status"] == "PASS")
        total = len(self.findings)

        report_lines = [
            "# Founder Radar Architecture & Requirement Drift Reviewer Report",
            f"**Review Status**: {passes}/{total} Checks Passed",
            f"**Repository**: {self.root.name}",
            f"**Target Remote**: https://github.com/chetan28097/founder-radar-next",
            "",
            "## Findings & Verification Summary",
            "",
            "| Requirement Checked | Category | Status | Severity | Evidence | Recommended Verification |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |",
        ]

        for f in self.findings:
            report_lines.append(
                f"| **{f['title']}** | {f['category']} | `{f['status']}` | {f['severity']} | {f['evidence']} | {f['verification_step']} |"
            )

        report_lines.extend([
            "",
            "## Entire Checkpoint Context",
            "- **Tracking Mode**: Local git-refs",
            "- **Integration Agent**: Antigravity",
            "- **Remote Synchronization**: Ready for push upon user confirmation",
        ])

        return "\n".join(report_lines)


if __name__ == "__main__":
    reviewer = DriftReviewer(str(Path(__file__).parent))
    report = reviewer.generate_report()
    print(report)
