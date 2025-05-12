import { pgTable, serial, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// mirror your Prisma enums
export const EventType = pgEnum('EventType', ['lecture', 'exam', 'holiday', 'break', 'event']);

// BibData table
export const BibData = pgTable('BibData', {
    id: serial('id').primaryKey(),
    percentage: integer('occupancy'),
    name: text('name'),
    year: integer('year'),
    month: integer('month'),
    day: integer('day'),
    chunk: integer('chunk'),
    iat: timestamp('iat'),
    ttl: timestamp('ttl'),
});

// BibPredictionData table
export const BibPredictionData = pgTable('BibPredictionData', {
    id: serial('id').primaryKey(),
    percentage: integer('occupancy'),
    name: text('name'),
    year: integer('year'),
    month: integer('month'),
    day: integer('day'),
    chunk: integer('chunk'),
    iat: timestamp('iat'),
    ttl: timestamp('ttl'),
});

// CalendarEvent table
export const CalendarEvent = pgTable('CalendarEvent', {
    id: serial('id').primaryKey(),
    name: text('name'),
    type: EventType('type'),
    start: timestamp('start'),
    end: timestamp('end'),
});
