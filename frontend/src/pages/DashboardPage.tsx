import { useSnippets } from '../hooks/useSnippets';
import { useTasks } from '../hooks/useTasks';
import { PriorityBadge } from '../components/PriorityBadge';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { data: snippets = [] } = useSnippets();
  const { data: tasks = [] } = useTasks();

  const openTasks = tasks.filter(t => t.status !== 'done');
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'done');
  const recentSnippets = snippets.slice(0, 3);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Open Tasks" value={openTasks.length} href="/tasks" />
        <StatCard label="Critical" value={criticalTasks.length} href="/tasks" accent="var(--danger)" />
        <StatCard label="Snippets" value={snippets.length} href="/snippets" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>High Priority Tasks</h3>
            <Link to="/tasks" style={{ fontSize: 12, color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {openTasks.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 5).map(t => (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <PriorityBadge priority={t.priority} />
                <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
            {openTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No high priority tasks.</p>
            )}
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Snippets</h3>
            <Link to="/snippets" style={{ fontSize: 12, color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSnippets.map(s => (
              <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{s.language}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{s.title}</span>
                {s.ai_explanation && <span style={{ fontSize: 10, color: 'var(--accent)' }}>✨</span>}
              </div>
            ))}
            {recentSnippets.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>No snippets yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, accent = 'var(--accent)' }: { label: string; value: number; href: string; accent?: string }) {
  return (
    <Link to={href} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', cursor: 'pointer' }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: accent }}>{value}</p>
      </div>
    </Link>
  );
}
