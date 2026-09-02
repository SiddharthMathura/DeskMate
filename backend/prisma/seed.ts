// backend/prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
    console.log('Seeding database...');

    const adminPasswordHash = await bcrypt.hash('AdminPass123!', SALT_ROUNDS);
    const agentPasswordHash = await bcrypt.hash('AgentPass123!', SALT_ROUNDS);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@deskmate.test' },
        update: {},
        create: {
        name: 'Sid Admin',
        email: 'admin@deskmate.test',
        role: UserRole.admin,
        passwordHash: adminPasswordHash,
        },
    });

    const agent = await prisma.user.upsert({
        where: { email: 'agent@deskmate.test' },
        update: {},
        create: {
        name: 'Sid Agent',
        email: 'agent@deskmate.test',
        role: UserRole.agent,
        passwordHash: agentPasswordHash,
        },
    });

    const customers = await Promise.all(
        [
            { name: 'Customer_1', email: 'Customer_1@example.com' },
            { name: 'Customer_2', email: 'Customer_2@example.com' },
            { name: 'Customer_3', email: 'Customer_3@example.com' },
        ].map((c) =>
            prisma.customer.upsert({
                where: { email: c.email },
                update: {},
                create: c,
            })
        )
    );

    console.log('Seeded users:', { admin: admin.email, agent: agent.email });
    console.log('Seeded customers:', customers.map((c) => c.email));
}

main()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });