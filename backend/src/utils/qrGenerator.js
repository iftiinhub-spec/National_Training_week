import QRCode from 'qrcode';

// Generate QR code as a base64 data URL
export const generateQRDataUrl = async (data) => {
  return QRCode.toDataURL(String(data), {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 200,
    margin: 1,
  });
};

// Generate QR code as a buffer
export const generateQRBuffer = async (data) => {
  return QRCode.toBuffer(String(data), {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 200,
    margin: 1,
  });
};
