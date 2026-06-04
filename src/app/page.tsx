'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

type Stats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

type ProgressSnapshot = {
  id: number;
  user_id: number;
  date: string;
  leetcode_easy: number;
  leetcode_medium: number;
  leetcode_hard: number;
  tuf_total: number;
  tuf_easy: number;
  tuf_medium: number;
  tuf_hard: number;
};

type User = {
  id: number;
  name: string;
  leetcode_username: string;
  tuf_username: string;
  initial_lc_total: number;
  initial_tuf_total: number;
  today: ProgressSnapshot | null;
  past: ProgressSnapshot | null;
  dynamicLcToday?: number; // Fetched dynamically
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chartMode, setChartMode] = useState<'total' | 'today'>('today');
  
  // History State
  const [historyDate, setHistoryDate] = useState('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [lcUsername, setLcUsername] = useState('');
  const [tufUsername, setTufUsername] = useState('');

  const fetchUsers = async () => {
    const res = await fetch(`/api/sync?_t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      // Dynamically fetch Leetcode today for each user
      const usersWithDynamic = await Promise.all(data.map(async (u) => {
        try {
          const lcRes = await fetch(`/api/leetcode?username=${u.leetcode_username}&_t=${Date.now()}`);
          if (lcRes.ok) {
            const lcData = await lcRes.json();
            return { ...u, dynamicLcToday: lcData.solvedToday || 0 };
          }
        } catch (e) {
          console.error(e);
        }
        return u;
      }));
      setUsers(usersWithDynamic);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Set default history date to yesterday
    const yesterday = new Date(Date.now() - 86400000);
    const dateStr = yesterday.toISOString().split('T')[0];
    setHistoryDate(dateStr);
  }, []);

  useEffect(() => {
    if (historyDate && users.length > 0) {
      fetchHistoricalData(historyDate);
    }
  }, [historyDate, users]);

  const fetchHistoricalData = async (date: string) => {
    try {
      const res = await fetch(`/api/history?date=${date}&_t=${Date.now()}`);
      if (res.ok) {
        let data = await res.json();
        
        // If they select today's date, inject the highly accurate dynamic LeetCode tracking
        // so it matches the live dashboard without needing any manual baseline hacks!
        const todayStr = new Date().toISOString().split('T')[0];
        if (date === todayStr) {
          data = data.map((d: any) => {
            const user = users.find(u => u.name === d.name);
            if (user && user.dynamicLcToday !== undefined) {
              return { ...d, LeetCode: user.dynamicLcToday };
            }
            return d;
          });
        }
        
        setHistoryData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lcUsername || !tufUsername) return;
    
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, leetcode_username: lcUsername, tuf_username: tufUsername })
    });
    
    setIsModalOpen(false);
    setName(''); setLcUsername(''); setTufUsername('');
    fetchUsers(); // Refresh
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this teammate?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await fetch(`/api/sync?_t=${Date.now()}`, { method: 'POST' });
    await fetchUsers();
    setIsSyncing(false);
  };

  const getDiff = (current: number, past: number) => {
    const diff = current - past;
    if (diff > 0) return <span className="diff-positive animate-fade-in">+{diff}</span>;
    return null;
  };

  const chartData = users.map(u => {
    const lcTotal = (u.today?.leetcode_easy || 0) + (u.today?.leetcode_medium || 0) + (u.today?.leetcode_hard || 0);
    // If there is no past data, we fallback to the baseline fetched when the user was created!
    const pastLcTotal = u.past ? ((u.past.leetcode_easy || 0) + (u.past.leetcode_medium || 0) + (u.past.leetcode_hard || 0)) : (u.initial_lc_total || 0);
    
    const tufTotal = u.today?.tuf_total || 0;
    const pastTufTotal = u.past ? u.past.tuf_total : (u.initial_tuf_total || 0);
    
    return {
      name: u.name,
      LeetCodeTotal: lcTotal,
      LeetCodeToday: u.dynamicLcToday !== undefined ? u.dynamicLcToday : Math.max(0, lcTotal - pastLcTotal),
      TUFTotal: tufTotal,
      TUFToday: Math.max(0, tufTotal - pastTufTotal),
    };
  });

  return (
    <main className="container animate-fade-in">
      <header className="header">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Progress Tracker</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track daily grinds on LeetCode and TUF Sheet.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Teammate</button>
        </div>
      </header>

      {users.length > 0 && (
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
              <button 
                onClick={() => setChartMode('today')}
                style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', background: chartMode === 'today' ? 'var(--brand-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                Solved Today
              </button>
              <button 
                onClick={() => setChartMode('total')}
                style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', background: chartMode === 'total' ? 'var(--brand-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                Total Solved
              </button>
            </div>
          </div>
          
          <div className="stats-grid">
            {/* LeetCode Graph */}
            <div className="glass-card">
              <h2 className="title-gradient" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>LeetCode Progress</h2>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
                    <Bar name={chartMode === 'total' ? "Total Solved" : "Solved Today"} dataKey={chartMode === 'total' ? "LeetCodeTotal" : "LeetCodeToday"} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TUF Graph */}
            <div className="glass-card">
              <h2 className="title-gradient" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>TUF Sheet Progress</h2>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
                    <Bar name={chartMode === 'total' ? "Total Solved" : "Solved Today"} dataKey={chartMode === 'total' ? "TUFTotal" : "TUFToday"} fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Tracking Section */}
      <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="title-gradient" style={{ fontSize: '1.25rem' }}>Historical Tracking</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>See exactly how many problems were solved on a past date.</p>
          </div>
          <div>
            <input 
              type="date" 
              className="input-field" 
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>
        
        {historyData.length > 0 && historyData.some(d => d.hasData) ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
                <Bar name="LeetCode Solved" dataKey="LeetCode" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar name="TUF Solved" dataKey="TUF" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No tracking data found for {historyDate}.
          </div>
        )}
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Teammate</th>
              <th>LeetCode Stats</th>
              <th>TUF Sheet Stats</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No teammates added yet.
                </td>
              </tr>
            ) : users.map(u => {
              const lcTotal = (u.today?.leetcode_easy || 0) + (u.today?.leetcode_medium || 0) + (u.today?.leetcode_hard || 0);
              const pastLcTotal = (u.past?.leetcode_easy || 0) + (u.past?.leetcode_medium || 0) + (u.past?.leetcode_hard || 0);
              
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      LC: {u.leetcode_username} | TUF: {u.tuf_username}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span className="badge badge-total">
                        {lcTotal} Total {u.past && getDiff(lcTotal, pastLcTotal)}
                      </span>
                      <span className="badge badge-easy">E: {u.today?.leetcode_easy || 0}</span>
                      <span className="badge badge-medium">M: {u.today?.leetcode_medium || 0}</span>
                      <span className="badge badge-hard">H: {u.today?.leetcode_hard || 0}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-total">
                        {u.today?.tuf_total || 0} / 455 {u.past && getDiff(u.today?.tuf_total || 0, u.past?.tuf_total || 0)}
                      </span>
                      <span className="badge badge-easy">E: {u.today?.tuf_easy || 0}</span>
                      <span className="badge badge-medium">M: {u.today?.tuf_medium || 0}</span>
                      <span className="badge badge-hard">H: {u.today?.tuf_hard || 0}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger" style={{ padding: '0.5rem 1rem' }} onClick={() => handleDelete(u.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2 className="modal-title">Add Teammate</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">LeetCode Username</label>
                <input className="input-field" value={lcUsername} onChange={e => setLcUsername(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">TUF Username</label>
                <input className="input-field" value={tufUsername} onChange={e => setTufUsername(e.target.value)} />
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Teammate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
