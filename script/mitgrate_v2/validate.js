// validate.js
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

// --- CONFIG --------------------------------------------------

// Pfad zur extrahierten JSON (original aus SQLite)
const INPUT_PATH = path.resolve('./main_DataEntry.json');

// Zeitzone für Chunk-Berechnung
const ZONE = 'Europe/Berlin';

// Anzahl der 10-Minuten-Chunks pro Tag
const TOTAL_CHUNKS = 24 * 6; // =144

// ------------------------------------------------------------

// Helper: Millisekunden → DateTime in Berlin
function tsToBerlin(tsMillis) {
    return DateTime.fromMillis(tsMillis, { zone: ZONE });
}

// Helper: Millisekunden → Tag-Key "YYYY-MM-DD"
function getDayKey(tsMillis) {
    return tsToBerlin(tsMillis).toISODate();
}

// Helper: Millisekunden → Chunk (0…143)
function timestampToChunk(tsMillis) {
    const dt = tsToBerlin(tsMillis);
    const minutesSinceMidnight = dt.hour * 60 + dt.minute;
    return Math.floor(minutesSinceMidnight / 10);
}

// Lade die Rohdaten
let raw;
try {
    raw = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
} catch (e) {
    console.error(`Fehler beim Einlesen von ${INPUT_PATH}:`, e.message);
    process.exit(1);
}

// Gruppiere nach "Bibliothek|Tag"
const groups = new Map();
// Jede Zeile: { id, percentage, name, date }
for (const { name, date } of raw) {
    const day = getDayKey(date);
    const chunk = timestampToChunk(date);
    const key = `${name}|${day}`;
    if (!groups.has(key)) {
        groups.set(key, new Set());
    }
    groups.get(key).add(chunk);
}

// Liste aller möglichen Chunks
const allChunks = Array.from({ length: TOTAL_CHUNKS }, (_, i) => i);

// Prüfe jede Gruppe auf fehlende Chunks
let anyMissing = false;
for (const [groupKey, presentChunks] of groups.entries()) {
    const [bibName, day] = groupKey.split('|');
    const missing = allChunks.filter((c) => !presentChunks.has(c));
    if (missing.length > 0) {
        anyMissing = true;
        console.log(
            `📌 Bibliothek "${bibName}", Datum ${day}: ` +
                `fehlende Chunks (${missing.length}): [${missing.join(', ')}]`
        );
    }
}

if (!anyMissing) {
    console.log('✅ Alle Datensätze komplett (keine fehlenden Chunks).');
}
