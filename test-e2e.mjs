// Prueba end-to-end del flujo de negocio contra el servidor local
const BASE = 'http://localhost:3000'

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie')
  let data = null
  try { data = await res.json() } catch {}
  return { status: res.status, data, setCookie }
}

function extractCookie(setCookie) {
  if (!setCookie) return null
  const match = setCookie.match(/mercado_session=[^;]+/)
  return match ? match[0] : null
}

let passed = 0, failed = 0
function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${extra}`) }
}

async function main() {
  console.log('\n1️⃣  LOGIN')
  // Login incorrecto
  const bad = await api('/api/auth/login', { method: 'POST', body: { email: 'maria@mercado.app', password: 'mala' } })
  check('Login con contraseña incorrecta → 401', bad.status === 401)

  // Login maria
  const maria = await api('/api/auth/login', { method: 'POST', body: { email: 'maria@mercado.app', password: 'demo1234' } })
  const mariaCookie = extractCookie(maria.setCookie)
  check('Login maria@mercado.app → 200 + cookie', maria.status === 200 && !!mariaCookie)
  check('Maria tiene roles COMPRADOR y VENDEDOR', maria.data?.user?.roles?.includes('COMPRADOR') && maria.data?.user?.roles?.includes('VENDEDOR'))

  // Login juan y admin
  const juan = await api('/api/auth/login', { method: 'POST', body: { email: 'juan@mercado.app', password: 'demo1234' } })
  const juanCookie = extractCookie(juan.setCookie)
  const admin = await api('/api/auth/login', { method: 'POST', body: { email: 'admin@mercado.app', password: 'admin123' } })
  const adminCookie = extractCookie(admin.setCookie)
  check('Login juan y admin → 200', juan.status === 200 && admin.status === 200)

  console.log('\n2️⃣  CATÁLOGO')
  const catalog = await api('/api/products', { cookie: mariaCookie })
  const cats = catalog.data?.categories ?? []
  const totalProducts = cats.reduce((s, c) => s + c.products.length, 0)
  check(`Catálogo: 5 categorías, ${totalProducts} productos`, cats.length === 5 && totalProducts >= 30)
  check('Sin sesión → 401', (await api('/api/products')).status === 401)

  console.log('\n3️⃣  CREAR LISTA (vendedor → asigna comprador)')
  const juanId = juan.data.user.id
  const p1 = cats[0].products[0] // Tomate
  const p2 = cats[0].products[1] // Cebolla
  const p3 = cats[4].products[0] // Arroz
  const created = await api('/api/lists', {
    method: 'POST',
    cookie: mariaCookie,
    body: {
      title: 'Compras de prueba E2E',
      buyerId: juanId,
      items: [
        { productId: p1.id, quantity: 5, unit: 'lb' },
        { productId: p2.id, quantity: 3, unit: 'lb' },
        { productId: p3.id, quantity: 1, unit: 'qq' },
      ],
    },
  })
  check('Lista creada → 201 con 3 items', created.status === 201 && created.data?.list?.items?.length === 3)
  const listId = created.data?.list?.id
  const items = created.data?.list?.items ?? []

  console.log('\n4️⃣  MODO COMPRA (juan marca casillas)')
  // Juan ve sus listas asignadas
  const assigned = await api('/api/lists?filter=asignadas', { cookie: juanCookie })
  check('Juan ve la lista asignada', assigned.data?.lists?.some((l) => l.id === listId))

  // Marcar SIN precio → debe fallar (regla de negocio clave)
  const noPrice = await api(`/api/lists/${listId}/items/${items[0].id}`, {
    method: 'PATCH', cookie: juanCookie, body: { checked: true },
  })
  check('Marcar SIN precio de compra → 400 (obligatorio)', noPrice.status === 400)

  // Marcar CON precio → ok
  const withPrice = await api(`/api/lists/${listId}/items/${items[0].id}`, {
    method: 'PATCH', cookie: juanCookie, body: { checked: true, purchasePrice: 25.5, salePrice: 35 },
  })
  check('Marcar CON precio → 200', withPrice.status === 200)
  check('Estado pasa a EN_COMPRA + fecha de compra automática', withPrice.data?.listStatus === 'EN_COMPRA' && !!withPrice.data?.purchaseDate)

  // Precio de venta opcional (sin él también funciona)
  const noSale = await api(`/api/lists/${listId}/items/${items[1].id}`, {
    method: 'PATCH', cookie: juanCookie, body: { checked: true, purchasePrice: 18 },
  })
  check('Marcar sin precio de venta (opcional) → 200', noSale.status === 200)

  // Maria (creadora) marca el tercero → también puede
  const third = await api(`/api/lists/${listId}/items/${items[2].id}`, {
    method: 'PATCH', cookie: mariaCookie, body: { checked: true, purchasePrice: 320, salePrice: 400 },
  })
  check('Creadora también puede marcar → 200', third.status === 200)
  check('Todos marcados → COMPLETADA', third.data?.listStatus === 'COMPLETADA')

  // Usuario sin acceso no puede marcar
  const adminTry = await api(`/api/lists/${listId}/items/${items[0].id}`, {
    method: 'PATCH', cookie: adminCookie, body: { checked: false },
  })
  check('Admin SÍ puede (rol ADMIN) → 200', adminTry.status === 200)
  // Volver a marcar
  await api(`/api/lists/${listId}/items/${items[0].id}`, {
    method: 'PATCH', cookie: adminCookie, body: { checked: true, purchasePrice: 25.5, salePrice: 35 },
  })

  console.log('\n5️⃣  COMPARTIR INTERNO')
  const adminId = admin.data.user.id
  const share = await api(`/api/lists/${listId}/share`, {
    method: 'POST', cookie: mariaCookie, body: { userId: adminId },
  })
  check('Maria comparte con admin → 201', share.status === 201)
  const sharedWithAdmin = await api(`/api/lists/${listId}`, { cookie: adminCookie })
  check('Admin puede ver la lista compartida', sharedWithAdmin.status === 200)

  // Juan (no creador) no puede compartir
  const juanShare = await api(`/api/lists/${listId}/share`, {
    method: 'POST', cookie: juanCookie, body: { userId: adminId },
  })
  check('Juan (no creador) NO puede compartir → 403', juanShare.status === 403)

  console.log('\n6️⃣  PANEL ADMIN')
  const adminProducts = await api('/api/admin/products', { cookie: adminCookie })
  check('Admin ve productos (incl. ocultos)', adminProducts.status === 200)
  const mariaAdmin = await api('/api/admin/products', { cookie: mariaCookie })
  check('Maria NO es admin → 403', mariaAdmin.status === 403)

  // Crear producto
  const catId = adminProducts.data.categories[0].id
  const newProduct = await api('/api/admin/products', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'Producto Test', icon: '🧪', categoryId: catId },
  })
  check('Admin crea producto → 201', newProduct.status === 201)
  // Ocultarlo
  const hide = await api(`/api/admin/products/${newProduct.data.product.id}`, {
    method: 'PATCH', cookie: adminCookie, body: { visible: false },
  })
  check('Admin oculta producto del catálogo', hide.status === 200 && hide.data?.product?.visible === false)
  // Eliminarlo (no está en listas)
  const del = await api(`/api/admin/products/${newProduct.data.product.id}`, {
    method: 'DELETE', cookie: adminCookie,
  })
  check('Admin elimina producto sin uso → 200', del.status === 200)

  // Crear usuario con roles
  const newUser = await api('/api/admin/users', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'Usuario Test', email: 'test@mercado.app', password: 'test123', roles: ['COMPRADOR'] },
  })
  check('Admin crea usuario con rol → 201', newUser.status === 201)
  const dupUser = await api('/api/admin/users', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'Duplicado', email: 'test@mercado.app', password: 'test123', roles: ['COMPRADOR'] },
  })
  check('Email duplicado → 409', dupUser.status === 409)

  console.log('\n7️⃣  PROXY (protección de páginas)')
  const noAuth = await fetch(BASE + '/', { redirect: 'manual' })
  check('Página / sin sesión → redirect a /login', noAuth.status === 307 && (noAuth.headers.get('location') ?? '').includes('/login'))

  console.log(`\n📊 RESULTADO: ${passed} pasaron, ${failed} fallaron\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => { console.error('Error en pruebas:', e); process.exit(1) })
