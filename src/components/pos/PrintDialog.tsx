import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  onPrintComplete: (paidAmount: number, discount: number, discountType: 'percentage' | 'amount') => void;
}

export function PrintDialog({ open, onClose, totalAmount, onPrintComplete }: PrintDialogProps) {
  const [paidAmount, setPaidAmount] = useState<string>(totalAmount.toString());
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (totalAmount * value) / 100;
    }
    return value;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = totalAmount - discountAmount;
  const change = (parseFloat(paidAmount) || 0) - finalTotal;

  const handlePrintComplete = () => {
    onPrintComplete(parseFloat(paidAmount) || 0, discountAmount, discountType);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Before Print</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-success">
              Rs. {totalAmount.toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paidAmount">Paid Amount:</Label>
            <Input
              id="paidAmount"
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Discount Type:</Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value) => setDiscountType(value as 'percentage' | 'amount')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount" />
                <Label htmlFor="amount">Amount (Rs.)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Percentage (%)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discount">Discount {discountType === 'percentage' ? '(%)' : '(Rs.)'}:</Label>
            <Input
              id="discount"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="text-lg"
            />
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-success">
              <span>Discount Applied:</span>
              <span className="font-medium">-Rs. {discountAmount.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-semibold">Final Total:</span>
            <span className="text-xl font-bold">Rs. {finalTotal.toLocaleString()}</span>
          </div>
          
          {change > 0 && (
            <div className="flex justify-between items-center bg-success/10 p-3 rounded-lg">
              <span className="font-semibold">Change to Return:</span>
              <span className="text-xl font-bold text-success">Rs. {change.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handlePrintComplete}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
          >
            Print & Complete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
