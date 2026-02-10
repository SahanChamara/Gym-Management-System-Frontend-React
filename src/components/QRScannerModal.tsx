import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { toast } from 'react-toastify';

interface QRScannerModalProps {
    onScan: (detectedCodes: IDetectedBarcode[]) => void;
    onClose: () => void;
}

export default function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
    const [qrError, setQrError] = useState<string | null>(null);
    const [scannerKey, setScannerKey] = useState(0);

    const handleScanError = (error: unknown) => {
        console.error('QR Scan Error:', error);
        let errorMessage = 'Error accessing camera. Please ensure camera permissions are granted.';
        if (error instanceof Error) {
            if (error.message.includes('Permission denied')) {
                errorMessage = 'Camera access denied. Please grant camera permissions and try again.';
            } else if (error.message.includes('No device found')) {
                errorMessage = 'No camera found. Please ensure a camera is available.';
            } else {
                errorMessage = error.message || 'An unexpected error occurred while scanning.';
            }
        }
        setQrError(errorMessage);
        toast.error(errorMessage, { position: 'top-right' });
    };

    const handleRetryScan = () => {
        setQrError(null);
        setScannerKey(prev => prev + 1); // Force remount Scanner
    };

    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
        onScan(detectedCodes);
        onClose(); // Automatically close modal after successful scan
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Scan QR Code
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    {qrError ? (
                        <div className="text-center">
                            <div className="text-red-500 dark:text-red-400 mb-4">
                                {qrError}
                            </div>
                            <button
                                onClick={handleRetryScan}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Retry Scan
                            </button>
                        </div>
                    ) : (
                        <div style={{ width: '100%' }}>
                            <Scanner
                                key={scannerKey}
                                onScan={handleScan}
                                onError={handleScanError}
                                constraints={{ facingMode: 'environment' }}
                                scanDelay={300}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}