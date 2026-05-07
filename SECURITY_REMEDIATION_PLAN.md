# Security Vulnerability Remediation Plan

**Project:** Forge
**Date:** May 6, 2026
**Status:** Planning Phase

---

## Overview

This plan outlines the systematic approach to remediate 31 security vulnerabilities identified in the Forge project, including 1 critical, 9 high, and 20 moderate severity issues, plus 1 code-level vulnerability and 1 syntax error.

## Remediation Strategy

### Phase 1: Critical & High Priority (Week 1)
**Goal:** Address all critical and high-severity vulnerabilities that could lead to:
- Remote code execution
- Authentication bypass
- Data exfiltration
- Denial of service attacks

### Phase 2: Moderate Priority (Week 2)
**Goal:** Address moderate-severity vulnerabilities and code-level improvements

### Phase 3: Testing & Validation (Week 2-3)
**Goal:** Comprehensive testing to ensure updates don't break functionality

### Phase 4: Long-term Security (Ongoing)
**Goal:** Implement security best practices and monitoring

---

## Phase 1: Critical & High Priority Updates

### 1.1 Critical Vulnerability - protobufjs

**Package:** `protobufjs` < 7.5.5
**Risk:** Arbitrary code execution (CVSS 9.8)
**Impact:** Remote attackers can execute arbitrary code through malicious protobuf data

**Implementation Steps:**
1. Check current protobufjs version
2. Identify all direct and indirect dependencies
3. Update to protobufjs ≥ 7.5.5
4. Test all protobuf-related functionality
5. Verify no breaking changes in API

**Commands:**
```bash
npm ls protobufjs
npm update protobufjs@latest
npm audit fix --force
```

**Testing Checklist:**
- [ ] All data serialization/deserialization works
- [ ] No API breaking changes
- [ ] Performance impact assessment
- [ ] Integration tests pass

**Rollback Plan:**
- Keep backup of package.json and package-lock.json
- Document exact version before update
- Test rollback procedure

---

### 1.2 High Priority - axios

**Package:** `axios` 1.0.0 - 1.15.1
**Risk:** Authentication bypass, prototype pollution, SSRF (CVSS up to 7.4)
**Impact:** Credential theft, request hijacking, server-side request forgery

**Implementation Steps:**
1. Check current axios version and usage
2. Identify all axios calls in codebase
3. Update to axios ≥ 1.15.2
4. Review and update axios configurations
5. Test all HTTP requests

**Commands:**
```bash
npm ls axios
npm update axios@latest
npm audit fix
```

**Code Review Required:**
- Check for custom axios interceptors
- Review timeout configurations
- Verify error handling still works
- Check for prototype pollution safeguards

**Testing Checklist:**
- [ ] All API calls function correctly
- [ ] Authentication flows work
- [ ] Error handling unchanged
- [ ] No performance regression
- [ ] SSRF protections still effective

---

### 1.3 High Priority - express-rate-limit

**Package:** `express-rate-limit` 8.0.1 - 8.5.0
**Risk:** Rate limiting bypass (CVSS 7.5)
**Impact:** DoS attacks, API abuse

**Implementation Steps:**
1. Review current rate limiting configuration
2. Update to express-rate-limit ≥ 8.2.2
3. Test rate limiting with IPv4-mapped IPv6 addresses
4. Verify rate limiting still works correctly

**Commands:**
```bash
npm ls express-rate-limit
npm update express-rate-limit@latest
```

**Testing Checklist:**
- [ ] Rate limiting works for IPv4 addresses
- [ ] Rate limiting works for IPv6 addresses
- [ ] IPv4-mapped IPv6 addresses are properly limited
- [ ] No false positives in rate limiting
- [ ] API abuse protection still effective

---

### 1.4 High Priority - vite

**Package:** `vite` ≤ 6.4.1
**Risk:** Path traversal, arbitrary file read (CVSS High)
**Impact:** Information disclosure, file system access

**Implementation Steps:**
1. Check current vite version
2. Update to vite ≥ 6.4.2
3. Review vite configuration
4. Test development server
5. Test build process

**Commands:**
```bash
npm ls vite
npm update vite@latest
```

**Testing Checklist:**
- [ ] Development server starts correctly
- [ ] Hot module replacement works
- [ ] Build process completes successfully
- [ ] No path traversal vulnerabilities
- [ ] Production builds work correctly

---

### 1.5 High Priority - lodash

**Package:** `lodash` ≤ 4.17.23
**Risk:** Code injection, prototype pollution (CVSS 8.1)
**Impact:** Remote code execution, data manipulation

**Implementation Steps:**
1. Identify all lodash usage in codebase
2. Update to lodash ≥ 4.17.21
3. Review lodash usage patterns
4. Test all lodash-dependent functionality

