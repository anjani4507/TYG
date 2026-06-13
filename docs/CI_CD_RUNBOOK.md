# TYG CI/CD Runbook - Incident Response Guide

## Quick Reference

| Incident | Severity | Action | MTTR |
|----------|----------|--------|------|
| Build Failure | 🟡 Medium | Check logs, fix code, retry | <30min |
| Test Failure | 🟡 Medium | Review test, update code, retry | <30min |
| Deployment Failure | 🔴 High | Rollback, investigate, redeploy | <15min |
| High Crash Rate | 🔴 High | Immediate rollback | <5min |
| Performance Degradation | 🟡 Medium | Monitor, investigate, hotfix | <1h |

---

## Incident Response Procedures

### 1. Build Failure

**Symptoms:**
- GitHub Actions workflow shows red X
- Build logs show compilation errors
- EAS build fails

**Response:**
```bash
# 1. Check logs
# - GitHub Actions: https://github.com/tyg/app/actions
# - EAS Build: eas build:list

# 2. Identify issue
# - TypeScript errors: pnpm check
# - Lint errors: pnpm lint
# - Dependency issues: pnpm install --frozen-lockfile

# 3. Fix locally
git checkout -b fix/build-issue
# Fix the issue
git commit -m "fix: resolve build issue"
git push origin fix/build-issue

# 4. Create PR and wait for CI
# - Verify all checks pass
# - Merge to develop

# 5. Monitor build
eas build:list
```

**Prevention:**
- Run `pnpm check` before committing
- Use pre-commit hooks
- Test locally with `pnpm build`

---

### 2. Test Failure

**Symptoms:**
- GitHub Actions "Lint & Test" workflow fails
- Test coverage drops
- Specific test file fails

**Response:**
```bash
# 1. Check which tests failed
# - GitHub Actions logs show test name
# - Run locally: pnpm test

# 2. Debug locally
pnpm test tests/failing-test.ts --watch

# 3. Fix the issue
# - Update test expectations
# - Fix implementation code
# - Add missing mocks

# 4. Verify fix
pnpm test
pnpm test:coverage

# 5. Commit and push
git commit -m "fix: resolve failing test"
git push origin feature/branch
```

**Prevention:**
- Write tests first (TDD)
- Maintain >75% code coverage
- Review test changes in PR

---

### 3. Deployment Failure

**Symptoms:**
- Deploy workflow shows error
- App Store submission fails
- Google Play upload fails
- Web deployment stuck

**Response:**

#### 3a. App Store Submission Failed

```bash
# 1. Check error message
# - GitHub Actions logs
# - App Store Connect dashboard

# 2. Common issues:
# - Certificate expired: Renew in Apple Developer
# - Build rejected: Check review guidelines
# - Version already exists: Bump version

# 3. Fix and retry
eas submit --platform ios --non-interactive

# 4. Monitor submission
# - Check App Store Connect for status
# - Review rejection reasons if any
```

#### 3b. Google Play Upload Failed

```bash
# 1. Check error message
# - GitHub Actions logs
# - Google Play Console dashboard

# 2. Common issues:
# - Keystore password wrong: Check secrets
# - Version code too low: Increment versionCode
# - APK already exists: Use new version

# 3. Fix and retry
eas submit --platform android --non-interactive

# 4. Monitor submission
# - Check Google Play Console for status
# - Wait for review (typically 2-4 hours)
```

#### 3c. Web Deployment Failed

```bash
# 1. Check Vercel logs
# - Vercel dashboard
# - GitHub Actions logs

# 2. Common issues:
# - Build failed: Check pnpm build output
# - Deployment timeout: Check file size
# - Environment variables missing: Add to Vercel

# 3. Fix and retry
pnpm build
npx vercel --prod --token $VERCEL_TOKEN

# 4. Verify deployment
# - Check Vercel URL
# - Test functionality
```

---

### 4. High Crash Rate (>5%)

**Symptoms:**
- Sentry shows spike in errors
- Slack alert triggered
- User reports app crashes

**Response:**

```bash
# 1. IMMEDIATE: Check Sentry dashboard
# - https://sentry.io/organizations/tyg/issues/
# - Identify most common error
# - Check affected users and versions

# 2. IMMEDIATE: Assess severity
# - Is it blocking core functionality? → CRITICAL
# - Does it affect <1% of users? → LOW
# - Is it new since last deploy? → LIKELY CAUSE

# 3. IMMEDIATE: Rollback if critical
git log --oneline main | head -5
git revert <commit-hash>
git push origin main
# This triggers production deployment of previous version

# 4. Post-incident:
# - Investigate root cause
# - Write fix
# - Add test to prevent regression
# - Deploy fix to production
```

**Prevention:**
- Test on real devices before release
- Use staged rollout (5% → 25% → 100%)
- Monitor error rates continuously

---

