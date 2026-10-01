import {
  PrismaClient,
  ProductAvailability,
} from "@prisma/client";

const prisma = new PrismaClient();

const WEIGHTS = {
  SIZE_60X60: "29.00",
  SIZE_40X40: "20.00",
  SIZE_25X40: "15.00",
  SIZE_25X50: "22.00",
  SIZE_30X60: "25.00",
  SIZE_120X60: "33.00",
};

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, tileSize: true },
  });

  let withWeight = 0;
  let noTileSize = 0;

  for (const p of products) {
    const weight = p.tileSize ? WEIGHTS[p.tileSize] : null;
    if (!weight) {
      noTileSize += 1;
      await prisma.product.update({
        where: { id: p.id },
        data: {
          stockQuantity: 100,
          availability: ProductAvailability.AVAILABLE,
        },
      });
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        stockQuantity: 100,
        availability: ProductAvailability.AVAILABLE,
        weightPerCartonKg: weight,
      },
    });
    withWeight += 1;
  }

  const bySize = await prisma.product.groupBy({
    by: ["tileSize"],
    _count: { _all: true },
    _min: { stockQuantity: true, weightPerCartonKg: true },
    _max: { stockQuantity: true, weightPerCartonKg: true },
  });

  const availability = await prisma.product.groupBy({
    by: ["availability"],
    _count: { _all: true },
  });

  console.log(
    JSON.stringify(
      {
        total: products.length,
        withWeight,
        noTileSize,
        availability,
        bySize,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
