import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword } from "../dist/src/auth/password.util.js";

const prisma = new PrismaClient();

async function main() {
  const email = "demo.admin@example.local";
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) {
    console.log(JSON.stringify({ found: false }));
    return;
  }
  const ok = await verifyPassword("DemoAdmin1", user.passwordHash);
  console.log(
    JSON.stringify({
      found: true,
      email: user.email,
      status: user.status,
      role: user.role.code,
      passwordMatchesDemoAdmin1: ok,
      hashPrefix: user.passwordHash.slice(0, 7),
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
