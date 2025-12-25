import { useState, useEffect } from 'react';
import { Plus, Edit, AlertTriangle, Scan, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BarcodeScanner } from './BarcodeScanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const PREDEFINED_CATEGORIES = [
  'Food & Beverages',
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Health & Beauty',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Office Supplies',
  'Automotive',
  'Other'
];

export function StockTab({ searchQuery }: StockTabProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { canManageStock } = useAuth();

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    current_stock: 0,
    retail_price: 0,
    low_stock_alert: 10,
    received_date: getTodayDate(),
    expiry_date: '',
    category: '',
  });

  useEffect(() => {
    fetchStockItems();
    loadCustomCategories();
  }, []);

  const loadCustomCategories = () => {
    const saved = localStorage.getItem('custom_categories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  };

  const saveCustomCategory = (category: string) => {
    const updated = [...customCategories, category];
    setCustomCategories(updated);
    localStorage.setItem('custom_categories', JSON.stringify(updated));
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      const trimmedName = newCategoryName.trim();
      const allCategories = [...PREDEFINED_CATEGORIES, ...customCategories];

      if (allCategories.includes(trimmedName)) {
        toast.error('Category already exists');
        return;
      }

      saveCustomCategory(trimmedName);
      setFormData(prev => ({ ...prev, category: trimmedName }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      toast.success('Category added successfully');
    }
  };

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
    item.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    item.barcode?.includes(localSearchQuery)
  );

  const getStockStatus = (current: number, alert: number) => {
    if (current <= alert / 2) return 'critical';
    if (current <= alert) return 'low';
    return 'normal';
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in item name and category');
      return;
    }

    const { error } = await supabase.from('stock_items').insert({
      name: formData.name,
      barcode: formData.barcode || null,
      current_stock: formData.current_stock,
      retail_price: formData.retail_price,
      unit_cost: 0,
      low_stock_alert: formData.low_stock_alert,
      received_date: formData.received_date || null,
      expiry_date: formData.expiry_date || null,
      category: formData.category,
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

    if (!formData.name || !formData.category) {
      toast.error('Please fill in item name and category');
      return;
    }

    const { error } = await supabase
      .from('stock_items')
      .update({
        name: formData.name,
        barcode: formData.barcode || null,
        current_stock: formData.current_stock,
        retail_price: formData.retail_price,
        low_stock_alert: formData.low_stock_alert,
        received_date: formData.received_date || null,
        expiry_date: formData.expiry_date || null,
        category: formData.category,
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

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } else {
      toast.success('Item deleted successfully');
      fetchStockItems();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      current_stock: 0,
      retail_price: 0,
      low_stock_alert: 10,
      received_date: getTodayDate(),
      expiry_date: '',
      category: '',
    });
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  };

  const openEditDialog = (item: StockItem) => {
    setFormData({
      name: item.name,
      barcode: item.barcode || '',
      current_stock: item.current_stock,
      retail_price: item.retail_price,
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
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search stock items..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="pos-table-header">
          <div className="grid grid-cols-9 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
            <span className="col-span-2">Item Name</span>
            <span className="text-center">Current Stock</span>
            <span className="text-center">Retail Price</span>
            <span className="text-center">Category</span>
            <span className="text-center">Low Stock Alert</span>
            <span className="text-center">Received Date</span>
            <span className="text-center">Expiry Date</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

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
                  className="grid grid-cols-9 gap-4 px-4 py-3 items-center hover:bg-table-hover transition-colors"
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
                  <span className="text-center text-sm">{item.category || '-'}</span>
                  <span className="text-center">{item.low_stock_alert}</span>
                  <span className="text-center text-sm">{item.received_date || '-'}</span>
                  <span className="text-center text-sm">{item.expiry_date || '-'}</span>
                  <div className="flex justify-center gap-2">
                    {canManageStock && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewCategoryInput(true);
                    } else {
                      setFormData(prev => ({ ...prev, category: value }));
                    }
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    {customCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-medium">
                      + Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showNewCategoryInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNewCategory();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleAddNewCategory}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
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
                <Label htmlFor="editName">Item Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editCategory">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setShowNewCategoryInput(true);
                    } else {
                      setFormData(prev => ({ ...prev, category: value }));
                    }
                  }}
                >
                  <SelectTrigger id="editCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    {customCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-medium">
                      + Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showNewCategoryInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNewCategory();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleAddNewCategory}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="editBarcode">Barcode</Label>
              <Input
                id="editBarcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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