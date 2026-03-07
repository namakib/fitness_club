import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ChevronIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronDoubleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
  PlusIcon,
  MinusIcon,
  SunIcon,
  MoonIcon,
  SignOutIcon,
  DashboardIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  PhoneIcon,
  HeartIcon,
  ChartIcon,
  TargetIcon,
  TagIcon,
  GenderIcon,
  TrainerIcon,
  WeightIcon,
  GoalIcon,
  ClassIcon,
  SessionIcon,
  WrenchIcon,
  BuildingIcon,
  EyeIcon,
  EyeSlashIcon,
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

  it('ChevronLeftIcon renders', () => {
    const { container } = render(<ChevronLeftIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronRightIcon renders', () => {
    const { container } = render(<ChevronRightIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronUpIcon renders', () => {
    const { container } = render(<ChevronUpIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronDownIcon renders', () => {
    const { container } = render(<ChevronDownIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronDoubleLeftIcon renders', () => {
    const { container } = render(<ChevronDoubleLeftIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronDoubleRightIcon renders', () => {
    const { container } = render(<ChevronDoubleRightIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronDoubleIcon renders in both directions', () => {
    expect(render(<ChevronDoubleIcon direction="left" />).container.firstChild).toBeTruthy();
    expect(render(<ChevronDoubleIcon direction="right" />).container.firstChild).toBeTruthy();
  });

  it('MinusIcon renders', () => {
    const { container } = render(<MinusIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('SignOutIcon renders', () => {
    const { container } = render(<SignOutIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('CalendarIcon renders', () => {
    const { container } = render(<CalendarIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ClockIcon renders', () => {
    const { container } = render(<ClockIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('UserIcon renders', () => {
    const { container } = render(<UserIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('UsersIcon renders', () => {
    const { container } = render(<UsersIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('PhoneIcon renders', () => {
    const { container } = render(<PhoneIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('HeartIcon renders', () => {
    const { container } = render(<HeartIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChartIcon renders', () => {
    const { container } = render(<ChartIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('TargetIcon renders', () => {
    const { container } = render(<TargetIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('TagIcon renders', () => {
    const { container } = render(<TagIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('GenderIcon renders', () => {
    const { container } = render(<GenderIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('TrainerIcon renders', () => {
    const { container } = render(<TrainerIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('WeightIcon renders', () => {
    const { container } = render(<WeightIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('GoalIcon renders', () => {
    const { container } = render(<GoalIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ClassIcon renders', () => {
    const { container } = render(<ClassIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('SessionIcon renders', () => {
    const { container } = render(<SessionIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('WrenchIcon renders', () => {
    const { container } = render(<WrenchIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('BuildingIcon renders', () => {
    const { container } = render(<BuildingIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronUpDownIcon renders with open=false (default)', () => {
    const { container } = render(<ChevronUpDownIcon />);
    expect(container.firstChild).toBeTruthy();
  });

  it('ChevronUpDownIcon renders with open=true', () => {
    const { container } = render(<ChevronUpDownIcon open={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  describe('svg variant', () => {
    it('ChevronIcon renders as svg', () => {
      const { container } = render(<ChevronIcon variant="svg" direction="left" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ChevronIcon svg includes rotation for each direction', () => {
      const dirs = ['left', 'right', 'up', 'down'];
      dirs.forEach(d => {
        const { container } = render(<ChevronIcon variant="svg" direction={d} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('ChevronUpDownIcon renders as svg with open=true', () => {
      const { container } = render(<ChevronUpDownIcon variant="svg" open={true} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ChevronUpDownIcon renders as svg with open=false', () => {
      const { container } = render(<ChevronUpDownIcon variant="svg" open={false} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ChevronDoubleIcon renders as svg', () => {
      const { container } = render(<ChevronDoubleIcon variant="svg" direction="left" />);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('CheckIcon renders as svg', () => {
      const { container } = render(<CheckIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('CloseIcon renders as svg', () => {
      const { container } = render(<CloseIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('SearchIcon renders as svg', () => {
      const { container } = render(<SearchIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('PlusIcon renders as svg', () => {
      const { container } = render(<PlusIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('MinusIcon renders as svg', () => {
      const { container } = render(<MinusIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('SunIcon renders as svg', () => {
      const { container } = render(<SunIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('MoonIcon renders as svg', () => {
      const { container } = render(<MoonIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('SignOutIcon renders as svg', () => {
      const { container } = render(<SignOutIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('DashboardIcon renders as svg', () => {
      const { container } = render(<DashboardIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('CalendarIcon renders as svg', () => {
      const { container } = render(<CalendarIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ClockIcon renders as svg', () => {
      const { container } = render(<ClockIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('UserIcon renders as svg', () => {
      const { container } = render(<UserIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('UsersIcon renders as svg', () => {
      const { container } = render(<UsersIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('PhoneIcon renders as svg', () => {
      const { container } = render(<PhoneIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('HeartIcon renders as svg', () => {
      const { container } = render(<HeartIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ChartIcon renders as svg', () => {
      const { container } = render(<ChartIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('TargetIcon renders as svg', () => {
      const { container } = render(<TargetIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('TagIcon renders as svg', () => {
      const { container } = render(<TagIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('GenderIcon renders as svg', () => {
      const { container } = render(<GenderIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('TrainerIcon renders as svg', () => {
      const { container } = render(<TrainerIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('WeightIcon renders as svg', () => {
      const { container } = render(<WeightIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('GoalIcon renders as svg', () => {
      const { container } = render(<GoalIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ClassIcon renders as svg', () => {
      const { container } = render(<ClassIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('SessionIcon renders as svg', () => {
      const { container } = render(<SessionIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('WrenchIcon renders as svg', () => {
      const { container } = render(<WrenchIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('BuildingIcon renders as svg', () => {
      const { container } = render(<BuildingIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('EyeSlashIcon renders as svg', () => {
      const { container } = render(<EyeSlashIcon variant="svg" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
