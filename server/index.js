import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_FILE = process.env.DATA_FILE || path.join(ROOT, 'data', 'selected.json');
const PIN = process.env.ADMIN_PIN || '1234'; // set ADMIN_PIN on your host
const PORT = process.env.PORT || 3001;

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
let selected = [];
try { selected = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(selected));

const app = express();
app.use(express.json());

app.get('/api/selected', (_req, res) => res.json(selected));

app.put('/api/selected', (req, res) => {
  if (req.get('x-admin-pin') !== PIN) return res.status(401).json({ error: 'bad pin' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'array expected' });
  selected = req.body.filter((x) => typeof x === 'string');
  save();
  res.json(selected);
});

app.post('/api/check-pin', (req, res) =>
  res.status(req.get('x-admin-pin') === PIN ? 200 : 401).end());

const dist = path.join(ROOT, 'dist');
app.use(express.static(dist));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
