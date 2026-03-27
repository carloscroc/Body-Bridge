#!/usr/bin/env node
// Usage: GITHUB_TOKEN=xxx node scripts/close-spec-project-issues.js owner/repo [owner/repo ...] [--yes]
// Closes all issues that are cards in the repository-level project titled "spec".

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('ERROR: set GITHUB_TOKEN in env (scopes: repo, issues)');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/close-spec-project-issues.js owner/repo [owner/repo ...] [--yes]');
  process.exit(1);
}
const yes = args.includes('--yes');
const repos = args.filter(a => a !== '--yes');
const projectName = 'spec';

const fetchFn = globalThis.fetch || require('node-fetch');

async function graphql(query, variables) {
  const res = await fetchFn('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

async function closeIssue(owner, repo, number) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`;
  const res = await fetchFn(url, {
    method: 'PATCH',
    headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: 'closed' }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to close ${owner}/${repo}#${number}: ${res.status} ${text}`);
  }
}

(async () => {
  for (const full of repos) {
    const [owner, name] = full.split('/');
    if (!owner || !name) { console.error('Invalid repo:', full); continue; }

    console.log(`\nChecking repo ${owner}/${name} for project "${projectName}"...`);

    const query = `query($owner:String!, $name:String!, $first:Int){
      repository(owner:$owner, name:$name){
        projectsV2(first:$first){ nodes { id title items(first:100){ nodes{ id content{ __typename ... on Issue { number repository { nameWithOwner } } } } } }
      }
    }`;

    let data;
    try { data = await graphql(query, { owner, name, first: 50 }); }
    catch (e) { console.error('GraphQL error:', e.message); continue; }

    const projects = data.repository?.projectsV2?.nodes || [];
    const project = projects.find(p => (p.title || '').toLowerCase() === projectName.toLowerCase());
    if (!project) { console.log('Project not found in this repo.'); continue; }

    const items = (project.items?.nodes || []).map(n => n.content).filter(Boolean).filter(c => c.__typename === 'Issue');
    if (items.length === 0) { console.log('No issue cards in project.'); continue; }

    console.log(`Found ${items.length} issue(s) in project ${project.title}:`);
    items.forEach(i => console.log(` - ${i.repository.nameWithOwner}#${i.number}`));

    if (!yes) {
      const prompt = `Close these ${items.length} issues in ${owner}/${name}? (y/N): `;
      process.stdout.write(prompt);
      const input = await new Promise(resolve => {
        process.stdin.resume();
        process.stdin.once('data', d => resolve(d.toString().trim()));
      });
      process.stdin.pause();
      if (!input || !/^y(es)?$/i.test(input)) { console.log('Skipping.'); continue; }
    }

    for (const it of items) {
      const repoOwnerRepo = it.repository.nameWithOwner.split('/');
      const issueOwner = repoOwnerRepo[0];
      const issueRepo = repoOwnerRepo[1];
      const num = it.number;
      try {
        await closeIssue(issueOwner, issueRepo, num);
        console.log(`Closed ${issueOwner}/${issueRepo}#${num}`);
      } catch (e) {
        console.error('Error closing issue:', e.message);
      }
    }
  }
  console.log('\nDone.');
})();
