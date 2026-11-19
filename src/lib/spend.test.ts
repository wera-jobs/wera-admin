import { describe, expect, it } from 'vitest';
import { spendLevel, spendPercent } from './spend';

describe('spend against the monthly cap', () => {
  it('warns from 80%, and says when the cap is reached', () => {
    expect(spendLevel(79.99, 100)).toBe('ok');
    expect(spendLevel(80, 100)).toBe('near');
    expect(spendLevel(99.99, 100)).toBe('near');
    expect(spendLevel(100, 100)).toBe('reached');
    expect(spendLevel(130, 100)).toBe('reached');
  });

  it('has nothing to say without a cap', () => {
    expect(spendLevel(500, 0)).toBe('ok');
    expect(spendPercent(500, 0)).toBe(0);
    expect(spendPercent(130, 100)).toBe(100);
  });
});
