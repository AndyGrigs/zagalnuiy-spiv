import { pinOk } from './_redis.js';

export default function handler(req, res) {
  res.status(pinOk(req) ? 200 : 401).end();
}
