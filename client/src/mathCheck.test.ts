import { describe, it, expect } from 'vitest';
import { computeMathCheck } from './mathCheck';

describe('computeMathCheck', () => {
  it('sums line items with tax and tip, minus discount', () => {
    const result = computeMathCheck(
      [{ amount: 10 }, { amount: 5.50 }],
      1.24,  // tax
      2.00,  // tip
      null,  // no discount
    );
    expect(result).toBeCloseTo(18.74, 2);
  });

  it('subtracts discount correctly', () => {
    const result = computeMathCheck(
      [{ amount: 20 }],
      1.60,  // tax
      null,  // no tip
      5.00,  // discount
    );
    // 20 + 1.60 - 5.00 = 16.60
    expect(result).toBeCloseTo(16.60, 2);
  });

  it('handles all-null optional fields', () => {
    const result = computeMathCheck(
      [{ amount: 9.99 }, { amount: 4.50 }],
      null,
      null,
      null,
    );
    expect(result).toBeCloseTo(14.49, 2);
  });

  it('returns 0 with no line items and no extras', () => {
    const result = computeMathCheck([], null, null, null);
    expect(result).toBe(0);
  });

  it('handles NaN amounts gracefully (treats as 0)', () => {
    const result = computeMathCheck(
      [{ amount: NaN }, { amount: 5 }],
      null,
      null,
      null,
    );
    expect(result).toBeCloseTo(5, 2);
  });
});
