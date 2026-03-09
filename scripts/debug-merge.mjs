#!/usr/bin/env node
import { readFileSync } from 'fs';

const db = JSON.parse(readFileSync('src/data/launchDatabase.json', 'utf8'));
const histTs = readFileSync('src/data/historicalLaunches.ts', 'utf8');

// Extract historical launch entries by parsing the TypeScript
const siteIds = new Set(['ksc-lc39a', 'cape-canaveral-slc40', 'vandenberg-slc4e', 'boca-chica', 'kwajalein']);

// Use regex to extract id, name, dateUtc triplets from the TS file
const pattern = /id:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)",\s*\n\s*dateUtc:\s*"([^"]+)"/g;
const entries = [];
let m;
while ((m = pattern.exec(histTs)) !== null) {
  const [, id, name, dateUtc] = m;
  if (!siteIds.has(id)) {
    entries.push({ id, name, dateUtc });
  }
}

console.log(`Found ${entries.length} historical launch entries\n`);

// Build index by date for DB
const dbByDate = {};
for (const l of db) {
  const d = l.dateUtc.slice(0, 10);
  if (!dbByDate[d]) dbByDate[d] = [];
  dbByDate[d].push(l);
}

let matched = 0;
let unmatched = 0;

for (const hist of entries) {
  const date = hist.dateUtc.slice(0, 10);
  const dbEntries = dbByDate[date] || [];

  // Try exact ID match
  const idMatch = db.find(l => l.id === hist.id);
  if (idMatch) {
    matched++;
    continue;
  }

  // Try name match on same date
  const histNameNorm = hist.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameMatch = dbEntries.find(l => {
    const lNameNorm = l.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return lNameNorm === histNameNorm ||
           lNameNorm.includes(histNameNorm) ||
           histNameNorm.includes(lNameNorm);
  });

  if (nameMatch) {
    matched++;
    continue;
  }

  // Try same rocket type + same site on same day
  // Need to get rocketType from hist context - check surrounding text
  const siteMatch = dbEntries.find(l => l.launchSite.id === 'kwajalein' ||
    (dbEntries.length === 1)); // only entry on that day

  if (siteMatch && dbEntries.length <= 2) {
    matched++;
    continue;
  }

  unmatched++;
  console.log(`NO MATCH: "${hist.name}" (${hist.id}) on ${date}`);
  if (dbEntries.length > 0) {
    console.log(`  DB entries on that date: ${dbEntries.map(l => `"${l.name}"`).join(', ')}`);
  } else {
    console.log(`  No DB entries on that date`);
  }
}

console.log(`\nMatched: ${matched}, Unmatched: ${unmatched}`);
console.log(`\nDB total: ${db.length}, Historical: ${entries.length}`);
console.log(`Expected after merge: ~${db.length + unmatched}`);
