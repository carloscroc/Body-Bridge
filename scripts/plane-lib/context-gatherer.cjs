'use strict';

const fs = require('fs');
const path = require('path');

function gatherContext(options, projectRoot) {
  const context = {
    userContext: options.context || '',
    type: options.type || 'feature',
    priority: options.priority || 'none',
    title: options.title || '',
    images: parseList(options.images),
    references: parseList(options.references),
    testSpecs: parseList(options.testSpecs),
    labels: parseList(options.labels),
    assignees: parseList(options.assignees),
    startDate: options.startDate || null,
    targetDate: options.targetDate || null,
    parentTicket: options.parent || null,
  };

  context.projectRoot = projectRoot;
  context.timestamp = new Date().toISOString();

  return context;
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateContext(context) {
  const errors = [];
  const warnings = [];

  if (!context.title || context.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (context.title && context.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  const validTypes = ['feature', 'bug', 'enhancement', 'investigation'];
  if (!validTypes.includes(context.type)) {
    errors.push(`Invalid type: "${context.type}". Valid: ${validTypes.join(', ')}`);
  }

  const validPriorities = ['none', 'low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(context.priority)) {
    warnings.push(`Invalid priority: "${context.priority}". Defaulting to "none".`);
    context.priority = 'none';
  }

  for (const img of context.images) {
    const fullPath = path.resolve(context.projectRoot, img);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Image not found: ${img} — will be skipped`);
    }
  }

  for (const ref of context.references) {
    const fullPath = path.resolve(context.projectRoot, ref);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Reference not found: ${ref} — will be marked as missing`);
    }
  }

  for (const spec of context.testSpecs) {
    const fullPath = path.resolve(context.projectRoot, spec);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Test spec not found: ${spec} — will be marked as missing`);
    }
  }

  return { errors, warnings, context };
}

module.exports = { gatherContext, validateContext, parseList };
