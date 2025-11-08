# Linear Toolkit - Bench Testing Suite

Comprehensive benchmarking for the Linear Toolkit with real-world scenarios.

---

## What's Tested

### **Scenario 1: Search Issues**
- Simple keyword searches
- Different result limits (5, 10, 20, 50)
- Various keywords (authentication, database, api, etc.)
- **Metric:** Query latency

### **Scenario 2: Repository Discovery** (org-wide mode only)
- List all repositories
- Search repositories by name/description
- Filter by programming language
- Get organization statistics
- **Metric:** Discovery speed & accuracy

### **Scenario 3: Commit Linking**
- Single issue reference (e.g., "closes LIN-123")
- Multiple issue references
- No issue references
- Edge cases (lowercase, different formats)
- **Metric:** Detection accuracy & linking speed

### **Scenario 4: Cache Performance**
- First call (cache miss)
- Repeated calls (cache hits)
- **Metric:** Cache effectiveness

### **Scenario 5: Stress Test**
- 10+ concurrent requests
- **Metric:** Reliability under load

---

## Quick Start

### 1. Prerequisites

```bash
# Ensure you have Linear Toolkit built
npm run build

# Install ts-node for running TypeScript
npm install -D ts-node @types/node
```

### 2. Run Benchmarks

```bash
# Run all scenarios
npx ts-node bench/run.ts

# Or add to package.json:
# "scripts": { "bench": "ts-node bench/run.ts" }
npm run bench
```

### 3. View Results

Results are saved to `bench-results/` as JSON files:

```bash
# Latest results
ls -lt bench-results/ | head -1

# View formatted results
cat bench-results/bench-*.json | jq .summary
```

---

## Expected Performance

### Baseline Metrics (Typical)

```
Operation              Avg Time    Min Time    Max Time    Success Rate
────────────────────────────────────────────────────────────────────
Search Issues          50-150ms    30ms        300ms       ✅ 99%+
List Repositories      200-500ms   150ms       1000ms      ✅ 99%+
Link Commit            50-100ms    30ms        150ms       ✅ 99%+
Cache Hit              <5ms        1ms         10ms        ✅ 100%
Stress Test (10 reqs)  avg varies  varies      varies      ✅ 98%+
```

### Interpretation

| Metric | Meaning |
|--------|---------|
| **Avg Time** | Expected latency for normal operation |
| **Min/Max** | Best/worst case performance |
| **Success Rate** | Reliability (>99% = production ready) |
| **P50/P95/P99** | Percentile latency (what % of requests complete in Xms) |

---

## Understanding Results

### Summary Section
```json
{
  "summary": {
    "totalTests": 87,
    "successful": 86,
    "failed": 1,
    "totalDuration": 12345
  }
}
```

### Metrics Section
```json
{
  "metrics": [
    {
      "operationName": "search-issues",
      "count": 23,
      "avgTime": 87.5,
      "minTime": 45.2,
      "maxTime": 234.8,
      "p50Time": 75.3,
      "p95Time": 198.4,
      "p99Time": 230.5,
      "successRate": 100.0,
      "errors": {}
    }
  ]
}
```

### Key Percentiles
- **p50 (Median):** 50% of requests are faster than this
- **p95:** 95% of requests are faster than this (indicates tail latency)
- **p99:** 99% of requests are faster than this (maximum typical latency)

---

## Comparing Results

The bench suite automatically compares with your previous run:

```bash
npx ts-node bench/run.ts

# Output includes:
# 📊 COMPARISON WITH PREVIOUS RUN
#
# search-issues
#   87.5ms → 92.3ms 📈 +5.5%
#
# list-repositories
#   312.4ms → 289.7ms 📉 -7.2%
```

**What to look for:**
- ✅ Performance stays stable (±5%)
- ✅ Success rate remains >99%
- ⚠️ Any change >20% should be investigated
- ❌ Degradation >50% indicates a problem

---

## Exporting Results

### As JSON (default)
```bash
# Results saved to bench-results/bench-YYYY-MM-DDTHH-MM-SS.json
cat bench-results/bench-*.json | jq .
```

### As CSV
```typescript
// In bench/run.ts after harness.saveResults():
harness.exportAsCSV('results.csv');
```

Then open `bench-results/results.csv` in Excel or Google Sheets for analysis.

---

## Custom Scenarios

Add your own test scenarios:

1. Create a new function in `bench/scenarios.ts`:

```typescript
export async function scenarioMyCustomTest(
  harness: BenchHarness,
  client: LinearAgentClient
): Promise<void> {
  console.log('\n📝 My Custom Test');

  await harness.runOperation(
    'Test Name',
    'operation-type',
    { /* params */ },
    async () => {
      // Your test code here
      return await client.someOperation();
    }
  );
}
```

2. Add to `runAllScenarios()` in the same file:

```typescript
await scenarioMyCustomTest(harness, client);
console.log('✅ Custom scenario complete\n');
```

3. Run benchmarks:

```bash
npm run bench
```

---

## Troubleshooting

### "Cannot find module 'linear-toolkit'"

```bash
# Make sure main toolkit is built
npm run build
```

### Tests timeout

```bash
# Increase timeout and reduce iterations
# Edit bench/scenarios.ts:
// await scenarioStressTest(harness, client, 5);  // Was 10
```

### High latency spikes

This is normal. Check p95/p99 percentiles:
- If p99 << max: occasional spikes (network fluctuation)
- If p99 ≈ max: consistent latency issue (needs investigation)

### GitHub API rate limit

```bash
# Check limit status
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit

# If limited, increase cache TTL in .env
REPO_CACHE_TTL=7200000  # 2 hours
```

---

## Production Readiness Checklist

Before deploying to production, ensure:

- [ ] All scenarios pass (success rate >99%)
- [ ] Average latency is acceptable for your use case
- [ ] P95 latency is <500ms (user-facing operations)
- [ ] Stress test passes with 10+ concurrent requests
- [ ] Results are stable across 3+ runs
- [ ] No unexpected error patterns

---

## Next Steps

1. **Run benchmarks locally:**
   ```bash
   npm run bench
   ```

2. **Analyze the results:**
   - Check `bench-results/` for JSON report
   - Look at summary and metrics sections
   - Review any errors or slow operations

3. **Integrate into your app:**
   - Copy relevant code from `docs/NEXTJS_INTEGRATION_BENCH.md`
   - Use API routes or NPM package in your app
   - Run periodic benchmarks to track performance

4. **Deploy with confidence:**
   - Use real-world benchmarks to validate
   - Monitor performance in production
   - Re-benchmark after major updates

---

## Files

```
bench/
├── harness.ts       # Benchmarking framework
├── scenarios.ts     # Test scenarios
├── run.ts          # Main runner
└── README.md       # This file
```

---

## Questions?

See the full documentation: `docs/NEXTJS_INTEGRATION_BENCH.md`

Good luck! 🚀
