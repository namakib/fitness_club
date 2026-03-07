import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ChevronIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  EyeSlashIcon,
  DashboardIcon,
  DEFAULT_ICON_VARIANT,
} from '../../components/Icons';

describe('Icons', () => {
  it('exports DEFAULT_ICON_VARIANT', () => {
    expect(DEFAULT_ICON_VARIANT).toBeDefined();
    expect(typeof DEFAULT_ICON_VARIANT).toBe('string');
  });

  it('ChevronIcon renders', () => {
    const { container } = render(<ChevronIcon direction="right" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('CheckIcon renders', () => {
    const { container } = render(<CheckIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('CloseIcon renders', () => {
    const { container } = render(<CloseIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('SearchIcon renders', () => {
    const { container } = render(<SearchIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('PlusIcon renders', () => {
    const { container } = render(<PlusIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('SunIcon and MoonIcon render', () => {
    expect(render(<SunIcon />).container.firstChild).toBeTruthy();
    expect(render(<MoonIcon />).container.firstChild).toBeTruthy();
  });

  it('EyeIcon renders in svg variant', () => {
    const { container } = render(<EyeIcon variant="svg" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('EyeSlashIcon renders', () => {
    const { container } = render(<EyeSlashIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('DashboardIcon renders', () => {
    const { container } = render(<DashboardIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('icons accept className prop', () => {
    const { container } = render(<SearchIcon className="h-6 w-6 text-red-500" />);
    expect(container.firstChild).toBeTruthy();
  });
});
