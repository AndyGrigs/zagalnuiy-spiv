import { useEffect, useMemo, useRef, useState } from 'react';
import songs from '../songs.json';

const ALL = Object.entries(songs);
const natKey = (n) => {
  const m = n.match(/^(\d+)(.*)$/);
  return m ? [parseInt(m[1], 10), m[2]] : [0, n];
};

export default function App() {
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState('');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [pin, setPin] = useState(() => localStorage.getItem('pin') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  const load = async () => {
    if (saving.current) return;
    try {
      const r = await fetch('/api/selected');
      setSelected(new Set(await r.json()));
    } catch {}
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pin) return;
    fetch('/api/check-pin', { method: 'POST', headers: { 'x-admin-pin': pin } }).then((r) => {
      setIsAdmin(r.ok);
      if (!r.ok) localStorage.removeItem('pin');
    });
  }, [pin]);

  const toggle = async (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    saving.current = true;
    setError('');
    try {
      const r = await fetch('/api/selected', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify([...next]),
      });
      if (!r.ok) throw new Error();
    } catch {
      setError('Не вдалося зберегти');
    } finally {
      saving.current = false;
      load();
    }
  };

  const login = () => {
    const p = prompt('PIN для редагування:');
    if (p) { localStorage.setItem('pin', p); setPin(p); }
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(([id, t]) =>
      (!onlyChecked || selected.has(id)) &&
      (!q || id.toLowerCase().includes(q) || t.toLowerCase().includes(q)));
  }, [query, onlyChecked, selected]);

  const picked = ALL.filter(([id]) => selected.has(id)).sort((a, b) => {
    const [an, as] = natKey(a[0]), [bn, bs] = natKey(b[0]);
    return an - bn || as.localeCompare(bs);
  });

  return (
    <div className="app">
      <header>
        <h1>Загальний спів 🎶</h1>
        <p>Обрано пісень: <b>{selected.size}</b></p>
        {isAdmin
          ? <span className="badge">Режим редагування</span>
          : <button onClick={login}>Увійти для редагування</button>}
      </header>

      {picked.length > 0 && (
        <section className="picked">
          <h2>Співаємо:</h2>
          <ul>{picked.map(([id, t]) => <li key={id}><b>{id}</b> — {t}</li>)}</ul>
        </section>
      )}

      <div className="tools">
        <input placeholder="Пошук за номером або назвою…" value={query}
               onChange={(e) => setQuery(e.target.value)} />
        <label><input type="checkbox" checked={onlyChecked}
               onChange={(e) => setOnlyChecked(e.target.checked)} /> Лише обрані</label>
      </div>
      {error && <p className="err">{error}</p>}

      <ul className="songs">
        {list.map(([id, t]) => (
          <li key={id} className={selected.has(id) ? 'on' : ''}>
            <label>
              <input type="checkbox" checked={selected.has(id)}
                     disabled={!isAdmin} onChange={() => toggle(id)} />
              <span className="num">{id}</span>
              <span>{t}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
