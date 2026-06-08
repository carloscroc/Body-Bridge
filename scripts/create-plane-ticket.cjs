#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('node:util');

const rootDir = path.resolve(__dirname, '..');

require('dotenv').config({ path: path.join(rootDir, '.env.symphony') });

const { PlaneApiClient, planeConfigFromEnv } = require(path.join(__dirname, 'plane-lib', 'plane-api-client.cjs'));
const { loadTemplate, buildDescription, markdownToHtml, VALID_TYPES } = require(path.join(__dirname, 'plane-lib', 'template-renderer.cjs'));
const { buildFileReferences, buildGitReferences, generateReferencesMarkdown } = require(path.join(__dirname, 'plane-lib', 'reference-builder.cjs'));
const { gatherContext, validateContext } = require(path.join(__dirname, 'plane-lib', 'context-gatherer.cjs'));

function printUsage() {
  console.log(`
Usage: node scripts/create-plane-ticket.cjs [options]

Required:
  --title <string>        Ticket title (max 255 chars)
  --type <type>           Ticket type: ${VALID_TYPES.join(', ')}
  --context <string>      Description / context for the ticket

Optional:
  --priority <level>      Priority: none, low, medium, high, urgent (default: none)
  --images <paths>        Comma-separated image paths to attach
  --references <paths>    Comma-separated source file references
  --test-specs <paths>    Comma-separated test spec paths
  --labels <names>        Comma-separated label names
  --assignees <ids>       Comma-separated assignee UUIDs
  --start-date <date>     Start date (YYYY-MM-DD)
  --target-date <date>    Target date (YYYY-MM-DD)
  --parent <id>           Parent ticket ID
  --dry-run               Show what would be created without creating it
  --json                  Output result as JSON

Examples:
  node scripts/create-plane-ticket.cjs --title "Add video progress" --type feature --priority high --context "Users need progress indicator" --references src/components/Player.tsx
  node scripts/create-plane-ticket.cjs --title "Timer resets" --type bug --priority urgent --context "Timer resets on background" --images screenshots/bug.png
`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      title: { type: 'string' },
      type: { type: 'string' },
      context: { type: 'string' },
      priority: { type: 'string' },
      images: { type: 'string' },
      references: { type: 'string' },
      'test-specs': { type: 'string' },
      labels: { type: 'string' },
      assignees: { type: 'string' },
      'start-date': { type: 'string' },
      'target-date': { type: 'string' },
      parent: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const options = {
    title: values.title,
    type: values.type,
    context: values.context,
    priority: values.priority,
    images: values.images,
    references: values.references,
    testSpecs: values['test-specs'],
    labels: values.labels,
    assignees: values.assignees,
    startDate: values['start-date'],
    targetDate: values['target-date'],
    parent: values.parent,
    dryRun: values['dry-run'],
    json: values.json,
  };

  const context = gatherContext(options, rootDir);
  const { errors, warnings, context: validated } = validateContext(context);

  if (errors.length > 0) {
    console.error('Validation errors:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  for (const w of warnings) {
    console.warn(`Warning: ${w}`);
  }

  const fileRefs = buildFileReferences(validated.references, rootDir);
  const gitRefs = buildGitReferences(rootDir);
  const referencesMd = generateReferencesMarkdown(fileRefs, gitRefs);

  let testSpecsMd = '';
  if (validated.testSpecs.length > 0) {
    testSpecsMd = '**Test Specifications:**\n\n';
    for (const spec of validated.testSpecs) {
      const fullPath = path.resolve(rootDir, spec);
      const exists = fs.existsSync(fullPath);
      testSpecsMd += exists
        ? `- \`${spec}\` ✅\n`
        : `- \`${spec}\` ⚠️ *not found*\n`;
    }
    testSpecsMd += '\n';
  } else {
    testSpecsMd = '*No test specifications provided*\n';
  }

  const template = loadTemplate(validated.type);
  const descriptionMd = buildDescription(template, {
    context: validated.userContext,
    referencesMarkdown: referencesMd,
    testSpecsMarkdown: testSpecsMd,
  });
  const descriptionHtml = markdownToHtml(descriptionMd);

  const validPriorities = ['none', 'low', 'medium', 'high', 'urgent'];

  const ticketData = {
    name: validated.title,
    description_html: descriptionHtml,
    priority: validPriorities.includes(validated.priority) ? validated.priority : 'none',
  };

  if (validated.startDate) ticketData.start_date = validated.startDate;
  if (validated.targetDate) ticketData.target_date = validated.targetDate;
  if (validated.parentTicket) ticketData.parent = validated.parentTicket;

  if (values['dry-run']) {
    const dryRunResult = {
      action: 'dry-run',
      ticket: ticketData,
      type: validated.type,
      images: validated.images,
      references: fileRefs,
      git: gitRefs,
      description_markdown: descriptionMd,
    };

    if (values.json) {
      console.log(JSON.stringify(dryRunResult, null, 2));
    } else {
      console.log('=== DRY RUN: Ticket would be created with ===');
      console.log(`Title: ${ticketData.name}`);
      console.log(`Type: ${validated.type}`);
      console.log(`Priority: ${validated.priority}`);
      console.log(`Images: ${validated.images.length} file(s)`);
      console.log(`References: ${fileRefs.length} file(s)`);
      console.log(`\n--- Description (Markdown) ---\n${descriptionMd}`);
    }
    process.exit(0);
  }

  const config = planeConfigFromEnv(process.env);
  const client = new PlaneApiClient(config);

  const verification = await client.verifyProject();
  if (!verification.valid) {
    console.error(`Project verification failed: ${verification.error}`);
    process.exit(1);
  }

  console.log(`Creating ${validated.type} ticket in project "${verification.project.name}"...`);

  const ticket = await client.createWorkItem(ticketData);

  const projectIdentifier = config.project_identifier || verification.project.identifier || 'BODYBRIDGE';
  const ticketIdentifier = `${projectIdentifier}-${ticket.sequence_id}`;
  const ticketUrl = `${config.base_url.replace(/\/api\/v\d+\/?$/, '')}/${config.workspace_slug}/projects/${config.project_id}/issues/${ticket.id}/`;

  console.log(`✅ Ticket created: ${ticketIdentifier}`);
  console.log(`   URL: ${ticketUrl}`);

  let attachmentsUploaded = 0;
  let attachmentErrors = 0;

  if (validated.images.length > 0) {
    console.log(`Uploading ${validated.images.length} image(s)...`);
    for (const imgPath of validated.images) {
      const fullPath = path.resolve(rootDir, imgPath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`  ⚠️ Skipping missing image: ${imgPath}`);
        continue;
      }
      try {
        await client.addAttachment(ticket.id, fullPath);
        attachmentsUploaded++;
        console.log(`  ✅ Attached: ${imgPath}`);
      } catch (err) {
        attachmentErrors++;
        console.warn(`  ❌ Failed to attach ${imgPath}: ${err.message}`);
      }
    }
  }

  const initComment = `<h3>Ticket Created</h3>
<p><strong>Type:</strong> ${validated.type}<br/>
<strong>Priority:</strong> ${validated.priority}<br/>
<strong>Created:</strong> ${new Date().toISOString()}</p>
<p><em>This ticket requires all evidence items to be verified before it can be marked Done. Do not skip verification steps.</em></p>`;

  try {
    await client.createComment(ticket.id, initComment);
  } catch (err) {
    console.warn(`Failed to post initialization comment: ${err.message}`);
  }

  const result = {
    success: true,
    ticket: {
      id: ticket.id,
      identifier: ticketIdentifier,
      sequence_id: ticket.sequence_id,
      name: ticket.name,
      state: 'Backlog',
      url: ticketUrl,
    },
    attachments: { uploaded: attachmentsUploaded, errors: attachmentErrors },
  };

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n📋 Ticket Summary:`);
    console.log(`   ID: ${result.ticket.id}`);
    console.log(`   Identifier: ${result.ticket.identifier}`);
    console.log(`   State: ${result.ticket.state}`);
    console.log(`   Attachments: ${attachmentsUploaded} uploaded, ${attachmentErrors} failed`);
  }

  return result;
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
  process.exit(1);
});
