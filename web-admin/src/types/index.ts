export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  unit: string
  image?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  tableNumber: number
  waiter: string
  items: OrderItem[]
  total: number
  status: 'pendiente' | 'preparando' | 'listo' | 'servido' | 'pagado'
  createdAt: Date
  paidAt?: Date
  paymentMethod?: 'efectivo' | 'tarjeta' | 'bizum'
}

export interface SaleDay {
  date: string
  revenue: number
  orders: number
  avgTicket: number
}

export interface CategorySale {
  category: string
  revenue: number
  orders: number
  color: string
}

export interface StockAlert {
  productId: string
  productName: string
  current: number
  min: number
  unit: string
}
