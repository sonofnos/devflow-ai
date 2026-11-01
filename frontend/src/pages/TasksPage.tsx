import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useAIPrioritize } from '../hooks/useTasks';
import { PriorityBadge } from '../components/PriorityBadge';
import type { Task } from '../types';

const STATUS_COLS: Task['status'][] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<Task['status'], string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const aiPrio = useAIPrioritize();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ title, description: desc });
    setTitle(''); setDesc(''); setShowForm(false);
  }

  if (isLoading) return <p style={{ padding: 24, color: 'var(--muted)' }}>Loading…</p>;

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tasks</h2>
        <button onClick={() => aiPrio.mutate()} disabled={aiPrio.isPending} style={accentBtn}>
          {aiPrio.isPending ? 'Prioritizing…' : '✨ AI Prioritize'}
        </button>
        <button onClick={() => setShowForm(!showForm)} style={outlineBtn}>{showForm ? 'Cancel' : '+ New Task'}</button>
        {aiPrio.isSuccess && <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ {aiPrio.data?.updated} tasks updated</span>}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <label style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            Title<input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title" />
          </label>
          <label style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            Description (helps AI prioritize)
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What needs to be done and why?" />
          </label>
          <button type="submit" disabled={create.isPending} style={{ ...accentBtn, marginBottom: 0 }}>{create.isPending ? 'Adding…' : 'Add'}</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STATUS_COLS.map(col => (
          <div key={col}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {STATUS_LABELS[col]} · {tasks.filter(t => t.status === col).length}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.4 }}>{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{task.description}</p>}
                  {task.ai_priority_reason && (
                    <p style={{ fontSize: 11, color: '#6366f1', background: '#6366f111', padding: '3px 6px', borderRadius: 4, marginBottom: 8 }}>
                      ✨ {task.ai_priority_reason}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {col !== 'todo' && <button onClick={() => update.mutate({ id: task.id, status: 'todo' })} style={microBtn}>← To Do</button>}
                    {col !== 'in_progress' && <button onClick={() => update.mutate({ id: task.id, status: 'in_progress' })} style={microBtn}>→ In Progress</button>}
                    {col !== 'done' && <button onClick={() => update.mutate({ id: task.id, status: 'done' })} style={microBtn}>✓ Done</button>}
                    <button onClick={() => del.mutate(task.id)} style={{ ...microBtn, color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col).length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--border)', padding: 8 }}>Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13 };
const accentBtn: React.CSSProperties = { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const outlineBtn: React.CSSProperties = { background: 'none', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' };
const microBtn: React.CSSProperties = { background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' };
