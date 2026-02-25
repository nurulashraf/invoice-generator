import React, { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';
import { useI18n } from '../i18n';

interface SignaturePadProps {
  initialValue?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ initialValue, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialValue;
    }
  }, [initialValue]);

  const getCanvasCoords = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(canvas, e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1D1D1F';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(canvas, e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        onChange(canvas.toDataURL());
      }
    }
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onChange(undefined);
    }
  };

  return (
    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-3 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full bg-white rounded-lg cursor-crosshair touch-none shadow-sm"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> {t('clear')}
        </button>
      </div>
    </div>
  );
};