import { prisma } from '../src/lib/prisma.js';

async function checkDb() {
  const sets = await prisma.set.count();
  const skills = await prisma.skill.count();
  const buffs = await prisma.buff.count();
  const tags = await prisma.tag.count();
  const itemTags = await prisma.itemTag.count();

  console.log('Database counts:');
  console.log('  Sets:', sets);
  console.log('  Skills:', skills);
  console.log('  Buffs:', buffs);
  console.log('  Tags:', tags);
  console.log('  ItemTags:', itemTags);
}

checkDb().then(() => process.exit(0));
