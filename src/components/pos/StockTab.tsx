import { useState, useMemo } from 'react';
import { Plus, Edit, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stockItems } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StockTabProps {
  searchQuery: string;
}

export function StockTab({ searchQuery }: StockTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<typeof stockItems[0] | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return stockItems;
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery)
    );
  }, [searchQuery]);

  const getStockStatus = (current: number, alert: number) => {
    if (current <= alert / 2) return 'critical';
    if (current <= alert) return 'low';
    return 'normal';
  };

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Table Header */}
        <div className="bg-table-header">
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
          {filteredItems.map((item) => {
            const status = getStockStatus(item.currentStock, item.lowStockAlert);
            return (
              <div 
                key={item.id} 
                className="grid grid-cols-8 gap-4 px-4 py-3 items-center hover:bg-table-hover transition-colors"
              >
                <span className={cn(
                  "col-span-2 font-medium",
                  status === 'critical' && 'text-destructive',
                  status === 'low' && 'text-warning'
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
                  {item.currentStock} units
                </span>
                <span className="text-center">Rs. {item.retailPrice.toLocaleString()}</span>
                <span className="text-center">Rs. {item.unitCost.toLocaleString()}</span>
                <span className="text-center">{item.lowStockAlert}</span>
                <span className="text-center text-sm">{item.expiryDate}</span>
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
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
                <Input id="itemName" placeholder="Enter item name" />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" placeholder="Scan or enter barcode" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock">Initial Stock</Label>
                <Input id="stock" type="number" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="retailPrice">Retail Price</Label>
                <Input id="retailPrice" type="number" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input id="unitCost" type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lowAlert">Low Stock Alert</Label>
                <Input id="lowAlert" type="number" placeholder="10" />
              </div>
              <div>
                <Label htmlFor="receivedDate">Received Date</Label>
                <Input id="receivedDate" type="date" />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" type="date" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Item added successfully');
              setShowAddDialog(false);
            }}>Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">Item Name</Label>
                  <Input id="editName" defaultValue={editingItem.name} />
                </div>
                <div>
                  <Label htmlFor="editBarcode">Barcode</Label>
                  <Input id="editBarcode" defaultValue={editingItem.barcode} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editStock">Current Stock</Label>
                  <Input id="editStock" type="number" defaultValue={editingItem.currentStock} />
                </div>
                <div>
                  <Label htmlFor="editRetail">Retail Price</Label>
                  <Input id="editRetail" type="number" defaultValue={editingItem.retailPrice} />
                </div>
                <div>
                  <Label htmlFor="editCost">Unit Cost</Label>
                  <Input id="editCost" type="number" defaultValue={editingItem.unitCost} />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Item updated successfully');
              setEditingItem(null);
            }}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
