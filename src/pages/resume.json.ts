import type { APIRoute } from 'astro';
import { resumeJson } from '../lib/reading/resume';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(resumeJson(), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
