import { useState, useRef, useEffect } from "react";
import { Camera, Scan, X, Search, Package } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

export const BarcodeScanner = ({
  onScan,
  onClose,
  isOpen = false,
  className = "",
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, isScanning]);

  const startCamera = async () => {
    try {
      setError(null);

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not supported in this browser");
        return;
      }

      const constraints = {
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start scanning for barcodes
      startBarcodeDetection();
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startBarcodeDetection = () => {
    // This is a simplified barcode detection
    // In a real app, you'd use a library like QuaggaJS or ZXing
    const detectBarcodes = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Here you would use a barcode detection library
      // For now, we'll just simulate detection
      simulateBarcodeDetection();
    };

    // Run detection every 100ms
    const interval = setInterval(detectBarcodes, 100);

    // Cleanup interval when component unmounts or scanning stops
    return () => clearInterval(interval);
  };

  const simulateBarcodeDetection = () => {
    // This is a placeholder for actual barcode detection
    // In a real implementation, you'd use a library like:
    // - QuaggaJS
    // - ZXing-JS
    // - @zxing/browser
    // For demo purposes, we'll just detect when user clicks
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput("");
      onClose();
    }
  };

  const handleScanCapture = () => {
    // Simulate barcode detection for demo
    const mockBarcode = "1234567890123"; // EAN-13 format
    onScan(mockBarcode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-md mx-4 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Scanner Toggle */}
          <div className="flex gap-2">
            <Button
              variant={isScanning ? "default" : "outline"}
              onClick={() => setIsScanning(true)}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera Scan
            </Button>
            <Button
              variant={!isScanning ? "default" : "outline"}
              onClick={() => setIsScanning(false)}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {/* Camera Scanner */}
          {isScanning && (
            <div className="space-y-4">
              {error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanner overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-32 border-2 border-white/80 border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-white/80 text-center">
                        <Package className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Position barcode here</p>
                      </div>
                    </div>
                  </div>

                  {/* Scan button */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={handleScanCapture}
                      className="bg-white/90 text-black hover:bg-white"
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  Demo Mode: Click "Capture" to simulate scan
                </Badge>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {!isScanning && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Barcode Number
                </label>
                <Input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Scan or type barcode number..."
                  className="font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Product
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Instructions */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Instructions:
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Position the barcode within the viewfinder</li>
              <li>• Ensure good lighting for best results</li>
              <li>• Hold steady until the code is detected</li>
              <li>• Use manual entry if camera scanning fails</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
