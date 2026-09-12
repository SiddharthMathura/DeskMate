import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/services/seed.service';

const prisma = new PrismaClient();

seedDatabase(prisma)
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });