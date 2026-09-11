// backend/prisma/seed.ts
import { PrismaClient, UserRole, TicketStatus, TicketPriority, MessageSenderType } from '@prisma/client';
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

    console.log('Clearing existing tickets/messages/draft requests...');
    await prisma.aiDraftRequest.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.ticket.deleteMany({});

    const [customer1, customer2, customer3] = customers;

    const ticketDefs = [
        {
            customer: customer1,
            subject: 'Cannot log in after password reset',
            status: TicketStatus.open,
            priority: TicketPriority.urgent,
            assignedAgentId: null,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "I reset my password an hour ago but I still can't log in. It just says 'invalid credentials' every time. This is urgent, I need access today." },
            ],
        },
        {
            customer: customer2,
            subject: 'Feature request: dark mode',
            status: TicketStatus.open,
            priority: TicketPriority.normal,
            assignedAgentId: null,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "Would love a dark mode option for the dashboard. Staring at a bright white screen all day is rough on the eyes." },
            ],
        },
        {
            customer: customer3,
            subject: 'Billing discrepancy on last invoice',
            status: TicketStatus.pending,
            priority: TicketPriority.high,
            assignedAgentId: agent.id,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "My invoice this month shows two charges for the same subscription. Can you take a look?" },
                { senderType: MessageSenderType.agent, senderId: agent.id, body: "Thanks for flagging this — I can see the duplicate charge on our end. I've escalated it to billing and we'll issue a refund within 3-5 business days. I'll follow up here once it's processed." },
                { senderType: MessageSenderType.customer, senderId: null, body: "Appreciate the quick response! I'll keep an eye out for the refund." },
            ],
        },
        {
            customer: customer1,
            subject: 'Export to CSV not working',
            status: TicketStatus.resolved,
            priority: TicketPriority.normal,
            assignedAgentId: agent.id,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "The 'Export to CSV' button on the reports page doesn't seem to do anything when I click it." },
                { senderType: MessageSenderType.agent, senderId: agent.id, body: "This was a bug on our end tied to a browser popup blocker silently swallowing the download. We've shipped a fix that triggers the download differently. Could you try again and let me know if it works now?" },
                { senderType: MessageSenderType.customer, senderId: null, body: "Just tested it — works perfectly now, thank you!" },
            ],
        },
        {
            customer: customer2,
            subject: 'Account upgrade completed',
            status: TicketStatus.closed,
            priority: TicketPriority.low,
            assignedAgentId: agent.id,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "Just confirming — did my upgrade to the Pro plan go through?" },
                { senderType: MessageSenderType.agent, senderId: agent.id, body: "Confirmed, you're all set on Pro as of today. Let us know if anything looks off on your end." },
                { senderType: MessageSenderType.customer, senderId: null, body: "Perfect, thanks for confirming!" },
            ],
        },
        {
            customer: customer3,
            subject: 'Integration webhook returning 500',
            status: TicketStatus.open,
            priority: TicketPriority.high,
            assignedAgentId: null,
            messages: [
                { senderType: MessageSenderType.customer, senderId: null, body: "Our webhook endpoint has been receiving 500 errors from your integration since yesterday around 3pm UTC. Nothing changed on our side. Any known issues?" },
            ],
        },
    ];

    for (const def of ticketDefs) {
        const ticket = await prisma.ticket.create({
            data: {
                customerId: def.customer.id,
                assignedAgentId: def.assignedAgentId,
                subject: def.subject,
                status: def.status,
                priority: def.priority,
            },
        });

        for (const msg of def.messages) {
            await prisma.message.create({
                data: {
                    ticketId: ticket.id,
                    senderType: msg.senderType,
                    senderId: msg.senderId,
                    body: msg.body,
                    isDraft: false,
                },
            });
        }
    }

    console.log(`Seeded ${ticketDefs.length} tickets with message threads.`);
}

main()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });