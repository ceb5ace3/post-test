import { useRef, useEffect, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface BillItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Bill {
  id: string;
  reference_number: string;
  barcode: string | null;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  created_at: string;
}

interface ShopSettings {
  name: string;
  address: string | null;
  phone: string | null;
  created_by: string;
  created_by_phone: string;
}

interface ReceiptViewProps {
  bill: Bill;
  items: BillItem[];
}

export function ReceiptView({ bill, items }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [barcodeSVG, setBarcodeSVG] = useState<string>('');

  useEffect(() => {
    fetchShopSettings();
  }, []);

  useEffect(() => {
    if (bill.barcode) {
      generateBarcode(bill.barcode);
    }
  }, [bill.barcode]);

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

    // Set canvas size - wider for more bars
    const width = 300;
    const height = 100;
    canvas.width = width;
    canvas.height = height;

    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';

    // Barcode settings
    const barHeight = 65;
    const barY = 8;
    const barWidth = 2;
    const spacing = 1;

    // Calculate total width needed
    const totalBarsNeeded = code.length * 6; // 6 bars per digit
    const totalWidth = totalBarsNeeded * (barWidth + spacing);
    const startX = (width - totalWidth) / 2; // Center the barcode

    let x = startX;

    // Start bars
    ctx.fillRect(x, barY, barWidth * 1.5, barHeight);
    x += (barWidth * 1.5) + spacing;
    ctx.fillRect(x, barY, barWidth, barHeight);
    x += barWidth + spacing * 2;

    // Generate bars for each digit
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]) || 0;

      // Create unique pattern for each digit (0-9)
      const patterns = [
        [1, 1, 0, 1, 1, 0], // 0
        [1, 0, 1, 1, 0, 1], // 1
        [1, 0, 0, 1, 1, 1], // 2
        [0, 1, 1, 0, 1, 1], // 3
        [1, 1, 0, 0, 1, 1], // 4
        [1, 1, 1, 0, 0, 1], // 5
        [0, 1, 0, 1, 1, 1], // 6
        [1, 0, 1, 0, 1, 1], // 7
        [1, 1, 0, 1, 0, 1], // 8
        [0, 1, 1, 1, 0, 1], // 9
      ];

      const pattern = patterns[digit];

      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === 1) {
          ctx.fillRect(x, barY, barWidth, barHeight);
        }
        x += barWidth + spacing;
      }
    }

    // End bars
    x += spacing;
    ctx.fillRect(x, barY, barWidth, barHeight);
    x += barWidth + spacing;
    ctx.fillRect(x, barY, barWidth * 1.5, barHeight);

    // Draw number below barcode - centered
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, width / 2, barY + barHeight + 22);

    // Save as data URL
    const dataURL = canvas.toDataURL('image/png');
    setBarcodeSVG(dataURL);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${bill.reference_number}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              line-height: 1.4;
              padding: 15px; 
              max-width: 80mm; 
              margin: 0 auto;
              color: #000;
              background: #fff;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 12px; 
              padding-bottom: 8px;
              border-bottom: 2px solid #000;
            }
            
            .shop-name { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            
            .shop-info {
              font-size: 10px;
              color: #333;
              line-height: 1.4;
            }
            
            .divider { 
              border-top: 2px dashed #000; 
              margin: 10px 0; 
            }
            
            .bill-info {
              font-size: 11px;
              margin: 8px 0;
              background: #f5f5f5;
              padding: 6px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            
            .info-label {
              font-weight: 600;
              color: #666;
            }
            
            .info-value {
              font-weight: bold;
              color: #000;
            }
            
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 11px;
              border-bottom: 2px solid #000;
              padding-bottom: 3px;
              margin: 10px 0 6px 0;
            }
            
            .item-row { 
              margin: 6px 0;
              font-size: 11px;
              padding: 6px 0;
              border-bottom: 1px solid #ddd;
            }
            
            .item-row:last-child {
              border-bottom: none;
            }
            
            .item-name-row {
              display: flex;
              justify-content: space-between;
              font-weight: 600;
              margin-bottom: 2px;
            }
            
            .item-details {
              color: #666;
              font-size: 10px;
            }
            
            .totals {
              margin-top: 10px;
              font-size: 11px;
            }
            
            .total-row { 
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              padding: 3px 0;
            }
            
            .grand-total {
              font-size: 16px;
              font-weight: bold;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 8px 0;
              margin: 8px 0;
            }
            
            .payment-row {
              background: #e3f2fd;
              padding: 5px;
              margin: 5px 0;
            }
            
            .change-row {
              background: #e8f5e9;
              padding: 5px;
              margin: 5px 0;
              color: #2d7c2d;
              font-weight: bold;
            }
            
            .barcode-section {
              text-align: center;
              margin: 12px auto;
              padding: 12px;
              background: #fff;
              border: 2px solid #000;
              max-width: 100%;
            }
            
            .barcode-label {
              font-size: 9px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
              font-weight: bold;
            }
            
            .barcode-image {
              width: 100%;
              max-width: 280px;
              height: auto;
              margin: 0 auto;
              display: block;
            }
            
            .footer { 
              text-align: center; 
              margin-top: 12px; 
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }
            
            .thank-you {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 6px;
              color: #000;
            }
            
            .developer-info {
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid #ddd;
              font-size: 9px;
            }
            
            @media print { 
              body { 
                margin: 0; 
                padding: 8px;
              }
              
              @page {
                margin: 5mm;
                size: 80mm auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shopSettings?.name || 'Newsiri Trade Center'}</div>
            <div class="shop-info">
              ${shopSettings?.address || 'Padaviya Road, Kebithigollewa, Sri Lanka'}<br>
              Tel: ${shopSettings?.phone || '+94 11 234 5678'}
            </div>
          </div>

          <div class="bill-info">
            <div class="info-row">
              <span class="info-label">Ref #:</span>
              <span class="info-value">${bill.reference_number}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${new Date(bill.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}</span>
            </div>
            ${bill.customer_name ? `
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span class="info-value">${bill.customer_name}</span>
            </div>
            ` : ''}
          </div>

          <div class="divider"></div>

          <div class="items-header">
            <span>ITEM</span>
            <span>AMOUNT</span>
          </div>

          ${items.map(item => `
            <div class="item-row">
              <div class="item-name-row">
                <span>${item.item_name}</span>
                <span>Rs. ${Number(item.total_price).toLocaleString()}</span>
              </div>
              <div class="item-details">
                ${item.quantity} × Rs. ${Number(item.unit_price).toLocaleString()}
              </div>
            </div>
          `).join('')}

          <div class="divider"></div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rs. ${Number(bill.subtotal).toLocaleString()}</span>
            </div>
            
            ${Number(bill.discount) > 0 ? `
            <div class="total-row" style="color: #2d7c2d;">
              <span>Discount:</span>
              <span>-Rs. ${Number(bill.discount).toLocaleString()}</span>
            </div>
            ` : ''}
            
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>Rs. ${Number(bill.total).toLocaleString()}</span>
            </div>
            
            <div class="total-row payment-row">
              <span>Paid:</span>
              <span>Rs. ${Number(bill.paid_amount).toLocaleString()}</span>
            </div>
            
            ${Number(bill.change_amount) > 0 ? `
            <div class="total-row change-row">
              <span>Change:</span>
              <span>Rs. ${Number(bill.change_amount).toLocaleString()}</span>
            </div>
            ` : ''}
          </div>

          <div class="divider"></div>

          ${bill.barcode && barcodeSVG ? `
          <div class="barcode-section">
            <div class="barcode-label">Scan for Bill Details</div>
            <img src="${barcodeSVG}" alt="Barcode: ${bill.barcode}" class="barcode-image" />
          </div>
          ` : ''}

          <div class="footer">
            <div class="thank-you">Thank you for your purchase!</div>
            <div>Please visit us again</div>
            <div class="developer-info">
              POS System by ${shopSettings?.created_by || 'Imesh S Abeysinghe'}<br>
              ${shopSettings?.created_by_phone || '+94 77 00 25 374'}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div ref={receiptRef} className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
        <div className="text-center mb-4 pb-3 border-b-2 border-gray-800">
          <h2 className="text-xl font-bold mb-1 tracking-wide text-gray-900">
            {shopSettings?.name || 'Newsiri Trade Center'}
          </h2>
          <p className="text-xs text-gray-600 mb-1">
            {shopSettings?.address || 'Padaviya Road, Kebithigollewa, Sri Lanka'}
          </p>
          <p className="text-xs text-gray-600">
            Tel: {shopSettings?.phone || '+94 11 234 5678'}
          </p>
        </div>

        <div className="space-y-2 text-sm mb-4 bg-blue-50 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600 font-medium">Ref #:</span>
            <span className="font-mono font-bold text-gray-900">{bill.reference_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-medium">Date:</span>
            <span className="text-gray-900">{formatDate(bill.created_at)}</span>
          </div>
          {bill.customer_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Customer:</span>
              <span className="text-gray-900 font-semibold">{bill.customer_name}</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-400 my-4" />

        <div className="space-y-3 mb-4">
          <div className="flex justify-between font-bold text-sm text-gray-800 border-b-2 border-gray-800 pb-2">
            <span>ITEM</span>
            <span>AMOUNT</span>
          </div>
          {items.map((item, index) => (
            <div key={item.id} className={`space-y-1 ${index > 0 ? 'pt-3 border-t border-gray-200' : ''}`}>
              <div className="flex justify-between items-start">
                <span className="flex-1 font-semibold text-gray-900">{item.item_name}</span>
                <span className="font-bold text-gray-900 ml-4">
                  Rs. {Number(item.total_price).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-gray-400 my-4" />

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-900">Rs. {Number(bill.subtotal).toLocaleString()}</span>
          </div>
          {Number(bill.discount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="font-medium">Discount:</span>
              <span className="font-bold">-Rs. {Number(bill.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t-2 border-b-2 border-gray-800 py-3 mt-2 text-gray-900">
            <span>TOTAL:</span>
            <span>Rs. {Number(bill.total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm bg-blue-100 p-2 rounded">
            <span className="text-gray-700">Paid:</span>
            <span className="font-semibold text-gray-900">Rs. {Number(bill.paid_amount).toLocaleString()}</span>
          </div>
          {Number(bill.change_amount) > 0 && (
            <div className="flex justify-between text-sm bg-green-100 p-2 rounded">
              <span className="text-gray-700">Change:</span>
              <span className="font-bold text-green-700">Rs. {Number(bill.change_amount).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-400 my-4" />

        {bill.barcode && (
          <div className="bg-white p-4 rounded-lg border-2 border-gray-800 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-600 uppercase tracking-wider mb-3 font-bold">
                Scan for Bill Details
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={barcodeCanvasRef}
                  className="max-w-full"
                  style={{ margin: '0 auto' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs mt-4 pt-3 border-t border-gray-300">
          <p className="text-base font-bold text-gray-900 mb-2">Thank you for your purchase!</p>
          <p className="text-gray-600 mb-3">Please visit us again</p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-gray-500 mb-1">
              POS System by {shopSettings?.created_by || 'Imesh S Abeysinghe'}
            </p>
            <p className="text-gray-500">
              {shopSettings?.created_by_phone || '+94 77 00 25 374'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}