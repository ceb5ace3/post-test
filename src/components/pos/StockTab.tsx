import { useState, useEffect } from 'react';
import { Plus, Edit, AlertTriangle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BarcodeScanner } from './BarcodeScanner';

interface StockItem {
  id: string;
  name: string;
  barcode: string | null;
  current_stock: number;
  retail_price: number;
  unit_cost: number;
  low_stock_alert: number;
  received_date: string | null;
  expiry_date: string | null;
  category: string | null;
}

interface StockTabProps {
  searchQuery: string;
}

export function StockTab({ searchQuery }: StockTabProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { canManageStock } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    current_stock: 0,
    retail_price: 0,
    unit_cost: 0,
    low_stock_alert: 10,
    received_date: '',
    expiry_date: '',
    category: '',
  });

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to load stock items');
    } else {
      setStockItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.includes(searchQuery)
  );

  const getStockStatus = (current: number, alert: number) => {
    if (current <= alert / 2) return 'critical';
    if (current <= alert) return 'low';
    return 'normal';
  };

  const handleAddItem = async () => {
    const { error } = await supabase.from('stock_items').insert({
      name: formData.name,
      barcode: formData.barcode || null,
      current_stock: formData.current_stock,
      retail_price: formData.retail_price,
      unit_cost: formData.unit_cost,
      low_stock_alert: formData.low_stock_alert,
      received_date: formData.received_date || null,
      expiry_date: formData.expiry_date || null,
      category: formData.category || null,
    });

    if (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } else {
      toast.success('Item added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchStockItems();
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from('stock_items')
      .update({
        name: formData.name,
        barcode: formData.barcode || null,
        current_stock: formData.current_stock,
        retail_price: formData.retail_price,
        unit_cost: formData.unit_cost,
        low_stock_alert: formData.low_stock_alert,
        received_date: formData.received_date || null,
        expiry_date: formData.expiry_date || null,
        category: formData.category || null,
      })
      .eq('id', editingItem.id);

    if (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } else {
      toast.success('Item updated successfully');
      setEditingItem(null);
      resetForm();
      fetchStockItems();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      current_stock: 0,
      retail_price: 0,
      unit_cost: 0,
      low_stock_alert: 10,
      received_date: '',
      expiry_date: '',
      category: '',
    });
  };

  const openEditDialog = (item: StockItem) => {
    setFormData({
      name: item.name,
      barcode: item.barcode || '',
      current_stock: item.current_stock,
      retail_price: item.retail_price,
      unit_cost: item.unit_cost,
      low_stock_alert: item.low_stock_alert,
      received_date: item.received_date || '',
      expiry_date: item.expiry_date || '',
      category: item.category || '',
    });
    setEditingItem(item);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false);
    toast.success('Barcode captured');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading stock...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Table Header */}
        <div className="pos-table-header">
          <div className="grid grid-cols-8 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
            <span className="col-span-2">Item Name</span>
            <span className="text-center">Current Stock</span>
            <span className="text-center">Retail Price</span>
            <span className="text-center">Unit Cost</span>
            <span className="text-center">Low Stock Alert</span>
            <span className="text-center">Expiry Date</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No stock items found
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getStockStatus(item.current_stock, item.low_stock_alert);
              return (
                <div 
                  key={item.id} 
                  className="grid grid-cols-8 gap-4 px-4 py-3 items-center hover:bg-table-hover transition-colors"
                >
                  <span className={cn(
                    "col-span-2 font-medium",
                    status === 'critical' && 'text-destructive',
                    status === 'low' && 'stock-low'
                  )}>
                    {item.name}
                    {status !== 'normal' && (
                      <AlertTriangle className="inline-block ml-2 h-4 w-4" />
                    )}
                  </span>
                  <span className={cn(
                    "text-center",
                    status === 'critical' && 'stock-critical',
                    status === 'low' && 'stock-low'
                  )}>
                    {item.current_stock} units
                  </span>
                  <span className="text-center">Rs. {Number(item.retail_price).toLocaleString()}</span>
                  <span className="text-center">Rs. {Number(item.unit_cost).toLocaleString()}</span>
                  <span className="text-center">{item.low_stock_alert}</span>
                  <span className="text-center text-sm">{item.expiry_date || '-'}</span>
                  <div className="flex justify-center">
                    {canManageStock && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canManageStock && (
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Item
          </Button>
          <Button variant="outline">
            Adjust Stock
          </Button>
          <Button variant="ghost" className="text-muted-foreground">
            Run Inventory Report
          </Button>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Stock Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input 
                  id="itemName" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name" 
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex gap-2">
                  <Input 
                    id="barcode" 
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Scan or enter" 
                  />
                  <Button size="icon" variant="outline" onClick={() => setShowScanner(true)}>
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock">Initial Stock</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="retailPrice">Retail Price</Label>
                <Input 
                  id="retailPrice" 
                  type="number" 
                  value={formData.retail_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, retail_price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input 
                  id="unitCost" 
                  type="number" 
                  value={formData.unit_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lowAlert">Low Stock Alert</Label>
                <Input 
                  id="lowAlert" 
                  type="number" 
                  value={formData.low_stock_alert}
                  onChange={(e) => setFormData(prev => ({ ...prev, low_stock_alert: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="receivedDate">Received Date</Label>
                <Input 
                  id="receivedDate" 
                  type="date" 
                  value={formData.received_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input 
                  id="expiryDate" 
                  type="date" 
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => { setEditingItem(null); resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Item Name</Label>
                <Input 
                  id="editName" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editBarcode">Barcode</Label>
                <Input 
                  id="editBarcode" 
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editStock">Current Stock</Label>
                <Input 
                  id="editStock" 
                  type="number" 
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="editRetail">Retail Price</Label>
                <Input 
                  id="editRetail" 
                  type="number" 
                  value={formData.retail_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, retail_price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="editCost">Unit Cost</Label>
                <Input 
                  id="editCost" 
                  type="number" 
                  value={formData.unit_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setEditingItem(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateItem}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
