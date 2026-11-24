import { Product, Order, SaleDay, CategorySale } from '../types'
import { subDays, format } from 'date-fns'

// ── Productos ─────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  { id:'p1',  name:'Cerveza Estrella Damm',  category:'Cervezas',  price:3.50,  stock:120, minStock:30, unit:'unidades' },
  { id:'p2',  name:'Cerveza Voll-Damm',       category:'Cervezas',  price:4.00,  stock:80,  minStock:20, unit:'unidades' },
  { id:'p3',  name:'Coca-Cola',               category:'Refrescos', price:2.50,  stock:200, minStock:50, unit:'latas' },
  { id:'p4',  name:'Agua Mineral',            category:'Refrescos', price:1.50,  stock:150, minStock:40, unit:'botellas' },
  { id:'p5',  name:'Vino Tinto Rioja',        category:'Vinos',     price:4.50,  stock:45,  minStock:12, unit:'copas' },
  { id:'p6',  name:'Vino Blanco Albariño',    category:'Vinos',     price:4.50,  stock:38,  minStock:12, unit:'copas' },
  { id:'p7',  name:'Gin Tonic Hendricks',     category:'Combinados',price:9.00,  stock:60,  minStock:15, unit:'unidades' },
  { id:'p8',  name:'Mojito',                  category:'Combinados',price:8.00,  stock:5,   minStock:10, unit:'unidades' },
  { id:'p9',  name:'Patatas Bravas',          category:'Tapas',     price:5.50,  stock:30,  minStock:10, unit:'raciones' },
  { id:'p10', name:'Croquetas Jamón (8u)',    category:'Tapas',     price:7.00,  stock:25,  minStock:10, unit:'raciones' },
  { id:'p11', name:'Tabla Ibéricos',          category:'Tablas',    price:16.00, stock:18,  minStock:5,  unit:'unidades' },
  { id:'p12', name:'Tabla Quesos',            category:'Tablas',    price:14.00, stock:12,  minStock:4,  unit:'unidades' },
  { id:'p13', name:'Pincho Tortilla',         category:'Tapas',     price:2.50,  stock:40,  minStock:15, unit:'pinchos' },
  { id:'p14', name:'Vermut Rojo',             category:'Aperitivos',price:3.50,  stock:7,   minStock:10, unit:'copas' },
  { id:'p15', name:'Café Solo',               category:'Cafés',     price:1.80,  stock:500, minStock:100,unit:'dosis' },
  { id:'p16', name:'Café con Leche',          category:'Cafés',     price:2.20,  stock:500, minStock:100,unit:'dosis' },
  { id:'p17', name:'Whisky J&B',             category:'Combinados',price:8.00,  stock:55,  minStock:12, unit:'unidades' },
  { id:'p18', name:'Ron Brugal',              category:'Combinados',price:7.50,  stock:48,  minStock:12, unit:'unidades' },
]

// ── Camareros ──────────────────────────────────────────────────────────────────
const WAITERS = ['Ricardo Quintero','Ana Molina','Carlos Fuentes','Laura Sánchez']
const METHODS: Order['paymentMethod'][] = ['efectivo','tarjeta','bizum']
const STATUSES: Order['status'][] = ['pendiente','preparando','listo','servido','pagado']

// ── Generar pedidos simulados ──────────────────────────────────────────────────
function randomInt(min: number, max: number) { return Math.floor(Math.random()*( max-min+1))+min }
function pick<T>(arr: T[]): T { return arr[randomInt(0,arr.length-1)] }

function generateOrder(id: string, daysAgo: number): Order {
  const numItems = randomInt(1, 5)
  const selectedProducts = [...PRODUCTS].sort(()=>Math.random()-0.5).slice(0, numItems)
  const items = selectedProducts.map(p=>({
    productId: p.id,
    productName: p.name,
    quantity: randomInt(1,4),
    price: p.price,
  }))
  const total = items.reduce((s,i)=>s+i.quantity*i.price, 0)
  const createdAt = subDays(new Date(), daysAgo)
  createdAt.setHours(randomInt(11,23), randomInt(0,59))
  return {
    id,
    tableNumber: randomInt(1,14),
    waiter: pick(WAITERS),
    items,
    total: Math.round(total*100)/100,
    status: daysAgo>0 ? 'pagado' : pick(STATUSES),
    createdAt,
    paidAt: daysAgo>0 ? createdAt : undefined,
    paymentMethod: daysAgo>0 ? pick(METHODS) : undefined,
  }
}

export const ORDERS: Order[] = Array.from({length:180}, (_,i)=>
  generateOrder(`ORD-${String(i+1).padStart(4,'0')}`, Math.floor(i/8))
)

// ── Ventas por día (30 días) ────────────────────────────────────────────────
export const SALES_30D: SaleDay[] = Array.from({length:30}, (_,i)=>{
  const d = subDays(new Date(), 29-i)
  const isWeekend = [0,6].includes(d.getDay())
  const base = isWeekend ? randomInt(620,980) : randomInt(320,620)
  const orders = randomInt(28, isWeekend?65:45)
  return {
    date: format(d,'dd/MM'),
    revenue: base,
    orders,
    avgTicket: Math.round((base/orders)*100)/100,
  }
})

// ── Ventas por categoría ────────────────────────────────────────────────────
export const CATEGORY_SALES: CategorySale[] = [
  { category:'Cervezas',   revenue:2840, orders:810, color:'#7C6EF8' },
  { category:'Combinados', revenue:3920, orders:435, color:'#22C55E' },
  { category:'Tapas',      revenue:2180, orders:312, color:'#F59E0B' },
  { category:'Vinos',      revenue:1640, orders:364, color:'#EF4444' },
  { category:'Refrescos',  revenue:920,  orders:615, color:'#06B6D4' },
  { category:'Tablas',     revenue:1540, orders:110, color:'#EC4899' },
  { category:'Cafés',      revenue:680,  orders:378, color:'#8B5CF6' },
  { category:'Aperitivos', revenue:520,  orders:149, color:'#F97316' },
]

// ── KPIs ────────────────────────────────────────────────────────────────────
export const KPI = {
  revenueToday:    SALES_30D[SALES_30D.length-1].revenue,
  revenueMonth:    SALES_30D.reduce((s,d)=>s+d.revenue,0),
  ordersToday:     SALES_30D[SALES_30D.length-1].orders,
  tablesOccupied:  randomInt(4,10),
  totalTables:     14,
  avgTicketToday:  SALES_30D[SALES_30D.length-1].avgTicket,
  stockAlerts:     PRODUCTS.filter(p=>p.stock<=p.minStock).length,
}
