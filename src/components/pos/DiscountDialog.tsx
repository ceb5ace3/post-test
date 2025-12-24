import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DiscountDialogProps {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  onApplyDiscount: (discount: number, discountType: 'percentage' | 'amount') => void;
}

export function DiscountDialog({ open, onClose, subtotal, onApplyDiscount }: DiscountDialogProps) {
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = subtotal - discountAmount;

  const handleApply = () => {
    onApplyDiscount(discountAmount, discountType);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Apply Discount</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="space-y-2">
            <Label>Discount Type:</Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value) => setDiscountType(value as 'percentage' | 'amount')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="disc-percentage" />
                <Label htmlFor="disc-percentage">Percentage (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="disc-amount" />
                <Label htmlFor="disc-amount">Amount (Rs.)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discountInput">
              Discount {discountType === 'percentage' ? '(%)' : '(Rs.)'}:
            </Label>
            <Input
              id="discountInput"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="text-lg"
              placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
            />
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount Amount:</span>
              <span className="text-success font-medium">-Rs. {discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">New Total:</span>
              <span className="text-lg font-bold">Rs. {finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleApply}
            className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
          >
            Apply Discount
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
