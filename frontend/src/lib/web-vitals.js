import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { analytics } from './analytics';

/**
 * Web Vitals performance monitoring.
 *
 * Tracks Core Web Vitals (LCP, CLS, INP) plus supplementary metrics
 * (FCP, TTFB). Metrics are logged to the console in development and
 * sent to the analytics module for aggregation.
 *
 * Thresholds based on Google's "good" / "needs improvement" / "poor":
 *   - LCP: ≤2.5s good, ≤4s needs improvement, >4s poor
 *   - CLS: ≤0.1 good, ≤0.25 needs improvement, >0.25 poor
 *   - INP: ≤200ms good, ≤500ms needs improvement, >500ms poor
 *   - FCP: ≤1.8s good, ≤3s needs improvement, >3s poor
 *   - TTFB: ≤800ms good, ≤1800ms needs improvement, >1800ms poor
 */

const THRESHOLDS = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function getRating(name, value) {
  const [good, poor] = THRESHOLDS[name] || [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function handleMetric(metric) {
  const rating = getRating(metric.name, metric.value);
  const entry = {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating,
    delta: Math.round(metric.delta),
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Log in development
  if (import.meta.env.DEV) {
    const color = rating === 'good' ? '#0cce6b' : rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';
    console.log(
      `%c[Web Vitals] ${entry.name}: ${metric.name === 'CLS' ? metric.value.toFixed(3) : `${entry.value}ms`} (${rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }

  // Send to analytics
  analytics.trackPerformance(entry.name, entry.value, entry.rating);
}

/**
 * Initialize Web Vitals tracking. Call once from main.jsx.
 * Uses the attribution build for detailed debugging info in development.
 */
export function reportWebVitals() {
  onLCP(handleMetric);
  onCLS(handleMetric);
  onINP(handleMetric);
  onFCP(handleMetric);
  onTTFB(handleMetric);
}
