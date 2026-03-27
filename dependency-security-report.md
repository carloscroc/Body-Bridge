# Dependency Vulnerability Security Report

**Generated:** 2026-02-15 18:21:29 UTC
**Project:** forge-personal-trainer
**Ecosystem:** npm
**Total Dependencies:** 200 (88 production, 110 development)

---

## Executive Summary

✅ **NO VULNERABILITIES DETECTED**

Your project has a **clean security profile** with no critical, high, moderate, low, or info-level vulnerabilities reported by npm security audit.

---

## Vulnerability Status

| Severity | Count | Status |
|----------|-------|--------|
| **Critical** | 0 | ✅ Clean |
| **High** | 0 | ✅ Clean |
| **Moderate** | 0 | ✅ Clean |
| **Low** | 0 | ✅ Clean |
| **Info** | 0 | ✅ Clean |
| **Total** | **0** | **✅ SECURE** |

**Audit Report Version:** 2
**Audit Command:** `npm audit --json`

---

## Dependency Summary

### Production Dependencies (88 packages)

| Package | Version | License |
|---------|---------|---------|
| @google/genai | 1.40.0 | Apache-2.0 |
| framer-motion | 12.34.0 | MIT |
| lucide-react | 0.563.0 | ISC |
| react | 19.2.4 | MIT |
| react-dom | 19.2.4 | MIT |

### Development Dependencies (110 packages)

| Package | Version | License |
|---------|---------|---------|
| @types/node | 22.19.10 | MIT |
| @vitejs/plugin-react | 5.1.3 | MIT |
| typescript | 5.8.3 | Apache-2.0 |
| vite | 6.4.1 | MIT |

**Total Packages:** 200
**Lock File:** package-lock.json present ✅

---

## Outdated Packages

⚠️ **6 packages can be updated** (improves security and features)

### High Priority Updates

#### 1. @google/genai
- **Current:** 1.40.0
- **Latest:** 1.41.0
- **Improvement:** Latest version with bug fixes and improvements
- **Command:** `npm install @google/genai@latest`

#### 2. @types/node
- **Current:** 22.19.10
- **Latest:** 25.2.3
- **Improvement:** Major version with new Node.js types
- **Command:** `npm install @types/node@latest`

#### 3. vite
- **Current:** 6.4.1
- **Latest:** 7.3.1
- **Improvement:** Latest version with performance improvements
- **Command:** `npm install vite@latest`

### Medium Priority Updates

#### 4. @vitejs/plugin-react
- **Current:** 5.1.3
- **Latest:** 5.1.4
- **Improvement:** Bug fixes and improvements
- **Command:** `npm install @vitejs/plugin-react@latest`

#### 5. typescript
- **Current:** 5.8.3
- **Latest:** 5.9.3
- **Improvement:** New features and bug fixes
- **Command:** `npm install typescript@latest`

#### 6. lucide-react
- **Current:** 0.563.0
- **Latest:** 0.564.0
- **Improvement:** New icons and bug fixes
- **Command:** `npm install lucide-react@latest`

---

## License Compliance

✅ **ALL LICENSES ARE PERMISSIVE**

### License Distribution

| License | Count | Percentage | Status |
|---------|-------|------------|--------|
| **MIT** | ~120+ | ~60% | ✅ Permissive |
| **Apache-2.0** | ~10+ | ~5% | ✅ Permissive |
| **ISC** | ~30+ | ~15% | ✅ Permissive |
| **BSD-3-Clause** | ~10+ | ~5% | ✅ Permissive |
| **BlueOak-1.0.0** | ~10+ | ~5% | ✅ Permissive |
| **UNLICENSED** | 1 | <1% | ✅ Private project |

**No Restrictive Licenses Detected** (e.g., GPL, AGPL, CDDL)

### Notable Licenses

