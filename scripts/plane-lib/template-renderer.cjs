'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'plane-templates');

const VALID_TYPES = ['feature', 'bug', 'enhancement', 'investigation'];

function loadTemplate(type) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid ticket type: "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
  }
  const templatePath = path.join(TEMPLATES_DIR, `${type}.template.md`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

function buildDescription(template, context) {
  let result = template;

  result = result.replace(/\{\{CONTEXT\}\}/g, context.context || '*No context provided*');
  result = result.replace(/\{\{REFERENCES\}\}/g, context.referencesMarkdown || '*No references provided*');
  result = result.replace(/\{\{TEST_SPECS\}\}/g, context.testSpecsMarkdown || '*No test specifications provided*');

  return result;
}

function markdownToHtml(md) {
  let html = md;

  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ordered">$1. $2</li>');
  html = html.replace(/^-\s+\[([ xX])\]\s+(.+)$/gm, (_, checked, text) => {
    const cb = checked !== ' ' ? 'checked' : '';
    return `<li><input type="checkbox" ${cb} disabled /> ${text}</li>`;
  });
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');

  return html;
}

module.exports = { loadTemplate, buildDescription, markdownToHtml, VALID_TYPES };
