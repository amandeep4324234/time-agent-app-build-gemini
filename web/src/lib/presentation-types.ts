/**
 * Read-Time Presentation Contracts
 * Authority: TIMEFRAME-UI-REDESIGN.md §10
 */

export type Availability =
  | 'ready'
  | 'loading'
  | 'no-data'
  | 'light-day'
  | 'partial'
  | 'permission-needed'
  | 'error';

export type Metric = {
  value: number | null; // null is unavailable, never render as zero
  unit: 'seconds' | 'count';
  basis: 'all-devices-safe' | 'phone-safe' | 'computer-safe';
  availability: Availability;
  explanation: string; // approved display-safe copy
};

export type Insight = {
  key: string; // stable family + safe grouping key
  family: string;
  sentence: string; // generated from approved template
  windowLabel: string;
  sampleCount: number;
  excludedCount: number; // only when disclosure-safe
  statistic: 'duration' | 'count' | 'share' | 'median' | 'mean';
  evidenceKey: string; // opaque non-sensitive lookup key
  availability: Availability;
};

export type Evidence = {
  title: string;
  calculation: string;
  windowLabel: string;
  chart: 'timeline' | 'histogram' | 'bars' | 'none';
  rows: Array<Record<string, string | number | null>>;
  limitations: string[];
};