### 5. Performance Degradation

**Symptoms:**
- API response time >2s (normal: <500ms)
- App feels slow
- Datadog alerts triggered

**Response:**

```bash
# 1. Check Datadog dashboard
# - https://app.datadoghq.com
# - Identify slow endpoints
# - Check database query times

# 2. Identify cause
# - New deployment? → Check recent changes
# - Database issue? → Check query logs
# - Traffic spike? → Check analytics

# 3. Immediate mitigation
# - Scale backend if needed
# - Enable caching
# - Optimize slow queries

# 4. Root cause analysis
# - Review code changes
# - Profile application
# - Check database indexes

# 5. Deploy fix
# - Optimize code/queries
# - Add caching layer
# - Test performance locally
```

---

## Rollback Procedures

### Rollback to Previous Version

```bash
# 1. Identify previous version
git log --oneline main | head -10

# 2. Revert commit
git revert <commit-hash>

# 3. Push to main (triggers production deployment)
git push origin main

# 4. Monitor deployment
# - Check GitHub Actions
# - Verify app functionality
# - Monitor error rates in Sentry

# 5. Post-mortem
# - Investigate what went wrong
# - Add tests to prevent regression
# - Update documentation
```

### Rollback via EAS

```bash
# 1. List previous builds
eas build:list

# 2. Submit previous build
eas submit --build <build-id> --platform ios
eas submit --build <build-id> --platform android

# 3. Monitor submission
# - Check App Store / Google Play status
# - Verify users receive update
```

---

## Monitoring Dashboards

### Critical Dashboards

1. **GitHub Actions**
   - URL: https://github.com/tyg/app/actions
   - Check: Build status, test results
   - Alert: Red X on main/develop

2. **Sentry**
   - URL: https://sentry.io/organizations/tyg/
   - Check: Error rate, crash rate
   - Alert: >5% crash rate

3. **Datadog**
   - URL: https://app.datadoghq.com
   - Check: API latency, database performance
   - Alert: >2s response time

4. **Firebase Analytics**
   - URL: https://console.firebase.google.com
   - Check: DAU, retention, crashes
   - Alert: >10% crash rate

5. **App Store Connect**
   - URL: https://appstoreconnect.apple.com
   - Check: Build status, crashes, reviews
   - Alert: Rejection reasons

6. **Google Play Console**
   - URL: https://play.google.com/console
   - Check: Build status, crashes, reviews
   - Alert: Rejection reasons

---

## Communication Procedures

### Incident Severity Levels

| Level | Impact | Response Time | Communication |
|-------|--------|----------------|-----------------|
| 🔴 Critical | Core functionality broken | <5 min | Slack + Email |
| 🟠 High | Major feature broken | <15 min | Slack |
| 🟡 Medium | Minor feature broken | <30 min | Slack |
| 🟢 Low | Cosmetic issue | <1 day | GitHub Issue |

### Slack Notification Template

```
🚨 INCIDENT: [Title]
Severity: [CRITICAL/HIGH/MEDIUM]
Status: [INVESTIGATING/IN PROGRESS/RESOLVED]
ETA: [Time estimate]

Details:
- Affected: [Users/Features]
- Root Cause: [If known]
- Action: [What we're doing]

Updates: [Link to GitHub issue]
```

---

## Escalation Path

```
Incident Detected
       ↓
On-Call Engineer
       ↓
Team Lead (if >15 min)
       ↓
Engineering Manager (if >30 min)
       ↓
VP Engineering (if >1 hour)
```

---

## Post-Incident Review

### Incident Report Template

```markdown
# Incident Report: [Title]

## Timeline
- [Time]: Incident detected
- [Time]: Root cause identified
- [Time]: Fix deployed
- [Time]: Verified resolved

## Root Cause
[Detailed explanation]

## Impact
- Users affected: [Number]
- Duration: [Time]
- Revenue impact: [If applicable]

## Resolution
[What was done to fix it]

## Prevention
[What we'll do to prevent this]

## Action Items
- [ ] Fix deployed
- [ ] Test added
- [ ] Documentation updated
- [ ] Team trained
```

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | TBD | TBD | TBD |
| Team Lead | TBD | TBD | TBD |
| VP Engineering | TBD | TBD | TBD |

---

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Submit build manually
eas submit --platform ios --non-interactive

# Check TypeScript errors
pnpm check

# Run tests
pnpm test

# Run specific test
pnpm test tests/file.test.ts

# Build locally
pnpm build

# View git history
git log --oneline main | head -20

# Revert commit
git revert <commit-hash>

# Check Sentry errors
curl -X GET https://sentry.io/api/0/organizations/tyg/issues/ \
  -H "Authorization: Bearer $SENTRY_TOKEN"
```

---

**Last Updated:** June 11, 2026  
**Next Review:** June 25, 2026  
**Maintained By:** DevOps Team
