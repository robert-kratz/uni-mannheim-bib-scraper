// prisma/prismaClient.ts
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();

declare global {
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
    global.prisma = prisma;
}

export default prisma;
