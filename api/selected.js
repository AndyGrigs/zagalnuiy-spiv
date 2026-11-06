import { redis, KEY, pinOk } from './_redis.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const list = (await redis.get(KEY)) || [];
    return res.status(200).json(list);
  }

  if (req.method === 'PUT') {
    if (!pinOk(req)) return res.status(401).json({ error: 'bad pin' });
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'array expected' });
    const list = req.body.filter((x) => typeof x === 'string');
    await redis.set(KEY, list);
    return res.status(200).json(list);
  }

  res.setHeader('Allow', 'GET, PUT');
  res.status(405).end();
}
