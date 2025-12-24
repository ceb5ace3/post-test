import { Category, StockItem, Admin, ShopSettings, Bill } from '@/types/pos';

export const categories: Category[] = [
  {
    id: '1',
    name: 'COFFEE',
    items: [
      { id: '101', name: 'Espresso', price: 350, categoryId: '1', barcode: '1001001', stock: 100 },
      { id: '102', name: 'Americano', price: 400, categoryId: '1', barcode: '1001002', stock: 100 },
      { id: '103', name: 'Cappuccino', price: 450, categoryId: '1', barcode: '1001003', stock: 100 },
      { id: '104', name: 'Latte', price: 480, categoryId: '1', barcode: '1001004', stock: 100 },
      { id: '105', name: 'Mocha', price: 520, categoryId: '1', barcode: '1001005', stock: 100 },
    ],
  },
  {
    id: '2',
    name: 'PASTRIES',
    items: [
      { id: '201', name: 'Croissants', price: 280, categoryId: '2', barcode: '2001001', stock: 50 },
      { id: '202', name: 'Corn Donut', price: 150, categoryId: '2', barcode: '2001002', stock: 60 },
      { id: '203', name: 'Danish Pastry', price: 320, categoryId: '2', barcode: '2001003', stock: 40 },
    ],
  },
  {
    id: '3',
    name: 'SANDWICHES',
    items: [
      { id: '301', name: 'Ham & Cheese Sandwich', price: 580, categoryId: '3', barcode: '3001001', stock: 30 },
      { id: '302', name: 'Club Sandwich', price: 650, categoryId: '3', barcode: '3001002', stock: 25 },
      { id: '303', name: 'Vegetable Sandwich', price: 480, categoryId: '3', barcode: '3001003', stock: 35 },
    ],
  },
  {
    id: '4',
    name: 'BEVERAGES',
    items: [
      { id: '401', name: 'Iced Coffee', price: 380, categoryId: '4', barcode: '4001001', stock: 80 },
      { id: '402', name: 'Cold Coffee', price: 350, categoryId: '4', barcode: '4001002', stock: 80 },
      { id: '403', name: 'Fresh Juice', price: 420, categoryId: '4', barcode: '4001003', stock: 60 },
      { id: '404', name: 'Milkshake', price: 480, categoryId: '4', barcode: '4001004', stock: 50 },
    ],
  },
  {
    id: '5',
    name: 'SNACKS',
    items: [
      { id: '501', name: 'French Fries', price: 320, categoryId: '5', barcode: '5001001', stock: 70 },
      { id: '502', name: 'Chicken Wings', price: 580, categoryId: '5', barcode: '5001002', stock: 40 },
      { id: '503', name: 'Nachos', price: 450, categoryId: '5', barcode: '5001003', stock: 45 },
    ],
  },
];

export const stockItems: StockItem[] = [
  { id: '1', name: 'Coffee Beans (Dark Roast)', barcode: '8001001', currentStock: 120, retailPrice: 2500, unitCost: 1800, lowStockAlert: 20, receivedDate: '2024-12-01', expiryDate: '2025-06-01', category: 'Raw Materials' },
  { id: '2', name: 'Croissants', barcode: '8001002', currentStock: 50, retailPrice: 280, unitCost: 150, lowStockAlert: 10, receivedDate: '2024-12-20', expiryDate: '2024-12-27', category: 'Bakery' },
  { id: '3', name: 'Ham & Cheese Sandwiches', barcode: '8001003', currentStock: 20, retailPrice: 580, unitCost: 350, lowStockAlert: 15, receivedDate: '2024-12-22', expiryDate: '2024-12-25', category: 'Prepared Food' },
  { id: '4', name: 'Milk (Full Cream)', barcode: '8001004', currentStock: 35, retailPrice: 320, unitCost: 250, lowStockAlert: 20, receivedDate: '2024-12-18', expiryDate: '2025-01-05', category: 'Dairy' },
  { id: '5', name: 'Sugar (White)', barcode: '8001005', currentStock: 200, retailPrice: 180, unitCost: 120, lowStockAlert: 50, receivedDate: '2024-12-01', expiryDate: '2025-12-01', category: 'Essentials' },
  { id: '6', name: 'Chocolate Syrup', barcode: '8001006', currentStock: 15, retailPrice: 850, unitCost: 600, lowStockAlert: 10, receivedDate: '2024-12-10', expiryDate: '2025-06-10', category: 'Syrups' },
  { id: '7', name: 'Vanilla Extract', barcode: '8001007', currentStock: 8, retailPrice: 1200, unitCost: 900, lowStockAlert: 5, receivedDate: '2024-12-05', expiryDate: '2025-12-05', category: 'Flavoring' },
  { id: '8', name: 'Paper Cups (Large)', barcode: '8001008', currentStock: 500, retailPrice: 25, unitCost: 15, lowStockAlert: 100, receivedDate: '2024-12-15', expiryDate: '2026-12-15', category: 'Packaging' },
];

export const admins: Admin[] = [
  { id: '1', name: 'Imesh S Abeysinghe', role: 'Owner', phone: '+94 77 00 25 374' },
  { id: '2', name: 'Kamal Perera', role: 'Manager', phone: '+94 77 123 4567' },
  { id: '3', name: 'Nimal Silva', role: 'Cashier', phone: '+94 77 987 6543' },
];

export const shopSettings: ShopSettings = {
  name: 'Newsiri Trade Center',
  address: '123 Main Street, Colombo 07, Sri Lanka',
  phone: '+94 11 234 5678',
  createdBy: 'Imesh S Abeysinghe',
  createdByPhone: '+94 77 00 25 374',
};

export const recentBills: Bill[] = [
  {
    id: 'B001',
    referenceNumber: 'REF-2024-001',
    barcode: '9001001001',
    items: [],
    subtotal: 1580,
    discount: 0,
    discountType: 'amount',
    total: 1580,
    paidAmount: 2000,
    change: 420,
    customerName: 'Walk-in Customer',
    createdAt: '2024-12-24T10:30:00',
    status: 'completed',
  },
];

export const dailySalesData = [
  { label: 'Mon', value: 45000 },
  { label: 'Tue', value: 52000 },
  { label: 'Wed', value: 48000 },
  { label: 'Thu', value: 61000 },
  { label: 'Fri', value: 75000 },
  { label: 'Sat', value: 89000 },
  { label: 'Sun', value: 67000 },
];

export const weeklySalesData = [
  { label: 'Week 1', value: 320000 },
  { label: 'Week 2', value: 380000 },
  { label: 'Week 3', value: 290000 },
  { label: 'Week 4', value: 420000 },
];

export const monthlySalesData = [
  { label: 'Jan', value: 1200000 },
  { label: 'Feb', value: 1350000 },
  { label: 'Mar', value: 1180000 },
  { label: 'Apr', value: 1420000 },
  { label: 'May', value: 1560000 },
  { label: 'Jun', value: 1380000 },
  { label: 'Jul', value: 1620000 },
  { label: 'Aug', value: 1480000 },
  { label: 'Sep', value: 1340000 },
  { label: 'Oct', value: 1520000 },
  { label: 'Nov', value: 1680000 },
  { label: 'Dec', value: 1850000 },
];
