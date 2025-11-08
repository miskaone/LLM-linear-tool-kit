/**
 * Bench Testing Harness for Linear Toolkit
 * Measures speed, reliability, and accuracy of operations
 */

import * as fs from 'fs';
import * as path from 'path';

export interface BenchResult {
  name: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  params?: Record<string, any>;
}

export interface BenchMetrics {
  operationName: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50Time: number;
  p95Time: number;
  p99Time: number;
  successRate: number;
  errors: Map<string, number>;
}

export interface BenchReport {
  timestamp: Date;
  summary: {
    totalTests: number;
    successful: number;
    failed: number;
    totalDuration: number;
  };
  metrics: BenchMetrics[];
  rawResults: BenchResult[];
}

/**
 * BenchHarness - Main benchmarking class
 * Tracks performance metrics for Linear Toolkit operations
 */
export class BenchHarness {
  private results: BenchResult[] = [];
  private resultsDir: string;

  constructor(resultsDir: string = './bench-results') {
    this.resultsDir = resultsDir;
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  }

  /**
   * Run an operation and measure performance
   */
  async runOperation<T>(
    name: string,
    operation: string,
    params: any,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    let success = false;
    let error: string | undefined;
    let result: T | undefined;

    try {
      result = await fn();
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const duration = performance.now() - startTime;

    this.results.push({
      name,
      operation,
      duration,
      success,
      error,
      timestamp: new Date(),
      params,
    });

    return { result: result as T, duration };
  }

  /**
   * Get aggregated metrics
   */
  getMetrics(): BenchMetrics[] {
    const grouped = new Map<string, BenchResult[]>();

    for (const result of this.results) {
      if (!grouped.has(result.operation)) {
        grouped.set(result.operation, []);
      }
      grouped.get(result.operation)!.push(result);
    }

    const metrics: BenchMetrics[] = [];

    for (const [operation, results] of grouped) {
      const successful = results.filter((r) => r.success);
      const durations = successful.map((r) => r.duration).sort((a, b) => a - b);
      const errors = new Map<string, number>();

      for (const result of results.filter((r) => r.error)) {
        const key = result.error || 'Unknown';
        errors.set(key, (errors.get(key) || 0) + 1);
      }

      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];
      const p99 = durations[Math.floor(durations.length * 0.99)];

      metrics.push({
        operationName: operation,
        count: results.length,
        totalTime: durations.reduce((a, b) => a + b, 0),
        avgTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        minTime: Math.min(...durations),
        maxTime: Math.max(...durations),
        p50Time: p50,
        p95Time: p95,
        p99Time: p99,
        successRate: (successful.length / results.length) * 100,
        errors,
      });
    }

    return metrics;
  }

  /**
   * Save results to JSON file
   */
  saveResults(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = path.join(this.resultsDir, `bench-${timestamp}.json`);

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    const report: BenchReport = {
      timestamp: new Date(),
      summary: {
        totalTests: this.results.length,
        successful: this.results.filter((r) => r.success).length,
        failed: this.results.filter((r) => !r.success).length,
        totalDuration,
      },
      metrics: this.getMetrics(),
      rawResults: this.results,
    };

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📊 Results saved to: ${filename}`);

    return filename;
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const metrics = this.getMetrics();
    const summary = this.getSummary();

    console.log('\n════════════════════════════════════════════');
    console.log('📊 BENCH TESTING SUMMARY');
    console.log('════════════════════════════════════════════\n');

    console.log('Overall Results:');
    console.log(`  Total Tests: ${summary.totalTests}`);
    console.log(`  ✅ Successful: ${summary.successful}`);
    console.log(`  ❌ Failed: ${summary.failed}`);
    console.log(`  Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`  Total Duration: ${summary.totalDuration.toFixed(0)}ms\n`);

    // Sort by operation name
    const sorted = [...metrics].sort((a, b) =>
      a.operationName.localeCompare(b.operationName)
    );

    console.log('Performance by Operation:');
    console.log('────────────────────────────────────────────\n');

