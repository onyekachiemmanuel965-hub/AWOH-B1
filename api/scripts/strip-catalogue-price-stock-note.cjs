const { PrismaClient } = require('@prisma/client');

const phrase = ' Price and stock not assigned from catalogue.';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      description: { contains: 'Price and stock not assigned from catalogue.' },
    },
    select: { id: true, description: true },
  });

  let updated = 0;
  for (const row of rows) {
    const next = (row.description || '')
      .split(phrase)
      .join('')
      .replace(/\s+\./g, '.')
      .trim();
    await prisma.product.update({
      where: { id: row.id },
      data: { description: next },
    });
    updated += 1;
  }

  console.log(`updated ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
