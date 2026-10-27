import type { APIRoute, GetStaticPaths } from 'astro';
import shupp from '../../../design-spec/shupp.spec.json?raw';
import template from '../../../design-spec/template.spec.json?raw';

// /design-spec/{template,shupp}.spec.json — the raw spec files, for agents and
// tools. design-spec/ at the repo root is the source of truth.
const FILES: Record<string, string> = { 'template.spec': template, 'shupp.spec': shupp };

export const getStaticPaths: GetStaticPaths = () => Object.keys(FILES).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) =>
  new Response(FILES[params.file as string], {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
