import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, MapPin, User, Shield, Home } from 'lucide-react';
import jsQR from 'jsqr';
import apiService from '../services/api';

interface QRScannerProps {
  onClose: () => void;
}

interface LandData {
  assetId: string;
  surveyNumber: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  landType: string;
  area: {
    acres?: number;
    guntas?: number;
    sqft?: number;
  };
  currentOwner?: {
    fullName: string;
    email: string;
    verificationStatus: string;
  };
  verificationStatus: string;
  status: string;
  digitalDocument?: {
    isDigitalized: boolean;
  };
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [landData, setLandData] = useState<LandData | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError('');
      setLandData(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        scanIntervalRef.current = window.setInterval(scanQRCode, 500);
      }
    } catch (error) {
      setError('Camera access denied. Please allow camera access to scan QR codes.');
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        
        if (code && code.data) {
          handleQRCodeDetected(code.data);
        }
      }
    }
  };

  const handleQRCodeDetected = async (data: string) => {
    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopScanning();
    
    setLoading(true);
    setError('');
    
    try {
      // Try to parse QR data
      let assetId = data;
      try {
        const parsed = JSON.parse(data);
        assetId = parsed.assetId || parsed.landId || data;
      } catch {
        // If not JSON, use as-is
      }
      
      // Verify with backend
      const response = await apiService.searchLand(assetId);
      if (response.land) {
        setLandData(response.land);
      } else {
        setError('Land not found. Please check the QR code and try again.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const handleManualInput = async () => {
    const input = prompt('Enter Asset ID manually:');
    if (input && input.trim()) {
      setLoading(true);
      setError('');
      try {
        const response = await apiService.searchLand(input.trim());
        if (response.land) {
          setLandData(response.land);
        } else {
          setError('Land not found. Please check the Asset ID and try again.');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to verify Asset ID. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const formatArea = (area: any) => {
    const { acres, guntas, sqft } = area || {};
    let areaStr = '';
    if (acres && acres > 0) areaStr += `${acres} acres`;
    if (guntas && guntas > 0) areaStr += ` ${guntas} guntas`;
    if (sqft && sqft > 0) areaStr += ` ${sqft} sqft`;
    return areaStr || 'Area not specified';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">QR Code Verification</h2>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          )}

          {landData && !loading && (
            <div className="space-y-4">
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="font-semibold">Verified Successfully!</span>
              </div>

              {/* Land Information */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Land Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Asset ID</label>
                    <p className="text-white mt-1 font-mono">{landData.assetId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Survey Number</label>
                    <p className="text-white mt-1">{landData.surveyNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Land Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Home className="h-4 w-4 text-slate-400" />
                      <p className="text-white">{landData.landType}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Area</label>
                    <p className="text-white mt-1">{formatArea(landData.area)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Status</label>
                    <p className="text-white mt-1">{landData.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Verification</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                      landData.verificationStatus === 'VERIFIED' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {landData.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-white">{landData.village}</p>
                  <p className="text-white">{landData.taluka}, {landData.district}</p>
                  <p className="text-white">{landData.state}</p>
                </div>
              </div>

              {/* Owner Information */}
              {landData.currentOwner && (
                <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Current Owner
                  </h3>
                  <div className="space-y-2">
                    <p className="text-white font-medium">{landData.currentOwner.fullName}</p>
                    <p className="text-slate-400 text-sm">{landData.currentOwner.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">
                        {landData.currentOwner.verificationStatus === 'VERIFIED' ? 'Verified Owner' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLandData(null);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
              >
                Scan Another QR Code
              </button>
            </div>
          )}

          {!scanning && !landData && !loading && (
            <div className="space-y-4">
              <div className="text-center">
                <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Scan the QR code on the digitized land certificate to verify ownership and land details
                </p>
                <button
                  onClick={startScanning}
                  className="w-full bg-emerald-500 text-slate-950 py-3 px-4 rounded-lg hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/40 transition-colors"
                >
                  Start Camera
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Or</p>
                <button
                  onClick={handleManualInput}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                >
                  Enter Asset ID manually
                </button>
              </div>
            </div>
          )}

          {scanning && !landData && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-80 bg-black rounded-lg"
                  autoPlay
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-emerald-500 w-64 h-64 rounded-lg">
                    <div className="w-full h-full border-4 border-white/30 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-300 mb-4">
                  Position the QR code within the frame
                </p>
                <button
                  onClick={stopScanning}
                  className="bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;