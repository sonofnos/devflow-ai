import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SnippetsPage } from './pages/SnippetsPage';
import { TasksPage } from './pages/TasksPage';
import { useAuth } from './hooks/useAuth';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } });

function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px' }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>DevFlow AI</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{user.name}</p>
        </div>
        {[{ to: '/', label: 'Dashboard' }, { to: '/snippets', label: 'Snippets' }, { to: '/tasks', label: 'Tasks' }].map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'block', padding: '9px 20px', fontSize: 14, fontWeight: 500, textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--muted)',
            background: isActive ? 'var(--accent)11' : 'none',
          })}>
            {label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '0 20px' }}>
          <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', width: '100%' }}>
            Sign out
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/snippets" element={<SnippetsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