**Commands:**
```bash
npm ls lodash
npm update lodash@latest
```

**Code Review Required:**
- Check for `_.template` usage
- Review `_.unset` and `_.omit` usage
- Look for prototype pollution patterns
- Consider replacing with native alternatives where possible

**Testing Checklist:**
- [ ] All lodash functions work correctly
- [ ] No breaking changes in API
- [ ] Performance impact assessment
- [ ] No prototype pollution vulnerabilities

---

### 1.6 High Priority - minimatch

**Package:** `minimatch` 9.0.0 - 9.0.6
**Risk:** ReDoS vulnerabilities (CVSS 7.5)
**Impact:** DoS attacks, performance degradation

**Implementation Steps:**
1. Identify minimatch usage
2. Update to minimatch ≥ 9.0.7
3. Test all file matching operations

**Commands:**
```bash
npm ls minimatch
npm update minimatch@latest
```

**Testing Checklist:**
- [ ] All file glob patterns work
- [ ] No performance regression
- [ ] No ReDoS vulnerabilities
- [ ] Build processes work correctly

---

### 1.7 High Priority - path-to-regexp

**Package:** `path-to-regexp` 8.0.0 - 8.3.0
**Risk:** DoS vulnerabilities (CVSS 7.5)
**Impact:** DoS attacks, performance degradation

**Implementation Steps:**
1. Identify path-to-regexp usage
2. Update to path-to-regexp ≥ 8.4.0
3. Test all route matching

**Commands:**
```bash
npm ls path-to-regexp
npm update path-to-regexp@latest
```

**Testing Checklist:**
- [ ] All routes match correctly
- [ ] No performance regression
- [ ] No DoS vulnerabilities
- [ ] API routing works correctly

---

### 1.8 High Priority - picomatch

**Package:** `picomatch` ≤ 2.3.1 || 4.0.0 - 4.0.3
**Risk:** Method injection, ReDoS (CVSS 7.5)
**Impact:** Prototype pollution, DoS attacks

**Implementation Steps:**
1. Identify picomatch usage
2. Update to picomatch ≥ 2.3.2 or ≥ 4.0.4
3. Test all glob matching

**Commands:**
```bash
npm ls picomatch
npm update picomatch@latest
```

**Testing Checklist:**
- [ ] All glob patterns work
- [ ] No prototype pollution
- [ ] No ReDoS vulnerabilities
- [ ] Build processes work correctly

---

### 1.9 High Priority - @xmldom/xmldom

**Package:** `@xmldom/xmldom` ≤ 0.8.12
**Risk:** XML injection, DoS (CVSS High)
**Impact:** XML injection attacks, DoS

**Implementation Steps:**
1. Identify XML parsing usage
2. Update to @xmldom/xmldom ≥ 0.8.13
3. Test all XML operations

**Commands:**
```bash
npm ls @xmldom/xmldom
npm update @xmldom/xmldom@latest
```

**Testing Checklist:**
- [ ] All XML parsing works
- [ ] No XML injection vulnerabilities
- [ ] No DoS vulnerabilities
- [ ] Performance impact assessment

---

### 1.10 High Priority - rollup

**Package:** `rollup` 4.0.0 - 4.58.0
**Risk:** Arbitrary file write (CVSS High)
**Impact:** File system compromise

**Implementation Steps:**
1. Identify rollup usage
2. Update to rollup ≥ 4.59.0
3. Test build process

**Commands:**
```bash
npm ls rollup
npm update rollup@latest
```

**Testing Checklist:**
- [ ] Build process works correctly
- [ ] No arbitrary file write vulnerabilities
- [ ] Output bundles are correct
- [ ] No performance regression

---

## Phase 2: Moderate Priority Updates

### 2.1 Moderate Priority - dompurify

**Package:** `dompurify` ≤ 3.3.3
**Risk:** Multiple XSS vulnerabilities (CVSS up to 6.9)
**Impact:** Cross-site scripting attacks

**Implementation Steps:**
1. Update to dompurify ≥ 3.4.0
2. Review SanitizedContent.tsx implementation
3. Enhance sanitization configuration
4. Test all HTML sanitization

**Commands:**
```bash
npm ls dompurify
npm update dompurify@latest
```

**Code Improvements Required:**
- Add `rel="noopener noreferrer"` for external links
- Restrict tagName to safe HTML elements
- Add input validation and length limits
- Implement more restrictive sanitization policy

**Testing Checklist:**
- [ ] All HTML sanitization works
- [ ] No XSS vulnerabilities
- [ ] External links have proper security attributes
- [ ] Performance impact assessment

---

