import { describe, it, expect } from 'vitest';
import theme from '../theme';

describe('theme', () => {
  it('exports an object with core keys', () => {
    expect(typeof theme).toBe('object');
    expect(theme).not.toBeNull();
    expect(theme).toHaveProperty('btn');
    expect(theme).toHaveProperty('input');
    expect(theme).toHaveProperty('inputLg');
    expect(theme).toHaveProperty('cardBg');
    expect(theme).toHaveProperty('cardBorder');
    expect(theme).toHaveProperty('pageBg');
    expect(theme).toHaveProperty('pageText');
  });

  it('has statusBadge with expected statuses', () => {
    expect(theme.statusBadge).toBeDefined();
    expect(theme.statusBadge.active).toBeDefined();
    expect(theme.statusBadge.completed).toBeDefined();
    expect(theme.statusBadge.cancelled).toBeDefined();
    expect(theme.statusBadge.default).toBeDefined();
  });

  it('has chart color tokens', () => {
    expect(theme.chartPrimary).toBeDefined();
    expect(theme.chartColors).toBeDefined();
    expect(theme.chartColors.weight).toBeDefined();
    expect(theme.chartTooltip).toBeDefined();
  });

  it('has statIcon color variants', () => {
    expect(theme.statIcon.orange).toBeDefined();
    expect(theme.statIcon.emerald).toBeDefined();
    expect(theme.statIcon.violet).toBeDefined();
    expect(theme.statIcon.amber).toBeDefined();
  });

  it('values are strings for class tokens', () => {
    expect(typeof theme.btn).toBe('string');
    expect(typeof theme.input).toBe('string');
    expect(typeof theme.cardBg).toBe('string');
  });
});
