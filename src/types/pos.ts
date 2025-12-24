export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  barcode?: string;
  stock: number;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

export interface StockItem {
  id: string;
  name: string;
  barcode: string;
  currentStock: number;
  retailPrice: number;
  unitCost: number;
  lowStockAlert: number;
  receivedDate: string;
  expiryDate: string;
  category: string;
}

export interface Bill {
  id: string;
  referenceNumber: string;
  barcode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  total: number;
  paidAmount: number;
  change: number;
  customerName?: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'reprinted';
}

export interface Admin {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Cashier';
  phone?: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  createdBy: string;
  createdByPhone: string;
}

export interface SalesData {
  label: string;
  value: number;
}
