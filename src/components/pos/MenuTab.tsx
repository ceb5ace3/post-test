import { useState, useMemo, useEffect } from 'react';
import { CategoryList } from './CategoryList';
import { OrderSummary } from './OrderSummary';
import { BillingSummary } from './BillingSummary';
import { PrintDialog } from './PrintDialog';
import { DiscountDialog } from './DiscountDialog';
import { BarcodeScanner } from './BarcodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItem, OrderItem, Category } from '@/types/pos';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';

interface MenuTabProps {
  searchQuery: string;
}

export function MenuTab({ searchQuery }: MenuTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategoriesAndItems();
  }, []);

  const fetchCategoriesAndItems = async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    // Fetch menu items
    const { data: itemsData } = await supabase
      .from('menu_items')
      .select('*');

    if (categoriesData && itemsData) {
      const categoriesWithItems: Category[] = categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name,
        items: itemsData
          .filter(item => item.category_id === cat.id)
          .map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            categoryId: item.category_id,
            barcode: item.barcode || undefined,
            stock: item.stock,
          })),
      }));
      setCategories(categoriesWithItems);
    }
    setLoading(false);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.includes(searchQuery)
      )
    })).filter(category => category.items.length > 0 || category.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, categories]);

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

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    
    // Search for item by barcode
    const { data } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('barcode', barcode)
      .maybeSingle();
    
    if (data) {
      const item: MenuItem = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        categoryId: data.category_id,
        barcode: data.barcode || undefined,
        stock: data.stock,
      };
      handleItemSelect(item);
    } else {
      toast.error('Item not found with this barcode');
    }
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

  const handlePrintComplete = async (paidAmount: number, discountApplied: number) => {
    const refNumber = `REF-${Date.now().toString().slice(-8)}`;
    const barcodeNum = `${Date.now()}`;
    const changeAmount = paidAmount - total;

    try {
      // Create bill in database
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          reference_number: refNumber,
          barcode: barcodeNum,
          customer_name: customerName || null,
          subtotal,
          discount: discountApplied,
          discount_type: 'amount',
          total,
          paid_amount: paidAmount,
          change_amount: changeAmount,
          status: 'completed',
          created_by: user?.id,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItems = orderItems.map(item => ({
        bill_id: billData.id,
        menu_item_id: item.menuItem.id,
        item_name: item.menuItem.name,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        total_price: item.menuItem.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (itemsError) throw itemsError;

      toast.success(`Bill ${refNumber} created! Change: Rs. ${changeAmount.toLocaleString()}`);
      
      // Reset order
      setOrderItems([]);
      setCustomerName('');
      setDiscount(0);
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to save bill');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Scan Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-20 left-4 z-10"
        onClick={() => setShowScanner(true)}
        title="Scan Barcode"
      >
        <Scan className="h-4 w-4" />
      </Button>

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

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Item Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
