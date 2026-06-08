'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function buildFileReferences(filePaths, projectRoot) {
  const refs = [];

  for (const fp of filePaths) {
    const fullPath = path.resolve(projectRoot, fp);
    if (!fs.existsSync(fullPath)) {
      refs.push({ path: fp, exists: false, lines: null, lastModified: null });
      continue;
    }

    const stat = fs.statSync(fullPath);
    let lineCount = null;
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      lineCount = content.split('\n').length;
    } catch {
      // binary file or unreadable
    }

    const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

    refs.push({
      path: relPath,
      exists: true,
      lines: lineCount,
      lastModified: stat.mtime.toISOString().split('T')[0],
      size: stat.size,
    });
  }

  return refs;
}

function buildGitReferences(projectRoot) {
  const refs = [];

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();
    refs.push({ type: 'branch', value: branch });

    const commit = execSync('git rev-parse HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();
    refs.push({ type: 'commit', value: commit.substring(0, 12) });

    const status = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();
    if (status) {
      const modified = status.split('\n').filter((l) => l.trim()).length;
      refs.push({ type: 'uncommitted_changes', value: `${modified} files` });
    }
  } catch {
    // not a git repo or git not available
  }

  return refs;
}

function generateReferencesMarkdown(fileRefs, gitRefs) {
  let md = '';

  if (fileRefs.length > 0) {
    md += '**Code References:**\n\n';
    for (const ref of fileRefs) {
      if (ref.exists) {
        md += `- \`${ref.path}\` (${ref.lines} lines, modified ${ref.lastModified})\n`;
      } else {
        md += `- \`${ref.path}\` ⚠️ *file not found*\n`;
      }
    }
    md += '\n';
  }

  if (gitRefs.length > 0) {
    md += '**Git Context:**\n\n';
    for (const ref of gitRefs) {
      const label = ref.type.replace(/_/g, ' ');
      md += `- ${label}: \`${ref.value}\`\n`;
    }
    md += '\n';
  }

  return md || '*No references provided*\n';
}

module.exports = { buildFileReferences, buildGitReferences, generateReferencesMarkdown };
