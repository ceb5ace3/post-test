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
  const lastEnterPressTime = useRef<number>(0);

  useEffect(() => {
    fetchStockItems();

    // Auto-focus search bar when menu loads
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Check if search query looks like a barcode (numbers only, 10+ digits)
  const isBarcodeSearch = useMemo(() => {
    return localSearchQuery.length >= 10 && /^\d+$/.test(localSearchQuery);
  }, [localSearchQuery]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // F1 - Show keyboard shortcuts help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }

      // F2 - Focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      // F3 - Focus customer name
      if (e.key === 'F3') {
        e.preventDefault();
        customerNameInputRef.current?.focus();
        customerNameInputRef.current?.select();
      }

      // F4 - Open payment dialog (Checkout)
      if (e.key === 'F4' && orderItems.length > 0) {
        e.preventDefault();
        setShowPrintDialog(true);
      }

      // F5 - Open discount dialog
      if (e.key === 'F5' && orderItems.length > 0) {
        e.preventDefault();
        setShowDiscountDialog(true);
      }

      // F6 - Open barcode scanner
      if (e.key === 'F6') {
        e.preventDefault();
        setShowScanner(true);
      }

      // F9 - Clear current order (with confirmation)
      if (e.key === 'F9' && orderItems.length > 0) {
        e.preventDefault();
        if (confirm('Clear all items from the current order?')) {
          setOrderItems([]);
          setCustomerName('');
          setDiscount(0);
          toast.info('Order cleared');
        }
      }

      // Alternative 
      if (e.key === 'N' && orderItems.length > 0) {
        e.preventDefault();
        setOrderItems([]);
        setCustomerName('');
        setDiscount(0);
        toast.info('Order cleared');
      }

      // Ctrl+F - Alternative search shortcut
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      // ESC - Clear search or deselect category or close dialogs
      if (e.key === 'Escape' && !isInputField) {
        if (showPrintDialog || showDiscountDialog || showScanner) {
          return; // Let dialog handle ESC
        }
        if (localSearchQuery) {
          setLocalSearchQuery('');
        } else if (selectedCategory) {
          setSelectedCategory(null);
        }
      }

      // Number keys (1-9) for quick category selection (only when not typing)
      if (!isInputField && !e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < categories.length) {
          e.preventDefault();
          setSelectedCategory(categories[index].id);
          toast.info(`Selected: ${categories[index].name}`);
        }
      }

      // 0 - Show all categories
      if (!isInputField && e.key === '0') {
        e.preventDefault();
        setSelectedCategory(null);
        toast.info('Showing all categories');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [orderItems, localSearchQuery, selectedCategory, categories, showPrintDialog, showDiscountDialog, showScanner]);

  const fetchStockItems = async () => {
    setLoading(true);

    const { data: stockItems, error } = await supabase
      .from('stock_items')
      .select('*')
      .gt('current_stock', 0)
      .order('name');

    if (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to load items');
      setLoading(false);
      return;
    }

    const categoryMap = new Map<string, MenuItem[]>();

    stockItems?.forEach(item => {
      const categoryName = item.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
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
      name: name,
      items: items,
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
    })).filter(category => category.items.length > 0 || category.name.toLowerCase().includes(localSearchQuery.toLowerCase()));
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

    // Put the barcode in the search input and trigger search
    setLocalSearchQuery(barcode);

    // Focus back to search after a moment
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // First try to import as a bill barcode (if it's long enough)
    if (barcode.length >= 13) {
      await handleImportBillFromBarcode(barcode);
      return;
    }

    // Otherwise, search for product by barcode
    const { data } = await supabase
      .from('stock_items')
      .select('*')
      .eq('barcode', barcode)
      .gt('current_stock', 0)
      .maybeSingle();

    if (data) {
      const item: MenuItem = {
        id: data.id,
        name: data.name,
        price: Number(data.retail_price),
        categoryId: data.category || 'Uncategorized',
        barcode: data.barcode || undefined,
        stock: data.current_stock,
      };
      handleItemSelect(item);
      // Clear search after adding item
      setLocalSearchQuery('');
    } else {
      toast.error('Item not found or out of stock');
    }
  };

  const handleImportBillFromBarcode = async (barcode: string) => {
    try {
      // Search for bill with this barcode
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('barcode', barcode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (billError || !billData) {
        toast.error('No bill found with this barcode');
        return;
      }

      // Fetch bill items
      const { data: billItems, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billData.id);

      if (itemsError || !billItems || billItems.length === 0) {
        toast.error('No items found in this bill');
        return;
      }

      // Clear current order first
      setOrderItems([]);
      setCustomerName('');
      setDiscount(0);

      // Convert bill items to order items
      const newOrderItems: OrderItem[] = [];
      let itemsAdded = 0;
      let itemsSkipped = 0;

      for (const billItem of billItems) {
        // Try to find the item in stock
        const { data: stockItem } = await supabase
          .from('stock_items')
          .select('*')
          .eq('name', billItem.item_name)
          .maybeSingle();

        if (stockItem && stockItem.current_stock >= billItem.quantity) {
          const menuItem: MenuItem = {
            id: stockItem.id,
            name: stockItem.name,
            price: Number(stockItem.retail_price),
            categoryId: stockItem.category || 'Uncategorized',
            barcode: stockItem.barcode || undefined,
            stock: stockItem.current_stock,
          };

          newOrderItems.push({
            id: `order-${Date.now()}-${itemsAdded}`,
            menuItem,
            quantity: billItem.quantity,
          });
          itemsAdded++;
        } else {
          itemsSkipped++;
          if (!stockItem) {
            toast.warning(`Item "${billItem.item_name}" not found in stock`);
          } else {
            toast.warning(`Insufficient stock for "${billItem.item_name}" (Available: ${stockItem.current_stock}, Needed: ${billItem.quantity})`);
          }
        }
      }

      setOrderItems(newOrderItems);
      setCustomerName(billData.customer_name || '');

      if (itemsAdded > 0) {
        toast.success(`Bill imported! ${itemsAdded} item(s) added${itemsSkipped > 0 ? `, ${itemsSkipped} item(s) skipped due to stock` : ''}`);
      } else {
        toast.error('No items could be added from this bill');
      }

      // Clear the search
      setLocalSearchQuery('');

    } catch (error: any) {
      console.error('Error importing bill:', error);
      toast.error('Failed to import bill');
    }
  };

  // Remove auto-search - now only triggered by Enter key

  // Listen for global barcode scanner input
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleGlobalKeyPress = async (e: KeyboardEvent) => {
      // Don't capture if user is typing in a text input (except search bar)
      const target = e.target as HTMLElement;
      const isSearchInput = target === searchInputRef.current;
      const isOtherInput = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !isSearchInput;

      if (isOtherInput) return;

      // Clear timeout on any keypress
      clearTimeout(barcodeTimeout);

      // If Enter is pressed with buffer, process it
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault();
        const barcode = barcodeBuffer;
        barcodeBuffer = '';

        // Process the barcode
        if (barcode.length >= 13 && /^\d+$/.test(barcode)) {
          // Bill barcode
          setLocalSearchQuery(barcode);
          await handleImportBillFromBarcode(barcode);
        } else if (barcode.length >= 8) {
          // Product barcode
          setLocalSearchQuery(barcode);
          const { data } = await supabase
            .from('stock_items')
            .select('*')
            .eq('barcode', barcode)
            .gt('current_stock', 0)
            .maybeSingle();

          if (data) {
            const item: MenuItem = {
              id: data.id,
              name: data.name,
              price: Number(data.retail_price),
              categoryId: data.category || 'Uncategorized',
              barcode: data.barcode || undefined,
              stock: data.current_stock,
            };
            handleItemSelect(item);
            setLocalSearchQuery('');
          } else {
            toast.error('Item not found or out of stock');
          }
        }

        return;
      }

      // Build up the barcode buffer (only for alphanumeric characters)
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        barcodeBuffer += e.key;

        // Auto-submit after 100ms of no input (typical for barcode scanners)
        barcodeTimeout = setTimeout(async () => {
          if (barcodeBuffer.length >= 8) {
            const barcode = barcodeBuffer;
            barcodeBuffer = '';

            // Process the barcode
            if (barcode.length >= 13 && /^\d+$/.test(barcode)) {
              // Bill barcode
              setLocalSearchQuery(barcode);
              await handleImportBillFromBarcode(barcode);
            } else {
              // Product barcode
              setLocalSearchQuery(barcode);
              const { data } = await supabase
                .from('stock_items')
                .select('*')
                .eq('barcode', barcode)
                .gt('current_stock', 0)
                .maybeSingle();

              if (data) {
                const item: MenuItem = {
                  id: data.id,
                  name: data.name,
                  price: Number(data.retail_price),
                  categoryId: data.category || 'Uncategorized',
                  barcode: data.barcode || undefined,
                  stock: data.current_stock,
                };
                handleItemSelect(item);
                setLocalSearchQuery('');
              } else {
                toast.error('Item not found or out of stock');
              }
            }
          } else {
            barcodeBuffer = '';
          }
        }, 100);
      }
    };

    window.addEventListener('keypress', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keypress', handleGlobalKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, []);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
      return;
    }

    const orderItem = orderItems.find(oi => oi.id === itemId);
    if (orderItem && orderItem.menuItem.stock !== undefined && quantity > orderItem.menuItem.stock) {
      toast.error(`Only ${orderItem.menuItem.stock} units available`);
      return;
    }

    setOrderItems(prev =>
      prev.map(oi => oi.id === itemId ? { ...oi, quantity } : oi)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(oi => oi.id !== itemId));
    toast.success('Item removed from order');
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleApplyDiscount = (discountAmount: number) => {
    setDiscount(discountAmount);
    toast.success(`Discount of Rs. ${discountAmount.toLocaleString()} applied`);
  };

  const handlePrintComplete = async (paidAmount: number, discountApplied: number, discountType: 'percentage' | 'amount') => {
    const refNumber = `REF-${Date.now().toString().slice(-8)}`;
    const barcodeNum = `${Date.now()}`;
    const changeAmount = paidAmount - total;

    // Clear the order after successful print
    setOrderItems([]);
    setCustomerName('');
    setDiscount(0);

    try {
      // First, verify stock availability for all items
      for (const item of orderItems) {
        const { data: stockData, error: stockCheckError } = await supabase
          .from('stock_items')
          .select('current_stock')
          .eq('id', item.menuItem.id)
          .single();

        if (stockCheckError) {
          throw new Error(`Failed to check stock for ${item.menuItem.name}`);
        }

        if (stockData.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.menuItem.name}. Available: ${stockData.current_stock}`);
        }
      }

      // Create the bill
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
          change_amount: changeAmount,
          status: 'completed',
        })
        .select()
        .single();

      if (billError) {
        console.error('Bill creation error:', billError);
        throw new Error(`Failed to create bill: ${billError.message}`);
      }

      // Insert bill items and update stock
      for (const item of orderItems) {
        const billItemData: any = {
          bill_id: billData.id,
          item_name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          total_price: item.menuItem.price * item.quantity,
        };

        const { error: itemError } = await supabase
          .from('bill_items')
          .insert(billItemData);

        if (itemError) {
          console.error('Bill item error:', itemError);
          await supabase.from('bills').delete().eq('id', billData.id);
          throw new Error(`Failed to add ${item.menuItem.name} to bill: ${itemError.message}`);
        }

        const { data: currentStockData, error: fetchError } = await supabase
          .from('stock_items')
          .select('current_stock')
          .eq('id', item.menuItem.id)
          .single();

        if (fetchError) {
          console.error('Stock fetch error:', fetchError);
          toast.warning(`Could not verify stock for ${item.menuItem.name}`);
          continue;
        }

        const newStock = currentStockData.current_stock - item.quantity;

        const { error: stockError } = await supabase
          .from('stock_items')
          .update({ current_stock: newStock })
          .eq('id', item.menuItem.id);

        if (stockError) {
          console.error('Stock update error:', stockError);
          toast.warning(`Stock not updated for ${item.menuItem.name}`);
        }
      }

      toast.success(`✅ Bill ${refNumber} created! Change: Rs. ${changeAmount.toLocaleString()}`);

      // Refresh stock items
      await fetchStockItems();

      // Return to allow print dialog to continue
      return Promise.resolve();

    } catch (error: any) {
      console.error('Error creating bill:', error);
      toast.error(error.message || 'Failed to save bill');
      throw error; // Re-throw to prevent printing on error
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
    <div className="flex h-full flex-col">
      {/* Top Bar with Search and Controls */}
      <div className="p-4 bg-card border-b border-border flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={isBarcodeSearch ? "📦 Scanning bill barcode..." : "Search or scan barcode... (F2)"}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const query = localSearchQuery.trim();

                // Empty search + Enter twice = Checkout
                if (!query) {
                  const now = Date.now();
                  const timeSinceLastEnter = now - lastEnterPressTime.current;

                  if (timeSinceLastEnter < 500 && orderItems.length > 0) {
                    // Double Enter within 500ms - open checkout
                    e.preventDefault();
                    setShowPrintDialog(true);
                    toast.info('Opening checkout...');
                    lastEnterPressTime.current = 0;
                    return;
                  } else {
                    // First Enter or too slow
                    lastEnterPressTime.current = now;
                    if (orderItems.length > 0) {
                      toast.info('Press Enter again to checkout');
                    }
                    return;
                  }
                }

                e.preventDefault();
                lastEnterPressTime.current = 0; // Reset double-enter tracking

                // Check if it's a bill barcode (13+ digits)
                if (query.length >= 13 && /^\d+$/.test(query)) {
                  await handleImportBillFromBarcode(query);
                } else {
                  // Try to find and add item by barcode or name
                  const { data } = await supabase
                    .from('stock_items')
                    .select('*')
                    .or(`barcode.eq.${query},name.ilike.%${query}%`)
                    .gt('current_stock', 0)
                    .limit(1)
                    .maybeSingle();

                  if (data) {
                    const item: MenuItem = {
                      id: data.id,
                      name: data.name,
                      price: Number(data.retail_price),
                      categoryId: data.category || 'Uncategorized',
                      barcode: data.barcode || undefined,
                      stock: data.current_stock,
                    };
                    handleItemSelect(item);
                    setLocalSearchQuery('');
                    toast.success(`Added ${data.name} to order`);
                  } else {
                    toast.error('Item not found or out of stock');
                  }
                }
              }
            }}
            autoFocus
            className={cn(
              "pl-10",
              isBarcodeSearch && "border-blue-500 bg-blue-50 dark:bg-blue-950 animate-pulse"
            )}
          />
          {isBarcodeSearch && localSearchQuery.length >= 10 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 dark:text-blue-400 font-medium">
              Bill Barcode Detected
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowScanner(true)}
          title="Scan Barcode (F6)"
        >
          <Scan className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowKeyboardHelp(true)}
          title="Keyboard Shortcuts (F1)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border bg-card flex flex-col overflow-hidden">
          <CategoryList
            categories={filteredCategories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onItemSelect={handleItemSelect}
          />
        </div>

        <div className="w-1/3 border-r border-border bg-card overflow-hidden">
          <OrderSummary
            items={orderItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            subtotal={subtotal}
          />
        </div>

        <div className="w-1/3 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <BillingSummary
              subtotal={subtotal}
              discount={discount}
              total={total}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              onPaymentClick={() => setShowPrintDialog(true)}
              onDiscountClick={() => setShowDiscountDialog(true)}
              onRefundClick={() => toast.info('Refund feature coming soon')}
              customerNameInputRef={customerNameInputRef}
            />
          </div>

          {/* Checkout Button - Fixed at Bottom */}
          <div className="border-t border-border bg-card p-4">
            <Button
              onClick={() => setShowPrintDialog(true)}
              disabled={orderItems.length === 0}
              size="lg"
              className={cn(
                "w-full h-16 text-xl font-bold transition-all duration-150",
                orderItems.length > 0
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <CheckCircle className="mr-3 h-6 w-6" />
              CHECKOUT (F4)
              {orderItems.length > 0 && (
                <span className="ml-3 text-sm opacity-90 font-normal">
                  Rs. {total.toLocaleString()}
                </span>
              )}
            </Button>

            {/* Keyboard Hints */}
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded">F1</kbd> for shortcuts
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">General</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Help</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F1</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search Products</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F2</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Name</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F3</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scan Barcode</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F6</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clear Order</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F9</kbd>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Actions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Checkout / Payment</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F4</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apply Discount</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F5</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alternative Search</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clear/Back</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
                </div>
              </div>
            </div>

            <div className="space-y-3 col-span-2">
              <h3 className="font-semibold text-sm">Search & Barcode Features</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <strong>• Manual Search:</strong> Type product name or barcode and press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to add to order
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                  <strong>• Barcode Scanner:</strong> Scan any barcode - items auto-add to order instantly
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded">
                  <strong>• Bill Import:</strong> Type/scan a 13+ digit bill barcode and press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to load previous bill
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded">
                  <strong>• Quick Checkout:</strong> Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> twice quickly in empty search bar to open checkout
                </div>
              </div>
            </div>

            <div className="space-y-3 col-span-2">
              <h3 className="font-semibold text-sm">Category Selection</h3>
              <div className="text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">1-9</kbd> to quickly select categories 1-9
                <br />
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">0</kbd> to show all categories
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PrintDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        totalAmount={total}
        subtotal={subtotal}
        discount={discount}
        customerName={customerName}
        orderItems={orderItems}
        onPrintComplete={handlePrintComplete}
      />

      <DiscountDialog
        open={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        subtotal={subtotal}
        onApplyDiscount={handleApplyDiscount}
      />

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