const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DATA_PATH = path.join(__dirname, 'location-data', 'lgas-with-wards.json');

const STATE_CODES = {
  Abia: 'AB', Adamawa: 'AD', 'Akwa Ibom': 'AK', Anambra: 'AN', Bauchi: 'BA',
  Bayelsa: 'BY', Benue: 'BE', Borno: 'BO', 'Cross River': 'CR', Delta: 'DE',
  Ebonyi: 'EB', Edo: 'ED', Ekiti: 'EK', Enugu: 'EN',
  'Federal Capital Territory': 'FC', Gombe: 'GO', Imo: 'IM', Jigawa: 'JI',
  Kaduna: 'KD', Kano: 'KN', Katsina: 'KT', Kebbi: 'KE', Kogi: 'KO', Kwara: 'KW',
  Lagos: 'LA', Nasarawa: 'NA', Niger: 'NI', Ogun: 'OG', Ondo: 'ON', Osun: 'OS',
  Oyo: 'OY', Plateau: 'PL', Rivers: 'RI', Sokoto: 'SO', Taraba: 'TA',
  Yobe: 'YO', Zamfara: 'ZA',
};

function slugCode(name) {
  return String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
}

function townsFromWards(lgaName, wards) {
  const names = new Set();
  names.add(String(lgaName).trim());
  for (const ward of wards || []) {
    const raw = typeof ward === 'string' ? ward : ward && ward.name;
    if (!raw || !String(raw).trim()) continue;
    String(raw).split(/[/|,]+/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean)
      .forEach((part) => names.add(part));
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'));
}

function cuidLike() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const stateNames = Object.keys(raw).sort((a, b) => a.localeCompare(b, 'en'));
  console.log('Rebuilding locations from', stateNames.length, 'states...');

  // Clear location hierarchy (order FKs are onDelete SetNull).
  await prisma.nigTown.deleteMany();
  await prisma.nigLga.deleteMany();
  await prisma.nigState.deleteMany();

  const stateRows = [];
  const lgaRows = [];
  const townRows = [];

  for (let si = 0; si < stateNames.length; si++) {
    const stateName = stateNames[si];
    const code = STATE_CODES[stateName] || slugCode(stateName).slice(0, 4);
    const displayName = stateName === 'Federal Capital Territory' ? 'FCT' : stateName;
    const stateId = cuidLike();
    stateRows.push({ id: stateId, code, name: displayName, sortOrder: si, active: true });

    const lgaMap = raw[stateName] || {};
    const lgaNames = Object.keys(lgaMap).sort((a, b) => a.localeCompare(b, 'en'));
    for (let li = 0; li < lgaNames.length; li++) {
      const lgaName = lgaNames[li];
      const lgaDisplay = lgaName.replace(/\//g, '-').replace(/\s+/g, ' ').trim();
      const lgaCode = slugCode(lgaDisplay);
      const lgaId = cuidLike();
      lgaRows.push({ id: lgaId, stateId, code: lgaCode, name: lgaDisplay, sortOrder: li, active: true });

      const usedCodes = new Set();
      const townNames = townsFromWards(lgaDisplay, lgaMap[lgaName]);
      for (let ti = 0; ti < townNames.length; ti++) {
        const townName = townNames[ti];
        let townCode = slugCode(townName) || ('T_' + ti);
        let unique = townCode;
        let n = 2;
        while (usedCodes.has(unique)) { unique = townCode + '_' + n; n += 1; }
        usedCodes.add(unique);
        townRows.push({ id: cuidLike(), lgaId, code: unique, name: townName, sortOrder: ti, active: true });
      }
    }
  }

  console.log('Prepared', { states: stateRows.length, lgas: lgaRows.length, towns: townRows.length });

  await prisma.nigState.createMany({ data: stateRows });
  // Batch LGAs
  for (let i = 0; i < lgaRows.length; i += 200) {
    await prisma.nigLga.createMany({ data: lgaRows.slice(i, i + 200) });
  }
  // Batch towns
  for (let i = 0; i < townRows.length; i += 500) {
    await prisma.nigTown.createMany({ data: townRows.slice(i, i + 500) });
    if (i % 2000 === 0) console.log('towns inserted', Math.min(i + 500, townRows.length), '/', townRows.length);
  }

  // Verify Orlu / Ikeja
  const orlu = await prisma.nigLga.findFirst({ where: { name: 'Orlu' }, include: { towns: { orderBy: { name: 'asc' } }, state: true } });
  const ikeja = await prisma.nigLga.findFirst({ where: { name: 'Ikeja' }, include: { towns: true, state: true } });
  console.log(JSON.stringify({
    states: stateRows.length,
    lgas: lgaRows.length,
    towns: townRows.length,
    sampleOrlu: orlu && { state: orlu.state.name, towns: orlu.towns.length, names: orlu.towns.slice(0, 12).map(t => t.name) },
    sampleIkeja: ikeja && { state: ikeja.state.name, towns: ikeja.towns.length, names: ikeja.towns.slice(0, 12).map(t => t.name) },
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
