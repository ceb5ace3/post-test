import { useState, useMemo } from 'react';
import { CategoryList } from './CategoryList';
import { OrderSummary } from './OrderSummary';
import { BillingSummary } from './BillingSummary';
import { PrintDialog } from './PrintDialog';
import { DiscountDialog } from './DiscountDialog';
import { categories } from '@/data/mockData';
import { MenuItem, OrderItem } from '@/types/pos';
import { toast } from 'sonner';

interface MenuTabProps {
  searchQuery: string;
}

export function MenuTab({ searchQuery }: MenuTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.includes(searchQuery)
      )
    })).filter(category => category.items.length > 0 || category.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const handleItemSelect = (item: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(oi => oi.menuItem.id === item.id);
      if (existingItem) {
        return prev.map(oi => 
          oi.menuItem.id === item.id 
            ? { ...oi, quantity: oi.quantity + 1 }
            : oi
        );
      }
      return [...prev, { id: `order-${Date.now()}`, menuItem: item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to order`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
      return;
    }
    setOrderItems(prev => 
      prev.map(oi => oi.id === itemId ? { ...oi, quantity } : oi)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleApplyDiscount = (discountAmount: number) => {
    setDiscount(discountAmount);
    toast.success(`Discount of Rs. ${discountAmount.toLocaleString()} applied`);
  };

  const handlePrintComplete = (paidAmount: number, discountApplied: number) => {
    const refNumber = `REF-${Date.now().toString().slice(-8)}`;
    toast.success(`Bill ${refNumber} printed successfully! Change: Rs. ${(paidAmount - total).toLocaleString()}`);
    
    // Reset order
    setOrderItems([]);
    setCustomerName('');
    setDiscount(0);
  };

  return (
    <div className="flex h-full">
      {/* Left - Categories */}
      <div className="w-1/3 border-r border-border bg-card flex flex-col">
        <CategoryList
          categories={filteredCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onItemSelect={handleItemSelect}
        />
      </div>
      
      {/* Center - Order */}
      <div className="w-1/3 border-r border-border bg-card">
        <OrderSummary
          items={orderItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          subtotal={subtotal}
        />
      </div>
      
      {/* Right - Summary */}
      <div className="w-1/3">
        <BillingSummary
          subtotal={subtotal}
          discount={discount}
          total={total}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          onPaymentClick={() => setShowPrintDialog(true)}
          onDiscountClick={() => setShowDiscountDialog(true)}
          onRefundClick={() => toast.info('Refund feature coming soon')}
        />
      </div>

      <PrintDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        totalAmount={total}
        onPrintComplete={handlePrintComplete}
      />

      <DiscountDialog
        open={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        subtotal={subtotal}
        onApplyDiscount={handleApplyDiscount}
      />
    </div>
  );
}