### 2.2 Moderate Priority - crawlee

**Package:** `crawlee` 3.10.2-beta.0 - 4.0.0-beta.6
**Risk:** File type vulnerabilities (CVSS Moderate)
**Impact:** DoS attacks, performance issues

**Implementation Steps:**
1. Identify crawlee usage
2. Update to crawlee ≥ 3.10.1
3. Test all web scraping functionality

**Commands:**
```bash
npm ls crawlee
npm update crawlee@latest
```

**Testing Checklist:**
- [ ] All web scraping works
- [ ] No DoS vulnerabilities
- [ ] Performance impact assessment
- [ ] File type handling works correctly

---

### 2.3 Moderate Priority - hono

**Package:** `hono` ≤ 4.12.15
**Risk:** Multiple security issues (CVSS up to 6.5)
**Impact:** Prototype pollution, path traversal, XSS

**Implementation Steps:**
1. Identify hono usage
2. Update to hono ≥ 4.12.16
3. Review hono configurations
4. Test all hono functionality

**Commands:**
```bash
npm ls hono
npm update hono@latest
```

**Testing Checklist:**
- [ ] All API endpoints work
- [ ] No prototype pollution
- [ ] No path traversal vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Cookie handling works correctly

---

### 2.4 Moderate Priority - postcss

**Package:** `postcss` < 8.5.10
**Risk:** XSS vulnerability (CVSS 6.1)
**Impact:** Cross-site scripting attacks

**Implementation Steps:**
1. Update to postcss ≥ 8.5.10
2. Test all CSS processing
3. Verify no XSS vulnerabilities

**Commands:**
```bash
npm ls postcss
npm update postcss@latest
```

**Testing Checklist:**
- [ ] All CSS processing works
- [ ] No XSS vulnerabilities
- [ ] Build process works correctly
- [ ] No performance regression

---

### 2.5 Additional Moderate Updates

**Packages to update:**
- `brace-expansion` to ≥2.0.3 or ≥5.0.5
- `@hono/node-server` to ≥1.19.13
- `ip-address` to ≥10.1.1
- `file-type` to ≥21.3.2

**Implementation Steps:**
1. Update all packages in batch
2. Test functionality for each
3. Verify no breaking changes

**Commands:**
```bash
npm update brace-expansion @hono/node-server ip-address file-type
npm audit fix
```

---

## Phase 3: Code-Level Improvements

### 3.1 Fix Syntax Error - CreateWorkout.tsx

**Location:** `src/components/CreateWorkout.tsx:687`
**Issue:** Unescaped `&` character in JSX

**Implementation:**
```typescript
// Before:
<h3 className="text-[24px] font-black text-white mb-2 animate-silk-up" style={{ animationDelay: '0.1s' }}>
  Created & Planned!
</h3>

// After:
<h3 className="text-[24px] font-black text-white mb-2 animate-silk-up" style={{ animationDelay: '0.1s' }}>
  Created & Planned!
</h3>
```

---

### 3.2 Enhance SanitizedContent.tsx Security

**Current Issues:**
1. Missing link security (no `rel="noopener noreferrer"`)
2. Flexible tagName (typed as `any`)
3. DOMPurify version vulnerabilities

**Implementation:**

```typescript
import React from 'react';
import { sanitize } from '../utils/sanitize';

interface SanitizedContentProps {
  content: string;
  className?: string;
  tagName?: 'div' | 'span' | 'p' | 'article' | 'section';
}

const SAFE_TAGS = ['div', 'span', 'p', 'article', 'section'] as const;

export const SanitizedContent: React.FC<SanitizedContentProps> = ({
  content,
  className = '',
  tagName: Tag = 'div'
}) => {
  // Validate tagName
  if (!SAFE_TAGS.includes(Tag as any)) {
    console.warn(`Invalid tagName: ${Tag}, defaulting to 'div'`);
    Tag = 'div';
  }

  // Add input validation
  if (typeof content !== 'string') {
    console.warn('Invalid content type, expected string');
    return <Tag className={className} />;
  }

  // Add length limit to prevent DoS
  const MAX_CONTENT_LENGTH = 100000;
  const truncatedContent = content.length > MAX_CONTENT_LENGTH
    ? content.substring(0, MAX_CONTENT_LENGTH)
    : content;

  const clean = sanitize(truncatedContent);

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
```

**Enhanced sanitize.ts:**

```typescript
import DOMPurify from 'dompurify';

export const sanitize = (content: string): string => {
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    // Add hook to enforce rel="noopener noreferrer" for external links
    uponSanitizeAttribute: (node, data) => {
      if (data.attrName === 'target' && data.attrValue === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    },
  });
};

export const sanitizeUrl = (url: string): string => {
  const clean = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (clean.startsWith('javascript:') || clean.startsWith('data:') || clean.startsWith('vbscript:')) {
    return '';
  }
  return clean;
};
```

