import {
  PrismaClient,
  ProductAvailability,
  CatalogStatus,
  UserStatus,
  TileSize,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EXPLICIT_TILE_CARTON_WEIGHTS_KG } from './seed-weights';

/**
 * Development seed only — not production AWOH-B data.
 * Catalog + RBAC roles/permissions. Privileged users require explicit env flags.
 */
const prisma = new PrismaClient();

const ROLE_DEFS = [
  {
    code: 'ADMIN',
    name: 'Admin',
    description: 'Full system administration',
  },
  {
    code: 'INVENTORY_MANAGER',
    name: 'Inventory Manager',
    description: 'Inventory and product operational responsibilities',
  },
  {
    code: 'SALES_STAFF',
    name: 'Sales Staff',
    description: 'Customer and order sales operations',
  },
  {
    code: 'CONTENT_MANAGER',
    name: 'Content Manager',
    description: 'Catalog and storefront content management',
  },
  {
    code: 'CUSTOMER',
    name: 'Customer',
    description: 'Customer-facing storefront capabilities',
  },
] as const;

const PERMISSION_DEFS: Array<{ code: string; description: string }> = [
  { code: 'users.read', description: 'Read user records' },
  { code: 'users.manage', description: 'Manage users and roles' },
  { code: 'products.read', description: 'Read product catalog (staff)' },
  { code: 'products.manage', description: 'Manage products' },
  { code: 'inventory.read', description: 'Read inventory' },
  { code: 'inventory.manage', description: 'Manage inventory quantities' },
  { code: 'orders.read', description: 'Read orders' },
  { code: 'orders.manage', description: 'Manage orders' },
  { code: 'content.manage', description: 'Manage CMS/content' },
  { code: 'payments.read', description: 'Read payment status' },
  { code: 'account.read', description: 'Read own account profile' },
  { code: 'delivery.read', description: 'Read delivery operational data' },
  { code: 'delivery.manage', description: 'Confirm/override delivery fees' },
  { code: 'audit.read', description: 'Read operational audit logs' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSION_DEFS.map((p) => p.code),
  INVENTORY_MANAGER: [
    'products.read',
    'inventory.read',
    'inventory.manage',
    'orders.read',
    'account.read',
    'delivery.read',
  ],
  SALES_STAFF: [
    'products.read',
    'orders.read',
    'orders.manage',
    'payments.read',
    'users.read',
    'account.read',
    'delivery.read',
    'delivery.manage',
  ],
  CONTENT_MANAGER: [
    'products.read',
    'products.manage',
    'content.manage',
    'account.read',
  ],
  CUSTOMER: ['account.read'],
};

async function seedRolesAndPermissions() {
  for (const perm of PERMISSION_DEFS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: perm,
    });
  }

  for (const role of ROLE_DEFS) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p]));

  for (const role of roles) {
    const codes = ROLE_PERMISSIONS[role.code] ?? [];
    for (const code of codes) {
      const permission = permByCode[code];
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeded Stage 05 roles and permissions.');
}

async function seedDevUsers() {
  const customerRole = await prisma.role.findUnique({
    where: { code: 'CUSTOMER' },
  });
  if (!customerRole) return;

  const customerEmail = process.env.DEV_CUSTOMER_EMAIL?.trim().toLowerCase();
  const customerPassword = process.env.DEV_CUSTOMER_PASSWORD;
  if (customerEmail && customerPassword) {
    const passwordHash = await bcrypt.hash(customerPassword, 12);
    await prisma.user.upsert({
      where: { email: customerEmail },
      update: {
        passwordHash,
        firstName: 'Demo',
        lastName: 'Customer',
        status: UserStatus.ACTIVE,
        roleId: customerRole.id,
      },
      create: {
        email: customerEmail,
        passwordHash,
        firstName: 'Demo',
        lastName: 'Customer',
        status: UserStatus.ACTIVE,
        roleId: customerRole.id,
      },
    });
    console.log(`Seeded development CUSTOMER: ${customerEmail}`);
  } else {
    console.log(
      'Skipped DEV customer seed (set DEV_CUSTOMER_EMAIL + DEV_CUSTOMER_PASSWORD).',
    );
  }

  const seedAdmin = process.env.SEED_DEV_ADMIN === 'true';
  const adminEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  if (seedAdmin && adminEmail && adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        'Refusing to seed DEV admin while NODE_ENV=production.',
      );
      return;
    }
    const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) return;
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        firstName: 'Dev',
        lastName: 'Admin',
        status: UserStatus.ACTIVE,
        roleId: adminRole.id,
      },
      create: {
        email: adminEmail,
        passwordHash,
        firstName: 'Dev',
        lastName: 'Admin',
        status: UserStatus.ACTIVE,
        roleId: adminRole.id,
      },
    });
    console.log(`Seeded development ADMIN: ${adminEmail}`);
  } else {
    console.log(
      'Skipped DEV admin seed (requires SEED_DEV_ADMIN=true + DEV_ADMIN_EMAIL + DEV_ADMIN_PASSWORD).',
    );
  }

  // Optional staff roles for Stage 08 RBAC smoke (never production)
  if (
    process.env.SEED_DEV_STAFF === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    const staffDefs: Array<{
      code: string;
      emailEnv: string;
      passwordEnv: string;
      firstName: string;
    }> = [
      {
        code: 'SALES_STAFF',
        emailEnv: 'DEV_SALES_EMAIL',
        passwordEnv: 'DEV_SALES_PASSWORD',
        firstName: 'Demo',
      },
      {
        code: 'INVENTORY_MANAGER',
        emailEnv: 'DEV_INVENTORY_EMAIL',
        passwordEnv: 'DEV_INVENTORY_PASSWORD',
        firstName: 'Demo',
      },
      {
        code: 'CONTENT_MANAGER',
        emailEnv: 'DEV_CONTENT_EMAIL',
        passwordEnv: 'DEV_CONTENT_PASSWORD',
        firstName: 'Demo',
      },
    ];
    for (const def of staffDefs) {
      const email = process.env[def.emailEnv]?.trim().toLowerCase();
      const password = process.env[def.passwordEnv];
      const role = await prisma.role.findUnique({ where: { code: def.code } });
      if (!email || !password || !role) continue;
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          firstName: def.firstName,
          lastName: def.code,
          status: UserStatus.ACTIVE,
          roleId: role.id,
        },
        create: {
          email,
          passwordHash,
          firstName: def.firstName,
          lastName: def.code,
          status: UserStatus.ACTIVE,
          roleId: role.id,
        },
      });
      console.log(`Seeded development ${def.code}: ${email}`);
    }
  }
}

