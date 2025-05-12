// migrate.js
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

// === Konfigurationen ===
const ZONE = 'Europe/Berlin';
const nameMapping = [
    { keyword: 'A3', target: 'A3' },
    { keyword: 'A5', target: 'A5' },
    { keyword: 'Ehrenhof', target: 'Jura' },
    { keyword: 'Westflügel', target: 'Schloss' },
    { keyword: 'Schneckenhof', target: 'BWL' },
];

// Hilfsfunktionen
function tsToBerlin(ms) {
    return DateTime.fromMillis(ms, { zone: ZONE });
}
function timestampToChunk(ms) {
    const dt = tsToBerlin(ms);
    return Math.floor((dt.hour * 60 + dt.minute) / 10);
}
function computeTTL(iatISO) {
    return DateTime.fromISO(iatISO, { zone: ZONE }).plus({ years: 1 }).toISO();
}
function normalizeName(raw) {
    for (const { keyword, target } of nameMapping) {
        if (raw.includes(keyword)) return target;
    }
    return raw;
}

// CLI args
const args = process.argv.slice(2);
const csvFlag = args.includes('-csv');

// Pfade
const INPUT = path.resolve('./main_DataEntry.json');
const OUTPUT_JSON = path.resolve('./modified_DataEntry.json');
const OUTPUT_CSV = path.resolve('./modified_DataEntry.csv');

// 1) Einlesen
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

// 2) Gruppieren
const groups = new Map();
for (const { percentage, name: rawName, date } of raw) {
    const name = normalizeName(rawName);
    const dayKey = tsToBerlin(date).toISODate();
    const chunk = timestampToChunk(date);
    const iat = tsToBerlin(date).toISO();

    const key = `${name}|${dayKey}`;
    if (!groups.has(key)) {
        groups.set(key, { name, dayKey, entries: new Map() });
    }
    groups.get(key).entries.set(chunk, { percentage, iat });
}

// 3) Output-Array bauen
const result = [];
for (const { name, dayKey, entries } of groups.values()) {
    const [year, month, day] = dayKey.split('-').map(Number);
    for (let chunk = 0; chunk < 24 * 6; chunk++) {
        const rec = entries.get(chunk);
        let iatISO, occupancy;
        if (rec) {
            iatISO = rec.iat;
            occupancy = rec.percentage;
        } else {
            iatISO = DateTime.fromObject({ year, month, day, hour: 0, minute: 0 }, { zone: ZONE })
                .plus({ minutes: chunk * 10 })
                .toISO();
            occupancy = 0;
        }
        result.push({
            occupancy: occupancy,
            name,
            year,
            month,
            day,
            chunk,
            iat: iatISO,
            ttl: computeTTL(iatISO),
        });
    }
}

// 4) Ausgabe je nach Flag
if (csvFlag) {
    // CSV-Kopf
    const headers = ['occupancy', 'name', 'year', 'month', 'day', 'chunk', 'iat', 'ttl'];
    const lines = [
        headers.join(','),
        ...result.map((row) =>
            headers
                .map((h) => {
                    const v = row[h];
                    // Strings escapen, Zahlen bleiben
                    return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v;
                })
                .join(',')
        ),
    ];
    fs.writeFileSync(OUTPUT_CSV, lines.join('\n'), 'utf-8');
    console.log(`✅ ${result.length} Datensätze → ${OUTPUT_CSV}`);
} else {
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`✅ ${result.length} Datensätze → ${OUTPUT_JSON}`);
}
