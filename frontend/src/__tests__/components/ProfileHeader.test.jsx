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
});
