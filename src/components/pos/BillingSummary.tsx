// BillingSummary.tsx - Updated version with ref support

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefObject } from 'react';

interface BillingSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onPaymentClick: () => void;
  onDiscountClick: () => void;
  onRefundClick: () => void;
  customerNameInputRef?: RefObject<HTMLInputElement>;
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
  customerNameInputRef,
}: BillingSummaryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1">
        {/* Customer Information */}
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="text-sm font-medium">
            Customer Name (Optional) <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F3</kbd>
          </Label>
          <Input
            id="customer-name"
            ref={customerNameInputRef}
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Summary Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-base text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span className="font-semibold">- Rs. {discount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-2xl font-bold pt-4 border-t">
            <span>Total</span>
            <span className="text-primary">Rs. {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onPaymentClick}
            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 active:scale-95 transition-transform"
          >
            PAYMENT
          </Button>

          <Button
            variant="outline"
            onClick={onDiscountClick}
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 active:scale-95 transition-transform"
          >
            DISCOUNT
          </Button>

          <Button
            variant="outline"
            onClick={onRefundClick}
            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-transform"
          >
            REFUND
          </Button>
        </div>
      </div>
    </div>
  );
}