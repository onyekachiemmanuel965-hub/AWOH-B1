import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const email = "demo.admin@example.local";
const password = "DemoAdmin1";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    console.log(JSON.stringify({ found: false, action: "none" }));
    return;
  }

  const before = await bcrypt.compare(password, user.passwordHash);
  if (!before) {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, status: "ACTIVE" },
    });
    const after = await bcrypt.compare(
      password,
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .passwordHash,
    );
    console.log(
      JSON.stringify({
        found: true,
        email: user.email,
        role: user.role.code,
        status: user.status,
        passwordMatchedBefore: false,
        reset: true,
        passwordMatchesAfter: after,
      }),
    );
    return;
  }

  console.log(
    JSON.stringify({
      found: true,
      email: user.email,
      role: user.role.code,
      status: user.status,
      passwordMatchedBefore: true,
      reset: false,
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
