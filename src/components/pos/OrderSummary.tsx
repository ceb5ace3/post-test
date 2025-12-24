import { Minus, Plus, Trash2 } from 'lucide-react';
import { OrderItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  subtotal: number;
}

export function OrderSummary({ items, onUpdateQuantity, onRemoveItem, subtotal }: OrderSummaryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="pos-table-header px-4 py-2 border-b border-border">
        <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground">
          <span>ORDER</span>
          <span className="text-right">QTY</span>
          <span className="text-right">PRICE</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No items added yet
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-table-hover transition-colors">
                <div className="grid grid-cols-3 items-center">
                  <span className="text-foreground text-sm">{item.menuItem.name}</span>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-medium">
                      Rs. {(item.menuItem.price * item.quantity).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t border-border px-4 py-3 pos-table-header">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">
            Rs. {subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
