import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: run `vercel dev` (serves /api and the app together).
export default defineConfig({ plugins: [react()] });
