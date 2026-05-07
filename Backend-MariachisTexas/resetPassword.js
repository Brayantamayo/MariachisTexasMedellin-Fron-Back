const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = "admin@mariachistexas.com";

  const hash = await bcrypt.hash("123456", 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hash }
  });

  console.log("Usuario actualizado:", user.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());