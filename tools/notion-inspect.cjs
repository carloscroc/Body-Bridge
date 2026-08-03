// Phase 1 - Notion inspection. Reads ONLY, no mutations.
// Targets Exercise Library data source.
const fs = require('fs');
const path = require('path');

const NOTION_KEY = process.env.NOTION_API_KEY;
if (!NOTION_KEY) {
  console.error('NOTION_API_KEY not in environment');
  process.exit(2);
}

const HDR = (q) => `https://api.notion.com/v1/${q}`;
const H = (extra) => Object.assign({
  'Authorization': `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2025-09-03',
  'Content-Type': 'application/json',
}, extra || {});

async function jget(url, init) {
  const r = await fetch(url, init);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { rawText: text }; }
  return { status: r.status, ok: r.ok, json };
}

const outDir = path.join(process.cwd(), '.hermes');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  // 1. Retrieve the Exercise Library data source by id
  const DS_ID = 'e8f946d2-8e2c-4b05-bd58-630a985d3bd7';

  // 2. Query the data source for ALL pages, paginating via start_cursor
  let cursor = undefined;
  let page = 0;
  const allResults = [];
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const all = await jget(HDR(`data_sources/${DS_ID}/query`), {
      method: 'POST', headers: H(),
      body: JSON.stringify(body),
    });
    page += 1;
    if (!all.ok) {
      console.error('Notion query failed page', page, all.status, JSON.stringify(all.json).slice(0, 500));
      break;
    }
    const results = all.json.results || [];
    allResults.push(...results);
    cursor = all.json.has_more ? all.json.next_cursor : null;
    console.log(`Page ${page}: +${results.length} (total=${allResults.length}, has_more=${!!cursor})`);
  } while (cursor);

  fs.writeFileSync(path.join(outDir, 'notion-all-pages.json'), JSON.stringify(allResults, null, 2));
  console.log('All pages total:', allResults.length);
  const all = { json: { results: allResults } };

  // 3. Build a simple title index so we can find the 6 names quickly
  const wantNames = ['Goblet Squat', 'Plank Hold', 'Walking Lunge', 'Bent-Over Row', 'Overhead Press', 'Romanian Deadlift'];
  const wantLower = wantNames.map(s => s.toLowerCase());

  function pageTitle(p) {
    const props = p.properties || {};
    for (const key of Object.keys(props)) {
      const v = props[key];
      if (v && v.type === 'title' && Array.isArray(v.title)) {
        return v.title.map(t => t.plain_text || t.text?.content || '').join('').trim();
      }
    }
    return '(no title)';
  }

  function readProp(p, name) {
    const props = p.properties || {};
    const v = props[name];
    if (!v) return null;
    if (v.type === 'url') return v.url || null;
    if (v.type === 'rich_text') return (v.rich_text || []).map(t => t.plain_text).join('');
    if (v.type === 'select') return v.select?.name || null;
    if (v.type === 'multi_select') return (v.multi_select || []).map(s => s.name);
    if (v.type === 'files') return (v.files || []).map(f => f.file?.url || f.external?.url || f.name).filter(Boolean);
    return v[v.type] ?? null;
  }

  const summary = { data_source_id: DS_ID, matched: [], unmatched: wantNames.slice(), scanned: 0 };
  for (const p of (all.json?.results || [])) {
    summary.scanned += 1;
    const t = pageTitle(p);
    const low = t.toLowerCase();
    const hit = wantLower.indexOf(low);
    if (hit !== -1) {
      const videoUrl = readProp(p, '⭐Video');
      summary.matched.push({
        seed: wantNames[hit],
        notionTitle: t,
        notionPageId: p.id,
        url: p.url,
        videoUrl,
        level: readProp(p, 'Level'),
        areaOfBody: readProp(p, '⭐Area of Body'),
        equipment: readProp(p, '⭐Equipment'),
        musclesUsed: readProp(p, '⭐Muscles Used'),
        movementGoal: readProp(p, '⭐Movement Goal'),
        source: readProp(p, 'Source'),
        instructions: readProp(p, '⭐Exercise Instructions'),
      });
      const idx = summary.unmatched.indexOf(wantNames[hit]);
      if (idx !== -1) summary.unmatched.splice(idx, 1);
    }
  }

  fs.writeFileSync(path.join(outDir, 'notion-match-summary.json'), JSON.stringify(summary, null, 2));
  console.log('Matched:', summary.matched.length, 'Unmatched:', summary.unmatched.length);
  console.log(JSON.stringify(summary, null, 2));
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
