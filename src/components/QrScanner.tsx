// @ts-nocheck
"use client";

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { QrcodeSuccessCallback, QrcodeErrorCallback } from 'html5-qrcode/esm/core';

interface QrScannerProps {
  onScanSuccess: QrcodeSuccessCallback;
  onScanFailure?: QrcodeErrorCallback;
  qrboxSize?: number;
  fps?: number;
}

const QrScanner: React.FC<QrScannerProps> = ({ 
  onScanSuccess, 
  onScanFailure,
  qrboxSize = 250,
  fps = 10 
}) => {
  const qrReaderId = "qr-reader";
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.AZTEC,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.MAXICODE,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.RSS_14,
        Html5QrcodeSupportedFormats.RSS_EXPANDED,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      ];

      const config = {
        fps: fps,
        qrbox: { width: qrboxSize, height: qrboxSize },
        supportedScanTypes: [], // Let library decide or specify if needed
        formatsToSupport: formatsToSupport
      };
      
      const scanner = new Html5QrcodeScanner(qrReaderId, config, false);
      scannerRef.current = scanner;

      const successCallback: QrcodeSuccessCallback = (decodedText, result) => {
        // scanner.pause(true); // Pause scanning after success
        onScanSuccess(decodedText, result);
        // To resume: scanner.resume();
      };
      
      scanner.render(successCallback, onScanFailure);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error("Failed to clear html5-qrcode scanner", error);
          });
        }
      };
    }
  }, [onScanSuccess, onScanFailure, qrboxSize, fps]);

  return <div id={qrReaderId} className="w-full max-w-md mx-auto" />;
};

export default QrScanner;
