import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './PriorityBadge';

describe('PriorityBadge', () => {
  it.each(['critical', 'high', 'medium', 'low'] as const)('renders %s priority', (p) => {
    render(<PriorityBadge priority={p} />);
    expect(screen.getByText(p)).toBeInTheDocument();
  });
});