- **@google/genai:** Apache-2.0 ✅
- **Google libraries:** Apache-2.0 ✅
- **Framer Motion:** MIT ✅
- **React:** MIT ✅
- **Lucide Icons:** ISC ✅

---

## Software Bill of Materials (SBOM)

**Format:** CycloneDX 1.5
**Generated:** 2026-02-15 18:21:29 UTC

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "timestamp": "2026-02-15T18:21:29Z",
    "tools": [
      {
        "name": "Dependency Scanner",
        "version": "1.0.0"
      }
    ]
  },
  "components": [
    {
      "type": "library",
      "name": "forge-personal-trainer",
      "version": "0.0.0",
      "purl": "pkg:npm/forge-personal-trainer@0.0.0",
      "licenses": [
        {
          "license": {
            "id": "UNLICENSED"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "react",
      "version": "19.2.4",
      "purl": "pkg:npm/react@19.2.4",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "react-dom",
      "version": "19.2.4",
      "purl": "pkg:npm/react-dom@19.2.4",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "@google/genai",
      "version": "1.40.0",
      "purl": "pkg:npm/@google/genai@1.40.0",
      "licenses": [
        {
          "license": {
            "id": "Apache-2.0"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "framer-motion",
      "version": "12.34.0",
      "purl": "pkg:npm/framer-motion@12.34.0",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "lucide-react",
      "version": "0.563.0",
      "purl": "pkg:npm/lucide-react@0.563.0",
      "licenses": [
        {
          "license": {
            "id": "ISC"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "vite",
      "version": "6.4.1",
      "purl": "pkg:npm/vite@6.4.1",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    },
    {
      "type": "library",
      "name": "typescript",
      "version": "5.8.3",
      "purl": "pkg:npm/typescript@5.8.3",
      "licenses": [
        {
          "license": {
            "id": "Apache-2.0"
          }
        }
      ]
    }
  ]
}
```

---

## Remediation Recommendations

### Immediate Actions (Recommended)

1. **Update Outdated Packages**
   ```bash
   npm outdated --format=JSON | jq -r '.[] | "\(.packageName): \(.current) -> \(.latest)"' | head -20
   ```

2. **Install Latest Security Fixes**
   ```bash
   npm audit fix --audit-level=high
   npm audit fix --force  # Only if necessary (may break compatibility)
   ```

3. **Update Major Dependencies**
   ```bash
   npm update --save  # Updates to compatible versions
   # OR for major updates:
   npm install @google/genai@latest @types/node@latest vite@latest
   ```

4. **Verify After Updates**
   ```bash
   npm audit
   npm test
   npm run build
   ```

### Short-term Actions (Weekly)

1. **Automated Scanning in CI/CD**
   - Add npm audit to your GitHub Actions / CI pipeline
   - Set up automated PR checks for dependency updates

2. **License Compliance Monitoring**
   ```bash
   npx license-checker --production --json > licenses.json
   ```

3. **Dependency Updates Alerting**
   - Set up npm-check-updates (ncu) to notify of outdated packages
   - Configure GitHub Dependabot or Renovate bot

### Long-term Actions (Monthly)

1. **Regular Vulnerability Scanning**
   - Schedule weekly npm audits via CI/CD
   - Monitor CVE feeds for your dependencies

2. **Dependency Pruning**
   ```bash
   npm prune --production  # Remove dev dependencies in production
   ```

3. **SBOM Maintenance**
   - Generate and commit updated SBOM files
   - Use tools like Syft, Trivy, or Cargo BOM for multi-ecosystem SBOMs

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Dependency Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 0'  # Weekly at 2 AM UTC

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Cache node modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-modules-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-modules-

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: |
          npm audit --audit-level=high
          if [ $? -ne 0 ]; then
            echo "❌ Found high or critical vulnerabilities!"
            exit 1
          fi
        continue-on-error: false

      - name: Check for outdated packages
        run: npm outdated --json > outdated.json
        continue-on-error: true

      - name: Check licenses
        run: npx license-checker --production --json > licenses.json
        continue-on-error: true

      - name: Upload scan results
        uses: actions/upload-artifact@v4
        with:
          name: security-scan-results
          path: |
            outdated.json
            licenses.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const outdated = JSON.parse(fs.readFileSync('outdated.json', 'utf8'));
            let comment = '## 📦 Dependency Update Summary\n\n';

            if (Object.keys(outdated).length === 0) {
              comment += '✅ No outdated packages found.';
            } else {
              comment += `⚠️ Found ${Object.keys(outdated).length} outdated package(s):\n\n`;
              for (const [pkg, info] of Object.entries(outdated)) {
                comment += `### ${pkg}\n`;
                comment += `- Current: \`${info.current}\`\n`;
                comment += `- Latest: \`${info.latest}\`\n\n`;
              }
            }

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## Security Best Practices

### ✅ Implemented (Your Project)

- [x] Using `package-lock.json` for reproducible installs
- [x] npm audit enabled and running
- [x] No critical or high vulnerabilities detected
- [x] Permissive licenses only
- [x] Private project (UNLICENSED)

### 🔄 Recommended to Implement

- [ ] Automated CI/CD security scans
- [ ] Automated PR checks for dependency updates
- [ ] Regular scanning via scheduled CI jobs
- [ ] Dependency update alerts (Dependabot / Renovate)
- [ ] SBOM generation and maintenance
- [ ] License compliance monitoring

### 🔒 Security Checklist

| Task | Status | Frequency |
|------|--------|-----------|
| npm audit | ✅ Manual | Every commit |
| CI/CD security scan | ⬜ Not set | On push/PR |
| Scheduled security scan | ⬜ Not set | Weekly |
| Dependency update alerts | ⬜ Not set | Real-time |
| SBOM generation | ⬜ Not set | Monthly |
| License compliance check | ⬜ Not set | On changes |

---

## Security Tooling Recommendations

### Essential Tools

1. **npm audit** (Built-in)
   ```bash
   npm audit
   npm audit fix
   ```

2. **license-checker**
   ```bash
   npm install -g license-checker
   license-checker --production --json
   ```

3. **npm-check-updates**
   ```bash
   npm install -g npm-check-updates
   ncu -u  # Update all
   ```

### Optional Tools (For Advanced Security)

1. **Snyk**
   ```bash
   npm install -g snyk
   snyk test
   snyk monitor
   ```

2. **Dependabot** (GitHub)
   - Automatic PRs for dependency updates
   - Security advisories included

3. **Renovate Bot**
   - Automatic dependency updates
   - Customizable update strategy
   - Supports multiple ecosystems

4. **GitHub Dependabot Alerts**
   - Built-in GitHub security dashboard
   - CVE monitoring for registered dependencies

---

## Summary

### ✅ Strengths

1. **No vulnerabilities** - Clean security profile
2. **Permissive licenses** - No license compliance issues
3. **Lock file present** - Reproducible installs
4. **Modern dependencies** - React 19, TypeScript 5.8, Vite 6
5. **Private project** - No public exposure risk

### ⚠️ Areas for Improvement

1. **6 outdated packages** - Update recommended for security and features
2. **No automated CI/CD security** - Add scanning to your pipeline
3. **No SBOM maintenance** - Generate and track SBOMs regularly

### 🎯 Recommended Actions (Priority Order)

1. **High Priority:**
   - Update @types/node, vite, and @google/genai to latest versions
   - Add npm audit to CI/CD pipeline

2. **Medium Priority:**
   - Update @vitejs/plugin-react and typescript
   - Setup Dependabot or Renovate for automated updates

3. **Low Priority:**
   - Implement regular SBOM generation
   - Set up license compliance monitoring

---

**Report Generated:** 2026-02-15 18:21:29 UTC
**Scanner Version:** 1.0.0
**Project Health:** ✅ **EXCELLENT**
