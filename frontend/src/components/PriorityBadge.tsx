import type { Task } from '../types';

const colours: Record<Task['priority'], string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#64748b',
};

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: colours[priority] + '22',
      color: colours[priority],
      border: `1px solid ${colours[priority]}44`,
    }}>
      {priority}
    </span>
  );
}
