import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Scan, Search, Keyboard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStockItems();
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const fetchStockItems = async () => {
    setLoading(true);
    const { data: stockItems, error } = await supabase
      .from('stock_items')
      .select('*')
      .gt('current_stock', 0)
      .order('name');

    if (error) {
      toast.error('Failed to load items');
      setLoading(false);
      return;
    }

    const categoryMap = new Map<string, MenuItem[]>();
    stockItems?.forEach(item => {
      const categoryName = item.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) categoryMap.set(categoryName, []);
      categoryMap.get(categoryName)!.push({
        id: item.id,
        name: item.name,
        price: Number(item.retail_price),
        categoryId: categoryName,
        barcode: item.barcode || undefined,
        stock: item.current_stock,
      });
    });

    const categoriesWithItems: Category[] = Array.from(categoryMap.entries()).map(([name, items], index) => ({
      id: `cat-${index}`,
      name,
      items,
    }));

    setCategories(categoriesWithItems);
    setLoading(false);
  };

  const filteredCategories = useMemo(() => {
    if (!localSearchQuery) return categories;
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        item.barcode?.includes(localSearchQuery)
      )
    })).filter(category => category.items.length > 0);
  }, [localSearchQuery, categories]);

  const handleItemSelect = (item: MenuItem) => {
    if (item.stock !== undefined && item.stock <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    setOrderItems(prev => {
      const existingItem = prev.find(oi => oi.menuItem.id === item.id);
      if (existingItem) {
        if (item.stock !== undefined && existingItem.quantity >= item.stock) {
          toast.error(`Only ${item.stock} units available`);
          return prev;
        }
        return prev.map(oi => oi.menuItem.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi);
      }
      return [...prev, { id: `order-${Date.now()}`, menuItem: item, quantity: 1 }];
    });
    toast.success(`Added ${item.name}`);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    const { data } = await supabase
      .from('stock_items')
      .select('*')
      .eq('barcode', barcode)
      .gt('current_stock', 0)
      .maybeSingle();

    if (data) {
      handleItemSelect({
        id: data.id,
        name: data.name,
        price: Number(data.retail_price),
        categoryId: data.category || 'Uncategorized',
        barcode: data.barcode || undefined,
        stock: data.current_stock,
      });
    } else {
      toast.error('Item not found');
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
      return;
    }
    setOrderItems(prev => prev.map(oi => oi.id === itemId ? { ...oi, quantity } : oi));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleApplyDiscount = (discountAmount: number) => {
    setDiscount(discountAmount);
    toast.success(`Discount applied`);
  };

  const handlePrintComplete = async (paidAmount: number, discountApplied: number, discountType: 'percentage' | 'amount') => {
    const refNumber = `REF-${Date.now().toString().slice(-8)}`;
    const barcodeNum = `${Date.now()}`;

    setOrderItems([]);
    setCustomerName('');
    setDiscount(0);

    try {
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          reference_number: refNumber,
          barcode: barcodeNum,
          customer_name: customerName || null,
          subtotal,
          discount: discountApplied,
          discount_type: discountType,
          total,
          paid_amount: paidAmount,
          change_amount: paidAmount - total,
          status: 'completed',
        })
        .select()
        .single();

      if (billError) throw billError;

      for (const item of orderItems) {
        await supabase.from('bill_items').insert({
          bill_id: billData.id,
          item_name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          total_price: item.menuItem.price * item.quantity,
        });

        await supabase
          .from('stock_items')
          .update({ current_stock: (item.menuItem.stock || 0) - item.quantity })
          .eq('id', item.menuItem.id);
      }

      toast.success(`Bill ${refNumber} created!`);
      await fetchStockItems();
    } catch (error) {
      toast.error('Failed to save bill');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading menu...</p></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 bg-card border-b border-border flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search or scan barcode..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}>
          <Scan className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border bg-card flex flex-col overflow-hidden">
          <CategoryList categories={filteredCategories} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} onItemSelect={handleItemSelect} />
        </div>
        <div className="w-1/3 border-r border-border bg-card overflow-hidden">
          <OrderSummary items={orderItems} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} subtotal={subtotal} />
        </div>
        <div className="w-1/3 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <BillingSummary subtotal={subtotal} discount={discount} total={total} customerName={customerName} onCustomerNameChange={setCustomerName} onPaymentClick={() => setShowPrintDialog(true)} onDiscountClick={() => setShowDiscountDialog(true)} onRefundClick={() => toast.info('Refund coming soon')} customerNameInputRef={customerNameInputRef} />
          </div>
          <div className="border-t border-border bg-card p-4">
            <Button onClick={() => setShowPrintDialog(true)} disabled={orderItems.length === 0} size="lg" className={cn("w-full h-16 text-xl font-bold", orderItems.length > 0 ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" : "bg-muted")}>
              <CheckCircle className="mr-3 h-6 w-6" />CHECKOUT {orderItems.length > 0 && <span className="ml-3 text-sm opacity-90">Rs. {total.toLocaleString()}</span>}
            </Button>
          </div>
        </div>
      </div>

      <PrintDialog open={showPrintDialog} onClose={() => setShowPrintDialog(false)} totalAmount={total} subtotal={subtotal} discount={discount} customerName={customerName} orderItems={orderItems} onPrintComplete={handlePrintComplete} />
      <DiscountDialog open={showDiscountDialog} onClose={() => setShowDiscountDialog(false)} subtotal={subtotal} onApplyDiscount={handleApplyDiscount} />
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Scan Barcode</DialogTitle></DialogHeader><BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} /></DialogContent>
      </Dialog>
    </div>
  );
}
