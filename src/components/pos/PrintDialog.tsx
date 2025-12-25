import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  menuItem: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  totalAmount: number;
  subtotal: number;
  discount: number;
  customerName: string;
  orderItems: OrderItem[];
  onPrintComplete: (paidAmount: number, discount: number, discountType: 'percentage' | 'amount') => Promise<void>;
}

export function PrintDialog({
  open,
  onClose,
  totalAmount,
  subtotal,
  discount: initialDiscount,
  customerName,
  orderItems,
  onPrintComplete
}: PrintDialogProps) {
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
  const [isPrinting, setIsPrinting] = useState(false);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [billBarcode, setBillBarcode] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [barcodeSVG, setBarcodeSVG] = useState<string>('');
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [billData, setBillData] = useState<any>(null);
  const [readyToPrint, setReadyToPrint] = useState(false);

  useEffect(() => {
    fetchShopSettings();
  }, []);

  useEffect(() => {
    if (open && orderItems.length > 0) {
      console.log('🎯 Dialog opened with', orderItems.length, 'items');

      setPaidAmount(totalAmount.toString());
      setDiscountValue('0');
      setBillData(null);
      setReadyToPrint(false);

      setTimeout(() => {
        paidAmountInputRef.current?.focus();
        paidAmountInputRef.current?.select();
      }, 100);

      const timestamp = Date.now().toString();
      const ref = `REF-${timestamp.slice(-8)}`;
      setBillBarcode(timestamp);
      setRefNumber(ref);

      setTimeout(() => generateBarcode(timestamp), 200);
    }
  }, [open, totalAmount, orderItems, subtotal]);

  useEffect(() => {
    const executePrint = async () => {
      if (readyToPrint && billData) {
        console.log('✅ Bill data ready, executing print...');
        console.log('📊 Bill:', billData);

        try {
          await openCashDrawer();
          await new Promise(resolve => setTimeout(resolve, 300));

          window.print();

          setIsPrinting(false);
          setReadyToPrint(false);

          // Auto-close after 3 seconds
          toast.success('✅ Bill printed successfully! Closing in 3 seconds...');
          setTimeout(() => {
            onClose();
          }, 3000);
        } catch (error) {
          console.error('Print execution error:', error);
          setIsPrinting(false);
          setReadyToPrint(false);
        }
      }
    };

    executePrint();
  }, [readyToPrint, billData]);

  const fetchShopSettings = async () => {
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setShopSettings(data);
    }
  };

  const generateBarcode = (code: string) => {
    const canvas = barcodeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 300;
    const height = 100;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';

    const barHeight = 65;
    const barY = 8;
    const barWidth = 2;
    const spacing = 1;

    const totalBarsNeeded = code.length * 6;
    const totalWidth = totalBarsNeeded * (barWidth + spacing);
    const startX = (width - totalWidth) / 2;

    let x = startX;

    ctx.fillRect(x, barY, barWidth * 1.5, barHeight);
    x += (barWidth * 1.5) + spacing;
    ctx.fillRect(x, barY, barWidth, barHeight);
    x += barWidth + spacing * 2;

    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]) || 0;
      const patterns = [
        [1, 1, 0, 1, 1, 0], [1, 0, 1, 1, 0, 1], [1, 0, 0, 1, 1, 1],
        [0, 1, 1, 0, 1, 1], [1, 1, 0, 0, 1, 1], [1, 1, 1, 0, 0, 1],
        [0, 1, 0, 1, 1, 1], [1, 0, 1, 0, 1, 1], [1, 1, 0, 1, 0, 1],
        [0, 1, 1, 1, 0, 1],
      ];

      const pattern = patterns[digit];

      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === 1) {
          ctx.fillRect(x, barY, barWidth, barHeight);
        }
        x += barWidth + spacing;
      }
    }

    x += spacing;
    ctx.fillRect(x, barY, barWidth, barHeight);
    x += barWidth + spacing;
    ctx.fillRect(x, barY, barWidth * 1.5, barHeight);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, width / 2, barY + barHeight + 22);

    const dataURL = canvas.toDataURL('image/png');
    setBarcodeSVG(dataURL);
  };

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = subtotal - discountAmount;
  const change = (parseFloat(paidAmount) || 0) - finalTotal;

  const openCashDrawer = async () => {
    try {
      const drawerCommand = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0x19]);

      if ('usb' in navigator) {
        try {
          const device = await (navigator as any).usb.requestDevice({
            filters: [
              { vendorId: 0x04b8 },
              { vendorId: 0x0519 },
              { vendorId: 0x0fe6 },
              { vendorId: 0x067b },
            ]
          });

          await device.open();
          if (device.configuration === null) {
            await device.selectConfiguration(1);
          }
          await device.claimInterface(0);
          await device.transferOut(1, drawerCommand);
          await device.close();
          toast.success('💰 Cash drawer opened!');
          return true;
        } catch (err) {
          console.error('USB cash drawer error:', err);
        }
      }

      const blob = new Blob([drawerCommand], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = url;

      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);

      toast.info('Cash drawer command sent');
      return true;
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      return false;
    }
  };

  const printToThermalPrinter = async () => {
    try {
      setIsPrinting(true);

      console.log('📦 Starting print with', orderItems.length, 'items');
      console.log('🔍 Looking for barcode:', billBarcode);

      const paid = parseFloat(paidAmount) || 0;

      // Save bill to database FIRST and get the result
      console.log('💾 Calling onPrintComplete...');
      await onPrintComplete(paid, discountAmount, discountType);
      console.log('✅ onPrintComplete finished');

      // Since we can't reliably fetch the bill, let's just use the current data
      // The bill has been saved to the database, but we'll print with local data
      console.log('📄 Using current order data for printing');

      const billDataForPrint = {
        reference_number: refNumber,
        barcode: billBarcode,
        customer_name: customerName || null,
        subtotal: subtotal,
        discount: discountAmount,
        total: finalTotal,
        paid_amount: paid,
        change_amount: paid - finalTotal,
        created_at: new Date().toISOString(),
        bill_items: orderItems.map(item => ({
          item_name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          total_price: item.menuItem.price * item.quantity,
        }))
      };

      console.log('📄 Bill data ready for printing:', billDataForPrint);

      setBillData(billDataForPrint);
      setReadyToPrint(true);

    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
      setIsPrinting(false);
      throw error;
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPrinting) {
      e.preventDefault();
      await handlePrintComplete();
    }
  };

  const handlePrintComplete = async () => {
    const paid = parseFloat(paidAmount) || 0;

    if (paid < finalTotal) {
      toast.error(`Insufficient payment. Need Rs. ${(finalTotal - paid).toLocaleString()} more`);
      paidAmountInputRef.current?.focus();
      return;
    }

    try {
      await printToThermalPrinter();
    } catch (error) {
      // Error already handled
    }
  };

  const formatDate = () => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body * {
            visibility: hidden !important;
          }
          
          #print-receipt,
          #print-receipt * {
            visibility: visible !important;
          }
          
          #print-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
          }
        }
        
        @media screen {
          #print-receipt {
            position: fixed;
            left: -9999px;
            top: -9999px;
            width: 80mm;
          }
        }
      `}</style>

      {/* Hidden receipt for printing */}
      <div id="print-receipt" key={`receipt-${billData?.id}`}>
        <table style={{ width: '100%', fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#000', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', paddingBottom: '10px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  {shopSettings?.name || 'Newsiri Trade Center'}
                </div>
                <div style={{ fontSize: '10px', lineHeight: '1.4', marginBottom: '2px' }}>
                  {shopSettings?.address || 'Padaviya Road, Kebithigollewa, Sri Lanka'}
                </div>
                <div style={{ fontSize: '10px', marginBottom: '8px' }}>
                  Tel: {shopSettings?.phone || '+94 11 234 5678'}
                </div>
              </td>
            </tr>

            <tr>
              <td style={{ padding: '0' }}>
                <table style={{ width: '100%', fontSize: '11px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 0' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', width: '40%' }}>Ref #:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '4px 0' }}>{billData?.reference_number || refNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0' }}>Date:</td>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>
                        {billData ? new Date(billData.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : formatDate()}
                      </td>
                    </tr>
                    {(billData?.customer_name || customerName) && (
                      <tr>
                        <td style={{ padding: '4px 0' }}>Customer:</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '4px 0' }}>{billData?.customer_name || customerName}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ borderTop: '1px dashed #999', paddingTop: '10px' }}></td>
            </tr>

            <tr>
              <td style={{ paddingBottom: '8px' }}>
                <table style={{ width: '100%', fontSize: '11px', fontWeight: 'bold' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '60%' }}>ITEM</td>
                      <td style={{ textAlign: 'right' }}>AMOUNT</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {billData && billData.bill_items && billData.bill_items.length > 0 ? (
              billData.bill_items.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ padding: '0' }}>
                    <table style={{ width: '100%', fontSize: '11px', marginBottom: '6px' }}>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 'bold', width: '60%' }}>{item.item_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Rs. {Number(item.total_price).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ fontSize: '10px', color: '#666', paddingTop: '2px' }}>
                            {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))
            ) : orderItems && orderItems.length > 0 ? (
              orderItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '0' }}>
                    <table style={{ width: '100%', fontSize: '11px', marginBottom: '6px' }}>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 'bold', width: '60%' }}>{item.menuItem.name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Rs. {(item.menuItem.price * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ fontSize: '10px', color: '#666', paddingTop: '2px' }}>
                            {item.quantity} × Rs. {item.menuItem.price.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ padding: '10px', textAlign: 'center', color: '#999' }}>No items</td>
              </tr>
            )}

            <tr>
              <td style={{ borderTop: '1px dashed #999', paddingTop: '10px' }}></td>
            </tr>

            <tr>
              <td>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td>Subtotal:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rs. {(billData?.subtotal || subtotal).toLocaleString()}</td>
                    </tr>
                    {(billData?.discount || discountAmount) > 0 && (
                      <tr style={{ color: '#00a000' }}>
                        <td>Discount:</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>-Rs. {(billData?.discount || discountAmount).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
                <table style={{ width: '100%', fontSize: '14px', fontWeight: 'bold' }}>
                  <tbody>
                    <tr>
                      <td>TOTAL:</td>
                      <td style={{ textAlign: 'right' }}>Rs. {(billData?.total || finalTotal).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ paddingTop: '6px' }}>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    {(billData?.paid_amount || 0) > 0 && (
                      <tr>
                        <td colSpan={2} style={{ background: '#e6f2ff', padding: '6px' }}>
                          <table style={{ width: '100%' }}>
                            <tbody>
                              <tr>
                                <td>Paid:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                  Rs. {Number(billData.paid_amount).toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                    {(billData?.change_amount || 0) > 0 && (
                      <tr>
                        <td colSpan={2} style={{ background: '#e6ffe6', padding: '6px' }}>
                          <table style={{ width: '100%' }}>
                            <tbody>
                              <tr>
                                <td>Change:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#008000' }}>
                                  Rs. {Number(billData.change_amount).toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ borderTop: '1px dashed #666', paddingTop: '8px' }}></td>
            </tr>

            {(billData?.barcode || billBarcode) && barcodeSVG && (
              <tr>
                <td style={{ padding: '10px', border: '2px solid #000', textAlign: 'center', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Scan for Bill Details
                  </div>
                  <img src={barcodeSVG} alt="" style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }} />
                </td>
              </tr>
            )}

            <tr>
              <td style={{ textAlign: 'center', fontSize: '11px', paddingTop: '12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Thank you for your purchase!</div>
                <div style={{ color: '#666', fontSize: '10px', marginBottom: '10px' }}>Please visit us again</div>
                <div style={{ fontSize: '9px', color: '#999', borderTop: '1px solid #ddd', paddingTop: '8px', lineHeight: '1.4' }}>
                  <div>POS System by {shopSettings?.created_by || 'Imesh S Abeysinghe'}</div>
                  <div>{shopSettings?.created_by_phone || '+94 77 00 25 374'}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} />

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" onKeyDown={handleKeyPress} aria-describedby="payment-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Printer className="h-6 w-6" />
              Payment & Print
            </DialogTitle>
          </DialogHeader>
          <p id="payment-dialog-description" className="sr-only">
            Enter payment details and print receipt
          </p>

          <div className="space-y-4 py-4">
            {billData && (
              <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950 p-2 rounded">
                ✅ Bill saved! Ready to print (Paid: Rs. {Number(billData.paid_amount).toLocaleString()}, Change: Rs. {Number(billData.change_amount).toLocaleString()})
              </div>
            )}
            {orderItems.length > 0 && !billData && (
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                📋 {orderItems.length} items in order
              </div>
            )}

            <div className="flex justify-between items-center bg-accent/10 p-4 rounded-lg">
              <span className="text-lg font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-success">
                Rs. {totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount: <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Enter to Print</kbd></Label>
              <Input
                ref={paidAmountInputRef}
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="text-lg font-bold"
                disabled={isPrinting}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Discount Type:</Label>
              <RadioGroup
                value={discountType}
                onValueChange={(value) => setDiscountType(value as 'percentage' | 'amount')}
                className="flex gap-4"
                disabled={isPrinting}
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
                disabled={isPrinting}
                placeholder="0"
              />
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-success bg-success/10 p-3 rounded-lg">
                <span>Discount Applied:</span>
                <span className="font-medium text-lg">-Rs. {discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-t-2 pt-3 bg-muted/20 p-3 rounded-lg">
              <span className="font-semibold text-lg">Final Total:</span>
              <span className="text-2xl font-bold text-primary">Rs. {finalTotal.toLocaleString()}</span>
            </div>

            {change >= 0 && (
              <div className={`flex justify-between items-center p-4 rounded-lg ${change > 0 ? 'bg-success/20 border-2 border-success' : 'bg-blue-50 dark:bg-blue-950'}`}>
                <span className="font-semibold text-lg">Change to Return:</span>
                <span className={`text-2xl font-bold ${change > 0 ? 'text-success' : 'text-blue-600 dark:text-blue-400'}`}>
                  Rs. {change.toLocaleString()}
                </span>
              </div>
            )}

            {change < 0 && (
              <div className="bg-destructive/10 p-4 rounded-lg border-2 border-destructive">
                <span className="text-destructive font-semibold text-sm">
                  ⚠️ Insufficient payment: Need Rs. {Math.abs(change).toLocaleString()} more
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handlePrintComplete}
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground text-base h-12"
              disabled={isPrinting || change < 0}
            >
              {isPrinting ? (
                <>
                  <Printer className="h-5 w-5 mr-2 animate-pulse" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="h-5 w-5 mr-2" />
                  Print & Open Drawer
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isPrinting} className="h-12">
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1 bg-muted/30 p-3 rounded">
            <p>💡 Press Enter to quickly print and open cash drawer</p>
            <p>🖨️ Receipt will be sent to thermal printer</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}