async function seedCatalog() {
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();

  const tiles = await prisma.category.create({
    data: {
      name: 'Tiles',
      slug: 'tiles',
      description:
        'Demo category for architectural tile surfaces. Replace with catalog-managed taxonomy later.',
      imageUrl: '/images/placeholders/category-tiles.svg',
      sortOrder: 1,
      status: CatalogStatus.ACTIVE,
    },
  });

  const surfaces = await prisma.category.create({
    data: {
      name: 'Architectural Surfaces',
      slug: 'architectural-surfaces',
      description:
        'Demo category for broader architectural materials beyond tiles.',
      imageUrl: '/images/placeholders/category-surfaces.svg',
      sortOrder: 2,
      status: CatalogStatus.ACTIVE,
    },
  });

  const finishing = await prisma.category.create({
    data: {
      name: 'Finishing Materials',
      slug: 'finishing-materials',
      description: 'Demo category for finishing details and complementary materials.',
      imageUrl: '/images/placeholders/category-finishing.svg',
      sortOrder: 3,
      status: CatalogStatus.ACTIVE,
    },
  });

  const porcelain = await prisma.subcategory.create({
    data: {
      categoryId: tiles.id,
      name: 'Porcelain',
      slug: 'porcelain',
      description: 'Demo porcelain subcategory.',
      sortOrder: 1,
    },
  });

  const ceramic = await prisma.subcategory.create({
    data: {
      categoryId: tiles.id,
      name: 'Ceramic',
      slug: 'ceramic',
      description: 'Demo ceramic subcategory.',
      sortOrder: 2,
    },
  });

  const stoneLook = await prisma.subcategory.create({
    data: {
      categoryId: surfaces.id,
      name: 'Stone Look',
      slug: 'stone-look',
      description: 'Demo stone-look surfaces subcategory.',
      imageUrl: '/images/placeholders/category-marble.svg',
      sortOrder: 1,
    },
  });

  const trims = await prisma.subcategory.create({
    data: {
      categoryId: finishing.id,
      name: 'Trims & Edges',
      slug: 'trims-edges',
      description: 'Demo finishing subcategory.',
      sortOrder: 1,
    },
  });

  const products = [
    {
      subcategoryId: porcelain.id,
      name: 'Demo Porcelain Surface A',
      slug: 'demo-porcelain-surface-a',
      description:
        'Development demo product. Not a real AWOH-B SKU. Placeholder description for catalog verification.',
      price: '18500.00',
      featured: true,
      sortOrder: 1,
      // Explicit DB weight — NOT inferred from name/slug/sizeHint at runtime
      weightPerCartonKg: EXPLICIT_TILE_CARTON_WEIGHTS_KG['600x600'],
      tileSize: TileSize.SIZE_60X60,
      specsJson: JSON.stringify({
        finish: 'Matte',
        application: 'Floor / Wall',
        note: 'Demo specification only',
        sizeHint: '600x600',
      }),
      images: [
        {
          url: '/images/placeholders/product-a.svg',
          altText: 'Demo porcelain surface A primary image',
          sortOrder: 0,
          isPrimary: true,
        },
        {
          url: '/images/placeholders/product-b.svg',
          altText: 'Demo porcelain surface A gallery image',
          sortOrder: 1,
          isPrimary: false,
        },
      ],
    },
    {
      subcategoryId: porcelain.id,
      name: 'Demo Porcelain Surface B',
      slug: 'demo-porcelain-surface-b',
      description:
        'Development demo product for search and filtering checks. Placeholder content only.',
      price: '21200.00',
      featured: true,
      sortOrder: 2,
      weightPerCartonKg: EXPLICIT_TILE_CARTON_WEIGHTS_KG['300x600'],
      tileSize: TileSize.SIZE_30X60,
      specsJson: JSON.stringify({
        finish: 'Polished',
        application: 'Wall',
        sizeHint: '300x600',
      }),
      images: [
        {
          url: '/images/placeholders/product-b.svg',
          altText: 'Demo porcelain surface B primary image',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    },
    {
      subcategoryId: ceramic.id,
      name: 'Demo Ceramic Surface C',
      slug: 'demo-ceramic-surface-c',
      description:
        'Development demo ceramic product. Prices and names are placeholders.',
      price: '9800.00',
      featured: false,
      sortOrder: 1,
      weightPerCartonKg: EXPLICIT_TILE_CARTON_WEIGHTS_KG['250x400'],
      tileSize: TileSize.SIZE_25X40,
      specsJson: JSON.stringify({ sizeHint: '250x400' }),
      images: [
        {
          url: '/images/placeholders/product-c.svg',
          altText: 'Demo ceramic surface C primary image',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    },
    {
      subcategoryId: stoneLook.id,
      name: 'Demo Stone-Look Surface D',
      slug: 'demo-stone-look-surface-d',
      description:
        'Development demo for architectural surfaces category expansion.',
      price: '27400.00',
      featured: true,
      sortOrder: 1,
      weightPerCartonKg: EXPLICIT_TILE_CARTON_WEIGHTS_KG['1200x600'],
      tileSize: TileSize.SIZE_120X60,
      availability: ProductAvailability.AVAILABLE,
      specsJson: JSON.stringify({ sizeHint: '1200x600' }),
      images: [
        {
          url: '/images/placeholders/inspire-detail.svg',
          altText: 'Demo stone-look surface primary image',
          sortOrder: 0,
          isPrimary: true,
        },
        {
          url: '/images/placeholders/inspire-light.svg',
          altText: 'Demo stone-look surface gallery image',
          sortOrder: 1,
          isPrimary: false,
        },
      ],
    },
    {
      subcategoryId: trims.id,
      name: 'Demo Edge Trim E',
      slug: 'demo-edge-trim-e',
      description: 'Development demo finishing material. Not for production sale.',
      price: '3200.00',
      featured: false,
      sortOrder: 1,
      weightPerCartonKg: '5',
      tileSize: TileSize.SIZE_40X40,
      availability: ProductAvailability.UNAVAILABLE,
      stockQuantity: 0,
      images: [
        {
          url: '/images/placeholders/category-finishing.svg',
          altText: 'Demo edge trim placeholder image',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    },
    {
      subcategoryId: ceramic.id,
      name: 'Demo Ceramic Surface F',
      slug: 'demo-ceramic-surface-f',
      description: 'Additional demo item for pagination and sorting verification.',
      price: '11400.00',
      featured: false,
      sortOrder: 2,
      weightPerCartonKg: EXPLICIT_TILE_CARTON_WEIGHTS_KG['250x500'],
      tileSize: TileSize.SIZE_25X50,
      specsJson: JSON.stringify({ sizeHint: '250x500' }),
      images: [
        {
          url: '/images/placeholders/inspire-architecture.svg',
          altText: 'Demo ceramic surface F image',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
    },
  ];

  for (const p of products) {
    const { images, ...data } = p;
    await prisma.product.create({
      data: {
        ...data,
        currency: 'NGN',
        status: CatalogStatus.ACTIVE,
        availability: data.availability ?? ProductAvailability.AVAILABLE,
        stockQuantity: data.stockQuantity ?? 25,
        images: { create: images },
      },
    });
  }

  console.log('Seeded AWOH-B Stage 04 development catalog.');
}

async function seedDeliveryConfig() {
  const existing = await prisma.deliveryConfig.findFirst({
    where: { active: true },
  });
  if (existing) {
    console.log('Active delivery config already present.');
    return;
  }
  // PROVISIONAL development defaults — not final AWOH-B production policy.
  // ₦500/km is configuration input for local/dev only unless owners approve it.
  const rate = process.env.DELIVERY_DEFAULT_DISTANCE_RATE || '500.00';
  await prisma.deliveryConfig.create({
    data: {
      name: 'Provisional Stage 07 development config',
      currency: process.env.PAYMENT_CURRENCY || 'NGN',
      ratePerKm: rate,
      weightFactorPerKg: '0',
      minFee: '0',
      maxFee: null,
      negotiationThreshold: '250000.00',
      quoteTtlMinutes: 120,
      active: true,
    },
  });
  console.log(
    `Seeded provisional delivery config (ratePerKm=${rate} — development placeholder, not approved production policy).`,
  );
}

async function main() {
  await seedRolesAndPermissions();
  await seedDevUsers();
  await seedCatalog();
  await seedDeliveryConfig();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
