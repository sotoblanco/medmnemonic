
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MnemonicAssociation } from '../types';

interface ImageDisplayProps {
  imageData: string | null;
  isLoading: boolean;
  topic?: string;
  associations?: MnemonicAssociation[];
  highlightedIndex: number | null;
  onUpdateAssociation?: (index: number, box: [number, number, number, number] | undefined, shape: 'rect' | 'ellipse') => void;
  onDetect?: (index: number) => void;
  onDetectAll?: () => void;
  isDetecting?: boolean;
  isDetectingAll?: boolean;
  onRegenerateImage?: () => void;
  t: (key: any) => string;
}

// Drag modes for different handles
type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageData, 
  isLoading, 
  topic, 
  associations, 
  highlightedIndex,
  onUpdateAssociation,
  onDetect,
  onDetectAll,
  isDetecting,
  isDetectingAll,
  onRegenerateImage,
  t
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get active association data
  const activeAssociation = highlightedIndex !== null && associations ? associations[highlightedIndex] : null;
  const propBox = activeAssociation?.boundingBox;
  const propShape = activeAssociation?.shape || 'rect';

  const [localBox, setLocalBox] = useState<[number, number, number, number] | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      if (propBox) {
        setLocalBox(propBox);
      } else if (highlightedIndex !== null && !propBox) {
        setLocalBox(null);
      } else {
        setLocalBox(null);
      }
    }
  }, [propBox, highlightedIndex, isDragging]);

  const commitChanges = useCallback((box: [number, number, number, number], shape: 'rect' | 'ellipse') => {
    if (highlightedIndex !== null && onUpdateAssociation) {
      onUpdateAssociation(highlightedIndex, box, shape);
    }
  }, [highlightedIndex, onUpdateAssociation]);

  const handleDelete = useCallback(() => {
    if (highlightedIndex !== null && onUpdateAssociation) {
      onUpdateAssociation(highlightedIndex, undefined, propShape);
    }
  }, [highlightedIndex, onUpdateAssociation, propShape]);

  const handleSaveDefault = useCallback(() => {
    if (highlightedIndex !== null && onUpdateAssociation) {
        const defaultBox: [number, number, number, number] = [35, 35, 65, 65];
        onUpdateAssociation(highlightedIndex, defaultBox, propShape);
        setLocalBox(defaultBox);
    }
  }, [highlightedIndex, onUpdateAssociation, propShape]);

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    if (!localBox) return;
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setIsDragging(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localBox && highlightedIndex !== null) {
      const newShape = propShape === 'rect' ? 'ellipse' : 'rect';
      commitChanges(localBox, newShape);
    }
  };

  useEffect(() => {
    if (!isDragging || !dragMode || !containerRef.current || !localBox) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dx = (e.movementX / rect.width) * 100;
      const dy = (e.movementY / rect.height) * 100;

      setLocalBox(prev => {
        if (!prev) return null;
        let [ymin, xmin, ymax, xmax] = prev;
        const currentW = xmax - xmin;
        const currentH = ymax - ymin;

        if (dragMode === 'move') {
          xmin += dx; xmax += dx; ymin += dy; ymax += dy;
          if (xmin < 0) { xmin = 0; xmax = currentW; }
          if (xmax > 100) { xmax = 100; xmin = 100 - currentW; }
          if (ymin < 0) { ymin = 0; ymax = currentH; }
          if (ymax > 100) { ymax = 100; ymin = 100 - currentH; }
        } else {
          const minSize = 5;
          if (dragMode.includes('n')) ymin = Math.min(ymin + dy, ymax - minSize);
          if (dragMode.includes('s')) ymax = Math.max(ymax + dy, ymin + minSize);
          if (dragMode.includes('w')) xmin = Math.min(xmin + dx, xmax - minSize);
          if (dragMode.includes('e')) xmax = Math.max(xmax + dx, xmin + minSize);
          ymin = Math.max(0, ymin); ymax = Math.min(100, ymax); xmin = Math.max(0, xmin); xmax = Math.min(100, xmax);
        }
        return [ymin, xmin, ymax, xmax];
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
      if (localBox) commitChanges(localBox, propShape);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragMode, localBox, propShape, commitChanges]);

  const geo = useMemo(() => {
    if (!localBox) return null;
    const [ymin, xmin, ymax, xmax] = localBox;
    return {
      style: { top: `${ymin}%`, left: `${xmin}%`, width: `${xmax - xmin}%`, height: `${ymax - ymin}%` },
      svg: { x: `${xmin}%`, y: `${ymin}%`, width: `${xmax - xmin}%`, height: `${ymax - ymin}%`, cx: `${xmin + (xmax - xmin)/2}%`, cy: `${ymin + (ymax - ymin)/2}%`, rx: `${(xmax - xmin)/2}%`, ry: `${(ymax - ymin)/2}%` }
    };
  }, [localBox]);

  const Handle = ({ mode, cursor, posClass }: { mode: DragMode, cursor: string, posClass: string }) => (
    <div onMouseDown={(e) => handleMouseDown(e, mode)} className={`absolute w-3 h-3 bg-white border border-amber-600 rounded-full z-30 ${posClass} ${cursor} hover:scale-125 transition-transform shadow-sm`} />
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 h-full flex flex-col">
       <div className="bg-teal-800 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {t('visualMnemonic')}
        </h2>
        <div className="flex items-center gap-3">
          {isDetectingAll && <span className="text-amber-200 text-xs animate-pulse font-bold">{t('detectingAll')}</span>}
          {onDetectAll && !isLoading && imageData && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDetectAll(); }}
              disabled={isDetectingAll}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${isDetectingAll ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              title={t('autoDetectAll')}
            >
              {isDetectingAll ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              {t('autoDetectAll')}
            </button>
          )}
          {!isLoading && imageData && onRegenerateImage && (
            <button onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }} className="text-white hover:text-teal-200 transition-colors p-1" title={t('regenerateImage')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-grow min-h-[400px] bg-stone-100 flex items-center justify-center p-4">
        {isLoading ? (
          <div className="text-center w-full">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-64 w-64 bg-stone-200 rounded-full mb-4"></div>
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-stone-200 rounded w-1/2"></div>
            </div>
            <p className="mt-6 text-teal-700 font-medium animate-pulse">{t('paintingMemory')}</p>
          </div>
        ) : imageData ? (
          <div className="relative w-full h-full flex items-center justify-center group select-none">
            {highlightedIndex !== null && (
                <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-stone-200 p-2 flex flex-col gap-2 w-32 animate-fade-in">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-stone-100 pb-1 mb-1">{t('controls')}</div>
                    <button onClick={handleSaveDefault} className="flex items-center gap-2 text-sm text-slate-700 hover:text-teal-700 hover:bg-teal-50 p-2 rounded-lg transition-colors text-left font-medium">
                        {propBox ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                        <span>{propBox ? t('resetBox') : t('addBox')}</span>
                    </button>
                    <button onClick={() => onDetect && highlightedIndex !== null && onDetect(highlightedIndex)} disabled={isDetecting} className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-colors text-left font-medium ${isDetecting ? 'text-amber-400 cursor-wait bg-amber-50' : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'}`}>
                         {isDetecting ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        <span>{t('detect')}</span>
                    </button>
                    <button onClick={handleDelete} disabled={!propBox} className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-colors text-left font-medium ${!propBox ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>{t('remove')}</span>
                    </button>
                </div>
            )}
            <div ref={containerRef} className="relative w-full" style={{ aspectRatio: '4/3', maxHeight: '100%', maxWidth: '100%' }}>
              <img src={imageData} alt={`Mnemonic illustration for ${topic}`} className="w-full h-full object-contain rounded-lg shadow-md block relative z-0 pointer-events-none" />
              {localBox && geo && (
                <>
                  <div className="absolute inset-0 z-10 rounded-lg overflow-hidden pointer-events-none">
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                      <defs>
                        <mask id="spotlightMask"><rect x="0" y="0" width="100%" height="100%" fill="white" />{propShape === 'rect' ? <rect x={geo.svg.x} y={geo.svg.y} width={geo.svg.width} height={geo.svg.height} rx="5" ry="5" fill="black" /> : <ellipse cx={geo.svg.cx} cy={geo.svg.cy} rx={geo.svg.rx} ry={geo.svg.ry} fill="black" />}</mask>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.7)" mask="url(#spotlightMask)" />
                      {propShape === 'rect' ? <rect x={geo.svg.x} y={geo.svg.y} width={geo.svg.width} height={geo.svg.height} rx="5" ry="5" fill="none" stroke={propBox ? "#f59e0b" : "#94a3b8"} strokeWidth={propBox ? "3" : "2"} strokeDasharray={propBox ? "" : "5,5"} /> : <ellipse cx={geo.svg.cx} cy={geo.svg.cy} rx={geo.svg.rx} ry={geo.svg.ry} fill="none" stroke={propBox ? "#f59e0b" : "#94a3b8"} strokeWidth={propBox ? "3" : "2"} strokeDasharray={propBox ? "" : "5,5"} />}
                    </svg>
                  </div>
                  <div className="absolute z-20" style={geo.style}>
                    <div className="w-full h-full cursor-move bg-transparent" onMouseDown={(e) => handleMouseDown(e, 'move')} onDoubleClick={handleDoubleClick} title={propBox ? "Drag to move, Double-click to toggle shape" : "Drag to place new highlight"} />
                    <Handle mode="nw" cursor="cursor-nw-resize" posClass="-top-1.5 -left-1.5" />
                    <Handle mode="n" cursor="cursor-n-resize" posClass="-top-1.5 left-1/2 -translate-x-1/2" />
                    <Handle mode="ne" cursor="cursor-ne-resize" posClass="-top-1.5 -right-1.5" />
                    <Handle mode="e" cursor="cursor-e-resize" posClass="top-1/2 -right-1.5 -translate-y-1/2" />
                    <Handle mode="se" cursor="cursor-se-resize" posClass="-bottom-1.5 -right-1.5" />
                    <Handle mode="s" cursor="cursor-s-resize" posClass="-bottom-1.5 left-1/2 -translate-x-1/2" />
                    <Handle mode="sw" cursor="cursor-sw-resize" posClass="-bottom-1.5 -left-1.5" />
                    <Handle mode="w" cursor="cursor-w-resize" posClass="top-1/2 -left-1.5 -translate-y-1/2" />
                  </div>
                </>
              )}
            </div>
            <a href={imageData} download={`${topic || 'mnemonic'}.png`} className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20" title={t('downloadImage')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
          </div>
        ) : (
          <div className="text-slate-400 text-center"><svg className="mx-auto h-16 w-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p>Image will appear here</p></div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
