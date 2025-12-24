import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BillingSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onPaymentClick: () => void;
  onDiscountClick: () => void;
  onRefundClick: () => void;
}

export function BillingSummary({
  subtotal,
  discount,
  total,
  customerName,
  onCustomerNameChange,
  onPaymentClick,
  onDiscountClick,
  onRefundClick,
}: BillingSummaryProps) {
  return (
    <div className="bg-card border-l border-border flex flex-col h-full">
      <div className="pos-table-header px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">SUMMARY</span>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-accent">-Rs. {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">Rs. {total.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={onPaymentClick}
            className="pos-action-btn pos-action-btn-payment"
          >
            PAYMENT
          </button>
          <button
            onClick={onDiscountClick}
            className="pos-action-btn pos-action-btn-discount"
          >
            DISCOUNT
          </button>
          <button
            onClick={onRefundClick}
            className="pos-action-btn pos-action-btn-refund"
          >
            REFUND
          </button>
        </div>
        
        <div className="pt-4">
          <Button 
            variant="secondary" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            CUSTOMER INFO
          </Button>
          <Input
            type="text"
            placeholder="Customer Name (Optional)"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
      
      <div className="bg-primary text-primary-foreground px-4 py-3 flex justify-between items-center">
        <span className="font-medium">TOTAL</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Rs. {total.toLocaleString()}</span>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-accent-foreground">↓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
