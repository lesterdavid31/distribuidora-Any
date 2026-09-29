import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  { name: 'Verduras', icon: '🍅', order: 1 },
  { name: 'Hortalizas', icon: '🥬', order: 2 },
  { name: 'Especias', icon: '🌶️', order: 3 },
  { name: 'Legumbres', icon: '🫘', order: 4 },
  { name: 'Granos', icon: '🌾', order: 5 },
]

const PRODUCTS: Record<string, { name: string; icon: string }[]> = {
  Verduras: [
    { name: 'Tomate', icon: '🍅' },
    { name: 'Cebolla', icon: '🧅' },
    { name: 'Papa', icon: '🥔' },
    { name: 'Zanahoria', icon: '🥕' },
    { name: 'Ajo', icon: '🧄' },
    { name: 'Pepino', icon: '🥒' },
    { name: 'Chile pimiento', icon: '🫑' },
    { name: 'Güicoy (calabaza)', icon: '🎃' },
    { name: 'Brócoli', icon: '🥦' },
    { name: 'Aguacate', icon: '🥑' },
    { name: 'Plátano', icon: '🍌' },
    { name: 'Güisquil', icon: '🍈' },
  ],
  Hortalizas: [
    { name: 'Lechuga', icon: '🥬' },
    { name: 'Repollo', icon: '🥬' },
    { name: 'Cilantro', icon: '🌿' },
    { name: 'Apio', icon: '🌿' },
    { name: 'Espinaca', icon: '🥬' },
    { name: 'Ejotes', icon: '🫛' },
    { name: 'Arveja', icon: '🫛' },
  ],
  Especias: [
    { name: 'Chile seco', icon: '🌶️' },
    { name: 'Pimienta negra', icon: '⚫' },
    { name: 'Orégano', icon: '🌿' },
    { name: 'Achiote', icon: '🟠' },
    { name: 'Comino', icon: '🟤' },
    { name: 'Sal', icon: '🧂' },
  ],
  Legumbres: [
    { name: 'Frijol negro', icon: '🫘' },
    { name: 'Frijol rojo', icon: '🫘' },
    { name: 'Lenteja', icon: '🫛' },
    { name: 'Garbanzo', icon: '🫛' },
  ],
  Granos: [
    { name: 'Arroz', icon: '🍚' },
    { name: 'Maíz', icon: '🌽' },
    { name: 'Avena', icon: '🌾' },
    { name: 'Harina de trigo', icon: '🌾' },
    { name: 'Maní', icon: '🥜' },
  ],
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // Roles
  const roles = ['ADMIN', 'COMPRADOR', 'VENDEDOR'] as const
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log('✅ Roles creados')

  // Categorías y productos
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, order: cat.order },
      create: cat,
    })
    const products = PRODUCTS[cat.name] ?? []
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      await prisma.product.upsert({
        where: { name_categoryId: { name: p.name, categoryId: category.id } },
        update: { icon: p.icon, order: i + 1 },
        create: { ...p, order: i + 1, categoryId: category.id },
      })
    }
  }
  console.log('✅ Categorías y productos creados')

  // Usuarios
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } })
  const compradorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'COMPRADOR' } })
  const vendedorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'VENDEDOR' } })

  async function upsertUser(name: string, email: string, password: string, roleIds: string[]) {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash },
      create: { name, email, passwordHash },
    })
    await prisma.userRole.deleteMany({ where: { userId: user.id } })
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId: user.id, roleId })),
    })
    return user
  }

  await upsertUser('Administrador', 'admin@mercado.app', 'admin123', [adminRole.id])
  await upsertUser('María López', 'maria@mercado.app', 'demo1234', [compradorRole.id, vendedorRole.id])
  await upsertUser('Juan Pérez', 'juan@mercado.app', 'demo1234', [compradorRole.id, vendedorRole.id])
  console.log('✅ Usuarios creados')

  console.log('🎉 Seed completado')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