    for (const metric of sorted) {
      console.log(`📌 ${metric.operationName}`);
      console.log(
        `   Tests: ${metric.count} (${metric.successRate.toFixed(1)}% success)`
      );
      console.log(
        `   Timing: avg=${metric.avgTime.toFixed(2)}ms, min=${metric.minTime.toFixed(
          2
        )}ms, max=${metric.maxTime.toFixed(2)}ms`
      );
      console.log(
        `   Percentiles: p50=${metric.p50Time.toFixed(2)}ms, p95=${metric.p95Time.toFixed(
          2
        )}ms, p99=${metric.p99Time.toFixed(2)}ms`
      );

      if (metric.errors.size > 0) {
        console.log(`   ⚠️  Errors:`);
        for (const [error, count] of metric.errors) {
          console.log(`       - ${error} (${count}x)`);
        }
      }
      console.log();
    }

    // Recommendations
    console.log('────────────────────────────────────────────');
    console.log('📈 Recommendations:\n');

    const slow = metrics.filter((m) => m.avgTime > 500);
    if (slow.length > 0) {
      console.log('⚠️  Operations to Optimize (>500ms avg):');
      for (const metric of slow) {
        console.log(`   - ${metric.operationName}: ${metric.avgTime.toFixed(2)}ms`);
      }
      console.log();
    }

    const unreliable = metrics.filter((m) => m.successRate < 99);
    if (unreliable.length > 0) {
      console.log('⚠️  Low Reliability (<99% success):');
      for (const metric of unreliable) {
        console.log(
          `   - ${metric.operationName}: ${metric.successRate.toFixed(1)}%`
        );
      }
      console.log();
    }

    if (slow.length === 0 && unreliable.length === 0) {
      console.log('✅ All operations performing well!\n');
    }
  }

  /**
   * Get summary statistics
   */
  private getSummary() {
    const successful = this.results.filter((r) => r.success).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalTests: total,
      successful,
      failed: total - successful,
      successRate: (successful / total) * 100,
      totalDuration,
    };
  }

  /**
   * Compare with previous results
   */
  compareWithPrevious(): void {
    const files = fs
      .readdirSync(this.resultsDir)
      .filter((f) => f.startsWith('bench-') && f.endsWith('.json'))
      .sort();

    if (files.length < 2) {
      console.log('⚠️  Need at least 2 benchmark runs to compare');
      return;
    }

    const latest = JSON.parse(
      fs.readFileSync(path.join(this.resultsDir, files[files.length - 1]), 'utf-8')
    );
    const previous = JSON.parse(
      fs.readFileSync(path.join(this.resultsDir, files[files.length - 2]), 'utf-8')
    );

    console.log('\n════════════════════════════════════════════');
    console.log('📊 COMPARISON WITH PREVIOUS RUN');
    console.log('════════════════════════════════════════════\n');

    const latestMetrics = new Map(
      latest.metrics.map((m: BenchMetrics) => [m.operationName, m])
    );
    const prevMetrics = new Map(
      previous.metrics.map((m: BenchMetrics) => [m.operationName, m])
    );

    for (const [op, current] of latestMetrics) {
      const prev = prevMetrics.get(op);
      if (!prev) {
        console.log(`📌 ${op} (NEW)`);
        console.log(`   ${current.avgTime.toFixed(2)}ms avg\n`);
        continue;
      }

      const timeDiff = current.avgTime - prev.avgTime;
      const timeDiffPercent = (timeDiff / prev.avgTime) * 100;
      const arrow = timeDiff > 0 ? '📈' : '📉';

      console.log(`📌 ${op}`);
      console.log(
        `   ${prev.avgTime.toFixed(2)}ms → ${current.avgTime.toFixed(
          2
        )}ms ${arrow} ${timeDiffPercent > 0 ? '+' : ''}${timeDiffPercent.toFixed(1)}%`
      );

      if (Math.abs(timeDiffPercent) > 20) {
        console.log(
          `   ⚠️  Significant change: ${Math.abs(timeDiffPercent).toFixed(1)}%`
        );
      }
      console.log();
    }
  }

  /**
   * Export results as CSV
   */
  exportAsCSV(filename: string = 'bench-results.csv'): void {
    const filepath = path.join(this.resultsDir, filename);

    let csv =
      'Name,Operation,Duration(ms),Success,Error,Timestamp\n';
    for (const result of this.results) {
      const row = [
        result.name,
        result.operation,
        result.duration.toFixed(2),
        result.success ? 'yes' : 'no',
        result.error || '',
        result.timestamp.toISOString(),
      ];
      csv += row.map((v) => `"${v}"`).join(',') + '\n';
    }

    fs.writeFileSync(filepath, csv);
    console.log(`📄 CSV exported to: ${filepath}`);
  }

  /**
   * Reset results
   */
  reset(): void {
    this.results = [];
  }
}