---

## Phase 4: Testing & Validation

### 4.1 Automated Testing

**Unit Tests:**
- [ ] Run existing test suite
- [ ] Add security-specific tests
- [ ] Test edge cases for all updated packages

**Integration Tests:**
- [ ] Test all API endpoints
- [ ] Test authentication flows
- [ ] Test file operations
- [ ] Test web scraping functionality

**Security Tests:**
- [ ] Run semgrep scan
- [ ] Run npm audit
- [ ] Test for XSS vulnerabilities
- [ ] Test for prototype pollution
- [ ] Test for DoS vulnerabilities

### 4.2 Manual Testing

**Functional Testing:**
- [ ] Test all user flows
- [ ] Test admin functionality
- [ ] Test file uploads/downloads
- [ ] Test API rate limiting

**Performance Testing:**
- [ ] Measure performance impact
- [ ] Test under load
- [ ] Monitor memory usage
- [ ] Check response times

### 4.3 Validation Checklist

**Before Deployment:**
- [ ] All tests pass
- [ ] No security vulnerabilities remaining
- [ ] No breaking changes
- [ ] Performance acceptable
- [ ] Documentation updated

**After Deployment:**
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Verify security headers
- [ ] Test production endpoints
- [ ] Monitor rate limiting effectiveness

---

## Phase 5: Long-term Security Improvements

### 5.1 Dependency Management

**Automated Updates:**
- Set up Dependabot for automatic PRs
- Configure Snyk for security monitoring
- Implement weekly dependency audits
- Create security update policy

**Monitoring:**
- Set up security alerts
- Monitor CVE databases
- Subscribe to security advisories
- Track dependency health

### 5.2 Security Best Practices

**Code Review:**
- Implement security code review checklist
- Train developers on security best practices
- Regular security audits
- Penetration testing schedule

**Infrastructure:**
- Implement Content Security Policy (CSP)
- Add security headers
- Configure proper CORS
- Implement rate limiting
- Set up monitoring and alerting

### 5.3 Documentation

**Security Documentation:**
- Create security guidelines
- Document security requirements
- Create incident response plan
- Document security testing procedures

**Developer Resources:**
- Security training materials
- Code examples for secure patterns
- Security checklist for new features
- Common vulnerabilities and fixes

---

## Risk Assessment

### High Risk Updates
- **protobufjs** - Breaking changes possible in API
- **axios** - Widespread usage, potential breaking changes
- **vite** - Build system changes, potential compatibility issues

### Medium Risk Updates
- **lodash** - API changes possible
- **dompurify** - Sanitization behavior changes
- **hono** - API changes possible

### Low Risk Updates
- Most other dependencies have minor version updates

---

## Rollback Strategy

### Pre-Update Preparation
1. Create backup of package.json and package-lock.json
2. Create git branch for updates
3. Document current state
4. Prepare rollback commands

### Rollback Triggers
- Critical functionality broken
- Performance degradation > 20%
- Security regression
- Unacceptable breaking changes

### Rollback Procedure
```bash
# Restore from backup
git checkout <backup-branch>
npm install
npm audit fix
```

---

## Timeline

### Week 1
- **Day 1-2:** Critical updates (protobufjs, axios)
- **Day 3-4:** High priority updates (express-rate-limit, vite, lodash)
- **Day 5:** Testing and validation

### Week 2
- **Day 1-2:** Remaining high priority updates (minimatch, path-to-regexp, picomatch, @xmldom/xmldom, rollup)
- **Day 3-4:** Moderate priority updates
- **Day 5:** Code-level improvements

### Week 3
- **Day 1-2:** Comprehensive testing
- **Day 3:** Security validation
- **Day 4:** Documentation updates
- **Day 5:** Deployment preparation

---

## Success Criteria

### Security
- [ ] Zero critical vulnerabilities
- [ ] Zero high vulnerabilities
- [ ] Minimal moderate vulnerabilities
- [ ] No code-level security issues

### Functionality
- [ ] All features work correctly
- [ ] No breaking changes
- [ ] Performance acceptable
- [ ] User experience unchanged

### Process
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Team trained on changes
- [ ] Monitoring in place

---

## Next Steps

1. **Immediate:** Begin Phase 1 updates starting with protobufjs
2. **Short-term:** Complete all critical and high priority updates
3. **Medium-term:** Complete moderate updates and code improvements
4. **Long-term:** Implement ongoing security practices

---

**Document Version:** 1.0
**Last Updated:** May 6, 2026
**Next Review:** After Phase 1 completion