import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimePicker from '../../components/TimePicker';

function openPicker(props = {}) {
  const onChange = props.onChange || vi.fn();
  const result = render(<TimePicker value={props.value ?? ''} onChange={onChange} label={props.label} placeholder={props.placeholder || 'Pick time'} required={props.required} />);
  fireEvent.click(screen.getByText(props.value ? expect.anything() : (props.placeholder || 'Pick time')));
  return { ...result, onChange };
}

describe('TimePicker', () => {
  it('renders with label', () => {
    render(<TimePicker label="Start Time" value="" onChange={vi.fn()} />);
    expect(screen.getByText('Start Time')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<TimePicker value="" onChange={vi.fn()} placeholder="Pick time" />);
    expect(screen.getByText('Pick time')).toBeInTheDocument();
  });

  it('displays formatted time value for afternoon time', () => {
    render(<TimePicker value="14:30" onChange={vi.fn()} />);
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('opens picker on click', () => {
    render(<TimePicker value="" onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Enter time')).toBeInTheDocument();
    expect(screen.getByText('Hour')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<TimePicker label="Time" value="" onChange={vi.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<TimePicker value="" onChange={vi.fn()} />);
    expect(screen.getByText('Select time')).toBeInTheDocument();
  });

  it('displays morning time with am', () => {
    render(<TimePicker value="09:15" onChange={vi.fn()} />);
    expect(screen.getByText(/9:15 am/)).toBeInTheDocument();
  });

  it('displays 12:00 as 12:00 pm', () => {
    render(<TimePicker value="12:00" onChange={vi.fn()} />);
    expect(screen.getByText(/12:00 pm/)).toBeInTheDocument();
  });

  it('displays 00:00 as 12:00 am', () => {
    render(<TimePicker value="00:00" onChange={vi.fn()} />);
    expect(screen.getByText(/12:00 am/)).toBeInTheDocument();
  });

  it('closes on outside click', () => {
    openPicker();
    expect(screen.getByText('Enter time')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Enter time')).not.toBeInTheDocument();
  });

  it('toggles open/closed on button click', () => {
    render(<TimePicker value="" onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Enter time')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.queryByText('Enter time')).not.toBeInTheDocument();
  });

  describe('hour spinner', () => {
    it('increments hour', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const upButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(upButtons[1]);
      expect(onChange).toHaveBeenCalledWith('10:00');
    });

    it('decrements hour', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const downButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(downButtons[2]);
      expect(onChange).toHaveBeenCalledWith('08:00');
    });

    it('wraps hour from 12 to 1 on increment', () => {
      const onChange = vi.fn();
      render(<TimePicker value="00:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/12:00/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[1]);
      expect(onChange).toHaveBeenCalledWith('01:00');
    });

    it('wraps hour from 1 to 12 on decrement', () => {
      const onChange = vi.fn();
      render(<TimePicker value="01:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/1:00/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith('00:00');
    });
  });

  describe('minute spinner', () => {
    it('increments minute', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[3]);
      expect(onChange).toHaveBeenCalledWith('09:31');
    });

    it('decrements minute', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[4]);
      expect(onChange).toHaveBeenCalledWith('09:29');
    });

    it('wraps minute from 59 to 0', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:59" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:59/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[3]);
      expect(onChange).toHaveBeenCalledWith('09:00');
    });

    it('wraps minute from 0 to 59', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const buttons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
      fireEvent.click(buttons[4]);
      expect(onChange).toHaveBeenCalledWith('09:59');
    });
  });

  describe('meridiem toggle', () => {
    it('toggles am to pm', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const pmButtons = screen.getAllByText('pm');
      fireEvent.click(pmButtons[0]);
      expect(onChange).toHaveBeenCalledWith('21:00');
    });

    it('toggles pm to am', () => {
      const onChange = vi.fn();
      render(<TimePicker value="14:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/2:00/));
      const amButtons = screen.getAllByText('am');
      fireEvent.click(amButtons[0]);
      expect(onChange).toHaveBeenCalledWith('02:00');
    });
  });

  describe('Now and Clear buttons', () => {
    it('sets current time on Now click', () => {
      const onChange = vi.fn();
      render(<TimePicker value="" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      fireEvent.click(screen.getByText('Now'));
      expect(onChange).toHaveBeenCalledTimes(1);
      const val = onChange.mock.calls[0][0];
      expect(val).toMatch(/^\d{2}:\d{2}$/);
    });

    it('clears value on Clear click', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      fireEvent.click(screen.getByText('Clear'));
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('scroll column clicks', () => {
    it('selects hour from scroll column', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const hourButtons = screen.getAllByText('03');
      fireEvent.click(hourButtons[0]);
      expect(onChange).toHaveBeenCalledWith('03:00');
    });

    it('selects minute from scroll column', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const minuteButtons = screen.getAllByText('45');
      fireEvent.click(minuteButtons[0]);
      expect(onChange).toHaveBeenCalledWith('09:45');
    });

    it('selects meridiem from scroll column', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const pmButtons = screen.getAllByText('pm');
      const lastPm = pmButtons[pmButtons.length - 1];
      fireEvent.click(lastPm);
      expect(onChange).toHaveBeenCalledWith('21:00');
    });
  });

  describe('hour input blur', () => {
    it('clamps invalid low hour to 1', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const hourInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.focus(hourInput);
      fireEvent.change(hourInput, { target: { value: '0' } });
      fireEvent.blur(hourInput);
      expect(onChange).toHaveBeenCalledWith('01:00');
    });

    it('clamps high hour to 12', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const hourInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.focus(hourInput);
      fireEvent.change(hourInput, { target: { value: '15' } });
      fireEvent.blur(hourInput);
      expect(onChange).toHaveBeenCalledWith('00:00');
    });

    it('accepts valid hour input', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const hourInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.focus(hourInput);
      fireEvent.change(hourInput, { target: { value: '5' } });
      fireEvent.blur(hourInput);
      expect(onChange).toHaveBeenCalledWith('05:00');
    });

    it('clamps NaN hour to 1', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:00" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:00/));
      const hourInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.focus(hourInput);
      fireEvent.change(hourInput, { target: { value: 'abc' } });
      fireEvent.blur(hourInput);
      expect(onChange).toHaveBeenCalledWith('01:00');
    });
  });

  describe('minute input blur', () => {
    it('clamps negative minute to 0', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const minuteInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.focus(minuteInput);
      fireEvent.change(minuteInput, { target: { value: '-5' } });
      fireEvent.blur(minuteInput);
      expect(onChange).toHaveBeenCalledWith('09:00');
    });

    it('clamps high minute to 59', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const minuteInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.focus(minuteInput);
      fireEvent.change(minuteInput, { target: { value: '99' } });
      fireEvent.blur(minuteInput);
      expect(onChange).toHaveBeenCalledWith('09:59');
    });

    it('accepts valid minute input', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const minuteInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.focus(minuteInput);
      fireEvent.change(minuteInput, { target: { value: '15' } });
      fireEvent.blur(minuteInput);
      expect(onChange).toHaveBeenCalledWith('09:15');
    });

    it('clamps NaN minute to 0', () => {
      const onChange = vi.fn();
      render(<TimePicker value="09:30" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText(/9:30/));
      const minuteInput = screen.getAllByRole('spinbutton')[1];
      fireEvent.focus(minuteInput);
      fireEvent.change(minuteInput, { target: { value: 'abc' } });
      fireEvent.blur(minuteInput);
      expect(onChange).toHaveBeenCalledWith('09:00');
    });
  });

  describe('formatTimeDisplay edge cases', () => {
    it('handles invalid time string gracefully', () => {
      render(<TimePicker value="invalid" onChange={vi.fn()} />);
      expect(screen.getByText('invalid')).toBeInTheDocument();
    });
  });

  describe('no value defaults', () => {
    it('defaults to hour 12, minute 0, am when no value and picker opened', () => {
      const onChange = vi.fn();
      render(<TimePicker value="" onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      const hourInput = screen.getAllByRole('spinbutton')[0];
      expect(hourInput.value).toBe('12');
    });
  });
});
