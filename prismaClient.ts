// prismaClient.ts
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';

let prisma: PrismaClient;

declare global {
    var prisma: PrismaClient;
}

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
    logger.info('Connected to database with Prisma Client');
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
        logger.info('Connected to database with Prisma Client');
    }
    prisma = global.prisma;
}

export default prisma;
