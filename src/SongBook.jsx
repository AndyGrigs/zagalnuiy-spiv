import { useEffect, useMemo, useRef, useState } from 'react';

const natKey = (n) => {
  const m = n.match(/^(\d+)(.*)$/);
  return m ? [parseInt(m[1], 10), m[2]] : [0, n];
};
const stripQuotes = (t) => t.replace(/^[^\p{L}\p{N}]+/u, '');

export default function SongBook({ list, songs, locale, labels, isAdmin, pin }) {
  const ALL = useMemo(() => {
    const byNumber = (a, b) => {
      const [an, as] = natKey(a[0]), [bn, bs] = natKey(b[0]);
      return an - bn || as.localeCompare(bs, locale);
    };
    const byAlphabet = (a, b) =>
      stripQuotes(a[1]).localeCompare(stripQuotes(b[1]), locale, { sensitivity: 'base' }) || byNumber(a, b);
    return { all: Object.entries(songs).sort(byNumber), sorts: { number: byNumber, alphabet: byAlphabet } };
  }, [songs, locale]);

  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState('');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [sort, setSort] = useState(() => localStorage.getItem('sort') || 'number');
  const [error, setError] = useState('');
  const saving = useRef(false);
  const url = `/api/selected?list=${list}`;

  const load = async () => {
    if (saving.current) return;
    try {
      const r = await fetch(url);
      setSelected(new Set(await r.json()));
    } catch {}
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [list]);

  const toggle = async (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    saving.current = true;
    setError('');
    try {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify([...next]),
      });
      if (!r.ok) throw new Error();
    } catch {
      setError(labels.saveError);
    } finally {
      saving.current = false;
      load();
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.all
      .filter(([id, t]) =>
        (!onlyChecked || selected.has(id)) &&
        (!q || id.toLowerCase().includes(q) || t.toLowerCase().includes(q)))
      .sort(ALL.sorts[sort]);
  }, [ALL, query, onlyChecked, selected, sort]);

  const picked = ALL.all.filter(([id]) => selected.has(id)).sort(ALL.sorts[sort]);

  const download = () => {
    const date = new Date().toLocaleDateString(locale);
    const lines = picked.map(([id, t]) => `${id} — ${t}`);
    const text = `${labels.fileTitle} (${date})\r\n\r\n${lines.join('\r\n')}\r\n`;
    const blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${list}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const changeSort = (e) => {
    setSort(e.target.value);
    localStorage.setItem('sort', e.target.value);
  };

  return (
    <>
      <p>{labels.count}: <b>{selected.size}</b></p>

      {picked.length > 0 && (
        <section className="picked">
          <h2>{labels.singing}</h2>
          <ul>{picked.map(([id, t]) => <li key={id}><b>{id}</b> — {t}</li>)}</ul>
          <button className="dl" onClick={download}>{labels.download}</button>
        </section>
      )}

      <div className="tools">
        <input placeholder={labels.search} value={query}
               onChange={(e) => setQuery(e.target.value)} />
        <select value={sort} onChange={changeSort} aria-label={labels.sort}>
          <option value="number">{labels.byNumber}</option>
          <option value="alphabet">{labels.byAlphabet}</option>
        </select>
        <label><input type="checkbox" checked={onlyChecked}
               onChange={(e) => setOnlyChecked(e.target.checked)} /> {labels.onlyPicked}</label>
      </div>
      {error && <p className="err">{error}</p>}

      <ul className="songs">
        {shown.map(([id, t]) => (
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
    </>
  );
}
