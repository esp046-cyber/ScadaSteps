#!/usr/bin/env node
/**
 * generate-zip.js - bundles the ScadaSteps project into scadasteps.zip
 *
 * Zero dependencies (uses only Node's built-in fs / path / zlib).
 *
 *   node generate-zip.js              -> ./scadasteps.zip
 *   node generate-zip.js out/app.zip  -> custom output path
 *
 * Excludes node_modules, dist, .git and previous zip files.
 * Everything is placed under a top-level "Scadasteps/" folder inside the archive.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TOP = 'Scadasteps';
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'scadasteps.zip'));
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite']);
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

/* ---------- CRC-32 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---------- DOS date/time ---------- */
function dosDateTime(d) {
  const year = Math.max(1980, d.getFullYear());
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

/* ---------- collect files ---------- */
function walk(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP_FILES.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...walk(abs, r));
    } else if (entry.isFile()) {
      if (/\.zip$/i.test(entry.name)) continue;
      if (path.resolve(abs) === OUT) continue;
      out.push({ abs, rel: r });
    }
  }
  return out;
}

/* ---------- write zip ---------- */
const files = walk(ROOT);
const chunks = [];
const central = [];
let offset = 0;

for (const f of files) {
  const data = fs.readFileSync(f.abs);
  const stat = fs.statSync(f.abs);
  const name = Buffer.from(`${TOP}/${f.rel}`, 'utf8');
  const crc = crc32(data);
  const deflated = zlib.deflateRawSync(data, { level: 9 });
  const useDeflate = deflated.length < data.length;
  const body = useDeflate ? deflated : data;
  const method = useDeflate ? 8 : 0;
  const { time, date } = dosDateTime(stat.mtime);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  chunks.push(local, name, body);

  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, v2.0
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0x0800, 8);
  cd.writeUInt16LE(method, 10);
  cd.writeUInt16LE(time, 12);
  cd.writeUInt16LE(date, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(body.length, 20);
  cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(name.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt16LE(0, 36);
  cd.writeUInt32LE(((0o100644 << 16) >>> 0), 38); // regular file, rw-r--r--
  cd.writeUInt32LE(offset, 42);
  central.push(cd, name);

  offset += local.length + name.length + body.length;
}

const cdBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cdBuf.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(0, 20);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([...chunks, cdBuf, end]));

console.log(`Created ${path.relative(process.cwd(), OUT) || OUT}`);
console.log(`  ${files.length} files, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
console.log('Next: unzip, then run  npm install && npm run dev');
