import { useState } from 'react';
import { useSnippets, useCreateSnippet, useDeleteSnippet, useExplainSnippet } from '../hooks/useSnippets';

const LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'sql', 'bash', 'other'];

export function SnippetsPage() {
  const { data: snippets = [], isLoading } = useSnippets();
  const create = useCreateSnippet();
  const del = useDeleteSnippet();
  const explain = useExplainSnippet();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ title, language, code, tags: tags.split(',').map(t => t.trim()).filter(Boolean) });
    setTitle(''); setLanguage('typescript'); setCode(''); setTags(''); setShowForm(false);
  }

  if (isLoading) return <p style={{ padding: 24, color: 'var(--muted)' }}>Loading…</p>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Code Snippets</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>{showForm ? 'Cancel' : '+ New Snippet'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={labelStyle}>Title<input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. useDebounce hook" /></label>
            <label style={labelStyle}>Language
              <select style={inputStyle} value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Code
            <textarea style={{ ...inputStyle, fontFamily: 'monospace', minHeight: 140, resize: 'vertical' }} value={code} onChange={e => setCode(e.target.value)} required />
          </label>
          <label style={{ ...labelStyle, marginBottom: 16 }}>Tags (comma-separated)<input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="react, hooks, performance" /></label>
          <button type="submit" disabled={create.isPending} style={btnStyle}>{create.isPending ? 'Saving…' : 'Save Snippet'}</button>
        </form>
      )}

      {snippets.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No snippets yet. Save your first one.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {snippets.map(s => (
          <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{s.title}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{s.language}</span>
              {s.tags.map(t => <span key={t} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent)11', padding: '1px 6px', borderRadius: 4 }}>#{t}</span>)}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={ghostBtn}>
                  {expanded === s.id ? 'Collapse' : 'Expand'}
                </button>
                <button onClick={() => explain.mutate(s.id)} disabled={explain.isPending} style={ghostBtn}>
                  {explain.isPending ? '…' : '✨ Explain'}
                </button>
                <button onClick={() => del.mutate(s.id)} style={{ ...ghostBtn, color: 'var(--danger)' }}>Delete</button>
              </div>
            </div>
            {expanded === s.id && (
              <>
                <pre style={{ background: 'var(--bg)', borderRadius: 6, padding: 12, fontSize: 13, overflowX: 'auto', marginBottom: s.ai_explanation ? 12 : 0 }}><code>{s.code}</code></pre>
                {s.ai_explanation && (
                  <div style={{ background: '#6366f111', border: '1px solid #6366f133', borderRadius: 6, padding: 12, fontSize: 13, color: 'var(--text)' }}>
                    <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>✨ AI Explanation</p>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{s.ai_explanation}</div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 500 };
const inputStyle: React.CSSProperties = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13 };
const btnStyle: React.CSSProperties = { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' };
