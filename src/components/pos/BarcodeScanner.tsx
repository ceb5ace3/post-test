import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanning(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      // Start scanning loop
      scanLoop();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions or enter barcode manually.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const scanLoop = () => {
    // Simple barcode detection using canvas analysis
    // For production, consider using a library like @zxing/library
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Here you would integrate with a barcode detection library
      // For now, we'll use manual input as fallback
    }

    if (scanning) {
      requestAnimationFrame(scanLoop);
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
    } else {
      toast.error('Please enter a barcode');
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera View */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-accent rounded-lg opacity-75" />
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={stopCamera}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
            {cameraError ? (
              <p className="text-sm text-muted-foreground text-center">{cameraError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to start camera</p>
            )}
            <Button onClick={startCamera}>
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}
      </div>

      {/* Scanning Indicator */}
      {scanning && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Position barcode within the frame...
          </p>
        </div>
      )}

      {/* Manual Input */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Or enter barcode manually:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Enter barcode number"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <Button onClick={handleManualSubmit}>Search</Button>
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
