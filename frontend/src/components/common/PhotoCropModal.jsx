import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { XMarkIcon } from '@icons';
import ButtonSpinner from './ButtonSpinner';

const OUTPUT_SIZE = 500;

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.addEventListener('load', () => resolve(img));
  img.addEventListener('error', reject);
  img.setAttribute('crossOrigin', 'anonymous');
  img.src = src;
});

const cropToFile = async (imageSrc, cropPixels) => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
};

export default function PhotoCropModal({ imageSrc, onCancel, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  const confirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await cropToFile(imageSrc, croppedAreaPixels);
      onCropped(file);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <button type="button" onClick={onCancel} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" aria-label="Cancel crop">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Adjust photo</h3>
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={confirm} disabled={processing || !croppedAreaPixels} className="rounded-lg bg-[#1a6b3c] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-60">
            {processing ? <><ButtonSpinner /> Applying...</> : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
