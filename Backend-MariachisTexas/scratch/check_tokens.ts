import prisma from '../src/config/prisma';
async function main() {
  const tokens = await prisma.registroToken.findMany({
    where: { usado: false },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(tokens, null, 2));
}
main().finally(() => prisma.$disconnect());
