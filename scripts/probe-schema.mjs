// Survey questions.json to discover what fields actually appear on each
// object type, and how often. Used to write SCHEMA.md from observed reality
// rather than assumption.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(resolve(here, "..", "questions.json"), "utf8"));

const fieldStats = {}; // shape: kind -> field -> { count, types: Set, sample }

function note(kind, obj) {
  fieldStats[kind] ??= { _total: 0, fields: {} };
  fieldStats[kind]._total++;
  for (const [k, v] of Object.entries(obj)) {
    const f = (fieldStats[kind].fields[k] ??= { count: 0, types: new Set(), sample: undefined });
    f.count++;
    f.types.add(Array.isArray(v) ? `array(${v.length === 0 ? "empty" : typeof v[0]})` : typeof v);
    if (f.sample === undefined) f.sample = v;
  }
}

for (const sec of data) {
  note("section", sec);
  for (const vid of sec.videos ?? []) {
    note("video", vid);
    for (const q of vid.questions ?? []) note("mc", q);
    for (const s of vid.scenarios ?? []) note("scenario", s);
    for (const m of vid.matching ?? []) note("matching", m);
    for (const c of vid.cram ?? []) note("cram", c);
  }
}

for (const [kind, info] of Object.entries(fieldStats)) {
  console.log(`\n=== ${kind} (n=${info._total}) ===`);
  for (const [field, stats] of Object.entries(info.fields)) {
    const opt = stats.count === info._total ? "REQ" : `opt ${stats.count}/${info._total}`;
    const types = [...stats.types].join("|");
    let sample = JSON.stringify(stats.sample);
    if (sample && sample.length > 90) sample = sample.slice(0, 87) + "...";
    console.log(`  ${field.padEnd(14)} ${opt.padEnd(12)} ${types.padEnd(20)} e.g. ${sample}`);
  }
}
