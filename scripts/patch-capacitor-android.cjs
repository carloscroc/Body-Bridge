#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'node_modules', '@capacitor', 'android', 'capacitor', 'build.gradle');

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const before = "getDefaultProguardFile('proguard-android.txt')";
const after = "getDefaultProguardFile('proguard-android-optimize.txt')";

if (!source.includes(before)) {
  process.exit(0);
}

fs.writeFileSync(target, source.replace(before, after), 'utf8');
console.log('[patch-capacitor-android] Patched Capacitor Android ProGuard config');
