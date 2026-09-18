import {
  fromMinorUnits,
  hasAtMostTwoDecimals,
  numericAmountTransformer,
  toMinorUnits,
} from './money';

describe('class budget money helpers', () => {
  it('converts pg numeric strings and numbers to minor units', () => {
    expect(toMinorUnits('12.30')).toBe(1230);
    expect(toMinorUnits(12.3)).toBe(1230);
    expect(toMinorUnits('0.07')).toBe(7);
  });

  it('does not leak float errors into sums', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in floats.
    const sum = toMinorUnits(0.1) + toMinorUnits(0.2);
    expect(fromMinorUnits(sum)).toBe(0.3);
  });

  it('rounds float artefacts to the intended Rappen', () => {
    // 8.7 * 100 === 869.9999999999999 without rounding.
    expect(toMinorUnits(8.7)).toBe(870);
    expect(toMinorUnits(19.99)).toBe(1999);
  });

  it('maps numeric columns to numbers and keeps null', () => {
    expect(numericAmountTransformer.from('1500.50')).toBe(1500.5);
    expect(numericAmountTransformer.from(null)).toBeNull();
    expect(numericAmountTransformer.to(42)).toBe(42);
  });

  it('detects amounts with more than two decimals', () => {
    expect(hasAtMostTwoDecimals(10.25)).toBe(true);
    expect(hasAtMostTwoDecimals(10.255)).toBe(false);
  });
});
