import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileHeader from '../../components/ProfileHeader';

describe('ProfileHeader', () => {
  const meta = [
    { icon: <span>I</span>, label: 'Phone', value: '(555) 123-4567' },
    { icon: <span>I</span>, label: 'Gender', value: 'Male' },
  ];

  it('renders name and role', () => {
    render(<ProfileHeader name="Alice Smith" email="alice@test.com" role="member" meta={meta} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('renders email', () => {
    render(<ProfileHeader name="Bob" email="bob@test.com" role="trainer" meta={meta} />);
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('renders meta items', () => {
    render(<ProfileHeader name="Alice" email="a@b.com" role="admin" meta={meta} />);
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
  });

  it('renders avatar initials from name', () => {
    render(<ProfileHeader name="John Doe" email="j@d.com" role="member" meta={[]} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders role label for admin', () => {
    render(<ProfileHeader name="A" email="a@b.com" role="admin" meta={[]} />);
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('renders role label for trainer', () => {
    render(<ProfileHeader name="A" email="a@b.com" role="trainer" meta={[]} />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
  });

  it('falls back to raw role when not in roleLabels', () => {
    render(<ProfileHeader name="A" email="a@b.com" role="manager" meta={[]} />);
    expect(screen.getByText('manager')).toBeInTheDocument();
  });

  it('renders dash for meta items with null value', () => {
    const nullMeta = [
      { icon: <span>I</span>, label: 'Phone', value: null },
      { icon: <span>I</span>, label: 'Address', value: '' },
    ];
    render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={nullMeta} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders dash for meta item with undefined value', () => {
    const undefinedMeta = [
      { icon: <span>I</span>, label: 'Phone', value: undefined },
    ];
    render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={undefinedMeta} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders no meta section when meta is empty array', () => {
    const { container } = render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={[]} />);
    expect(container.querySelector('.space-y-3')).not.toBeInTheDocument();
  });

  it('renders no meta section when meta is not provided (default)', () => {
    const { container } = render(<ProfileHeader name="Test" email="t@t.com" role="member" />);
    expect(container.querySelector('.space-y-3')).not.toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<ProfileHeader name="Alice" email="a@b.com" role="member" meta={[]} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders two initials max for long name', () => {
    render(<ProfileHeader name="Alice Bob Carol" email="a@b.com" role="member" meta={[]} />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('handles empty name gracefully', () => {
    render(<ProfileHeader name="" email="a@b.com" role="member" meta={[]} />);
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('handles null name gracefully', () => {
    render(<ProfileHeader name={null} email="a@b.com" role="member" meta={[]} />);
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('renders meta icons', () => {
    const iconMeta = [
      { icon: <span data-testid="phone-icon">P</span>, label: 'Phone', value: '123' },
    ];
    render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={iconMeta} />);
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
  });

  it('renders meta labels in uppercase', () => {
    render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={meta} />);
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
  });

  it('renders dash for falsy value 0 (uses || operator)', () => {
    const zeroMeta = [
      { icon: <span>I</span>, label: 'Count', value: 0 },
    ];
    render(<ProfileHeader name="Test" email="t@t.com" role="member" meta={zeroMeta} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
