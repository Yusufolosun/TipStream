import { describe, it, expect } from 'vitest';
import { formatSTX, toMicroSTX, cn } from '../lib/utils';

describe('formatSTX', () => {
  it('converts micro-STX to STX string', () => {
    expect(formatSTX(1000000)).toBe('1.000000');
  });

  it('handles zero', () => {
    expect(formatSTX(0)).toBe('0.000000');
  });

  it('respects custom decimal places', () => {
    expect(formatSTX(1500000, 2)).toBe('1.50');
  });

  it('formats small amounts correctly', () => {
    expect(formatSTX(1000, 6)).toBe('0.001000');
  });

  it('formats large amounts', () => {
    expect(formatSTX(10000000000, 2)).toBe('10000.00');
  });
});

describe('toMicroSTX', () => {
  it('converts STX to micro-STX', () => {
    expect(toMicroSTX(1)).toBe(1000000);
  });

  it('handles decimal values', () => {
    expect(toMicroSTX(0.5)).toBe(500000);
  });

  it('floors fractional micro-STX', () => {
    expect(toMicroSTX(0.0000001)).toBe(0);
  });

  it('handles string input', () => {
    expect(toMicroSTX('2.5')).toBe(2500000);
  });

  it('handles zero', () => {
    expect(toMicroSTX(0)).toBe(0);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });
});
