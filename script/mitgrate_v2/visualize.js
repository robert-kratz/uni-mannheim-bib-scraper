// visualize.js
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

// === Konfiguration ===
const DATA_PATH = path.resolve('./modified_DataEntry.json');
const ZONE = 'Europe/Berlin';
const CHUNKS_PER_DAY = 24 * 6; // 144

// === Helfer ===
function parseDateArg(arg) {
    // Erlaubt "DD MM YYYY" oder "YYYY-MM-DD"
    let dt;
    if (/^\d{2}\s\d{2}\s\d{4}$/.test(arg)) {
        const [dd, mm, yyyy] = arg.split(' ').map(Number);
        dt = DateTime.fromObject({ year: yyyy, month: mm, day: dd }, { zone: ZONE });
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
        dt = DateTime.fromISO(arg, { zone: ZONE });
    } else {
        console.error('Datum im Format "DD MM YYYY" oder "YYYY-MM-DD" angeben.');
        process.exit(1);
    }
    return dt;
}

function chunkToTimeLabel(chunk, baseDate) {
    // baseDate ist ein Luxon DateTime bei 00:00 Uhr
    return baseDate.plus({ minutes: chunk * 10 }).toFormat('HH:mm');
}

// === Main ===
async function main() {
    // Datum aus Argument
    const arg = process.argv[2];
    if (!arg) {
        console.error('Usage: node visualize.js "25 01 2025"');
        process.exit(1);
    }
    const day = parseDateArg(arg);
    const year = day.year,
        month = day.month,
        date = day.day;

    // Daten einlesen
    let all;
    try {
        all = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    } catch (e) {
        console.error(`Konnte ${DATA_PATH} nicht einlesen:`, e.message);
        process.exit(1);
    }

    // Filtern auf Tag
    const filtered = all.filter((r) => r.year === year && r.month === month && r.day === date);

    if (filtered.length === 0) {
        console.error(`Keine Datensätze für ${day.toISODate()}`);
        process.exit(1);
    }

    // Alle Bibliotheken dieses Tages
    const libs = Array.from(new Set(filtered.map((r) => r.name))).sort();

    // Aufbau Basis-Datum bei 00:00
    const baseDate = day.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

    // Zeit-Reihen-Tabelle bauen
    const table = [];
    for (let chunk = 0; chunk < CHUNKS_PER_DAY; chunk++) {
        const row = { time: chunkToTimeLabel(chunk, baseDate) };
        for (const lib of libs) {
            const rec = filtered.find((r) => r.name === lib && r.chunk === chunk);
            row[lib] = rec ? rec.percentage : 0;
        }
        table.push(row);
    }

    // Ausgabe
    console.log(`Auslastung am ${day.toISODate()}:`);
    console.table(table);
}

main();
