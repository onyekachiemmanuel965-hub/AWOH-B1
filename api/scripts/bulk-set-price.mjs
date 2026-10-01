import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.product.updateMany({
  data: { price: "5000.00" },
});

const sample = await prisma.product.findMany({
  take: 3,
  select: {
    name: true,
    price: true,
    availability: true,
    stockQuantity: true,
  },
});

console.log(JSON.stringify({ updated: result.count, sample }, null, 2));
await prisma.$disconnect();
