import { useEffect, useState } from 'react';
import SongBook from './SongBook.jsx';
import songsUk from '../songs.json';
import songsRu from '../songs_ru.json';

const BOOKS = {
  uk: {
    tab: 'Українські',
    title: 'Загальний спів 🎶',
    songs: songsUk,
    locale: 'uk',
    labels: {
      count: 'Обрано пісень', singing: 'Співаємо:', download: '⬇ Завантажити список (.txt)',
      search: 'Пошук за номером або назвою…', sort: 'Сортування', byNumber: 'За номером',
      byAlphabet: 'За алфавітом', onlyPicked: 'Лише обрані', saveError: 'Не вдалося зберегти',
      fileTitle: 'Загальний спів',
    },
  },
  ru: {
    tab: 'Русские',
    title: 'Общее пение 🎶',
    songs: songsRu,
    locale: 'ru',
    labels: {
      count: 'Выбрано песен', singing: 'Поём:', download: '⬇ Скачать список (.txt)',
      search: 'Поиск по номеру или названию…', sort: 'Сортировка', byNumber: 'По номеру',
      byAlphabet: 'По алфавиту', onlyPicked: 'Только выбранные', saveError: 'Не удалось сохранить',
      fileTitle: 'Общее пение',
    },
  },
};

const fromHash = () => (location.hash === '#ru' ? 'ru' : 'uk');

export default function App() {
  const [page, setPage] = useState(fromHash);
  const [pin, setPin] = useState(() => localStorage.getItem('pin') || '');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!pin) return;
    fetch('/api/check-pin', { method: 'POST', headers: { 'x-admin-pin': pin } }).then((r) => {
      setIsAdmin(r.ok);
      if (!r.ok) localStorage.removeItem('pin');
    });
  }, [pin]);

  const logout = () => {
    localStorage.removeItem('pin');
    setPin('');
    setIsAdmin(false);
  };

  const login = () => {
    const p = prompt('PIN:');
    if (p) { localStorage.setItem('pin', p); setPin(p); }
  };

  const book = BOOKS[page];

  return (
    <div className="app">
      <nav className="tabs">
        {Object.entries(BOOKS).map(([key, b]) => (
          <a key={key} href={`#${key}`} className={key === page ? 'active' : ''}>{b.tab}</a>
        ))}
      </nav>
      <header>
        <h1>{book.title}</h1>
        {isAdmin
          ? <><span className="badge">{page === 'ru' ? 'Режим редактирования' : 'Режим редагування'}</span>{' '}
              <button onClick={logout}>{page === 'ru' ? 'Выйти' : 'Вийти'}</button></>
          : <button onClick={login}>{page === 'ru' ? 'Войти для редактирования' : 'Увійти для редагування'}</button>}
      </header>
      <SongBook key={page} list={page} songs={book.songs} locale={book.locale}
                labels={book.labels} isAdmin={isAdmin} pin={pin} />
    </div>
  );
}
