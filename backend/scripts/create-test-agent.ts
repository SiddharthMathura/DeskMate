import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/db/prisma';

async function main() {
  const email = 'agent@deskmate.test';
  const plainPassword = 'test-password-123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { name: 'Test Agent', email, passwordHash, role: 'agent' },
  });

  console.log('Test agent ready:', { id: user.id, email: user.email, role: user.role });
  console.log('Login with password:', plainPassword);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Failed to create test agent:', err);
  process.exit(1);
});