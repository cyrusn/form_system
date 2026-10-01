import { useRef, useState, useEffect } from 'react';

export default function SignatureInput({ signatureData, setSignatureData, isLocked }) {
  const canvasRef = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(!!signatureData);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize and load previous drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = signatureData;
      setHasDrawn(true);
    }
  }, [signatureData]);

  // Canvas drawing handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale standard dimensions to match CSS layout
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (isLocked) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || isLocked) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    if (isLocked) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureData('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    // Downscale slightly (e.g. compress to jpeg/png) to keep SQLite rows token-efficient
    const dataUrl = canvas.toDataURL('image/png', 0.7);
    setSignatureData(dataUrl);
  };

  return (
    <div>
      <div className="is-relative mb-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="signature-canvas"
          style={{ width: '100%', height: '200px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isLocked && (
          <div
            className="is-overlay"
            style={{ backgroundColor: 'rgba(0,0,0,0.03)', pointerEvents: 'auto' }}
          />
        )}
      </div>
      {!isLocked && (
        <button
          type="button"
          onClick={clearCanvas}
          className="button is-danger is-outlined is-small"
          disabled={!hasDrawn}
        >
          ✖ 重新簽署 (清除)
        </button>
      )}
    </div>
  );
}
