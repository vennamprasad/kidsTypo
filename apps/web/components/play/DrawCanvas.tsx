"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Palette, Eraser, Sticker, Sparkles, Trash2, Camera, Loader2 } from 'lucide-react';
import { auth, storage, db } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

import { TaskSuccessOverlay } from './TaskSuccessOverlay';
import { useAppStore } from '@/store/useAppStore';

type Tool = 'brush' | 'eraser' | 'stamp' | 'rainbow' | 'sparkle';

const STAMPS = ['⭐', '❤️', '🐱', '🐶', '🚀', '🌈', '🍦', '🍕', '🦁', '🦖', '🦋', '🍄'];
const COLORS = ['#ffffff', '#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#4dffff', '#ff8c00', '#9c27b0'];

import { usePixiApp } from '@/hooks/usePixiApp';

export const DrawCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingLayerRef = useRef<PIXI.Container | null>(null);

  // React State for UI
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(15);
  const [selectedStamp, setSelectedStamp] = useState('⭐');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeTask = useAppStore(state => state.activeTask);
  const completeActiveTask = useAppStore(state => state.completeActiveTask);

  // Refs for PIXI access (prevents re-init on state change)
  const toolRef = useRef<Tool>(activeTool);
  const colorRef = useRef(color);
  const sizeRef = useRef(brushSize);
  const stampRef = useRef(selectedStamp);

  const currentGraphicsRef = useRef<PIXI.Graphics | null>(null);

  // Sync refs with state
  useEffect(() => { toolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { stampRef.current = selectedStamp; }, [selectedStamp]);

  const pixiOptions = React.useMemo(() => ({ preserveDrawingBuffer: true }), []);

  const { appRef } = usePixiApp({
    containerRef,
    options: pixiOptions,
    onInit: (app: PIXI.Application) => {
      const drawingLayer = new PIXI.Container();
      app.stage.addChild(drawingLayer);
      drawingLayerRef.current = drawingLayer;

      let isDrawing = false;
      let hue = 0;

      app.stage.interactive = true;
      app.stage.hitArea = app.screen;

      const placeStamp = (x: number, y: number) => {
        const text = new PIXI.Text({
          text: stampRef.current,
          style: { fontSize: sizeRef.current * 4 }
        });
        text.anchor.set(0.5);
        text.x = x;
        text.y = y;
        text.rotation = (Math.random() - 0.5) * 0.5;
        drawingLayer.addChild(text);

        text.scale.set(0);
        let scale = 0;
        const tick = () => {
          scale += 0.2;
          if (text.destroyed) {
            app.ticker.remove(tick);
            return;
          }
          text.scale.set(scale);
          if (scale >= 1) {
            text.scale.set(1);
            app.ticker.remove(tick);
          }
        };
        app.ticker.add(tick);
      };

      const createSparkle = (x: number, y: number) => {
        const sparkle = new PIXI.Graphics();
        sparkle.circle(0, 0, Math.random() * 5 + 2);
        sparkle.fill(0xffffff);
        sparkle.x = x;
        sparkle.y = y;
        if (app.stage && !app.stage.destroyed) {
          app.stage.addChild(sparkle);

          const vx = (Math.random() - 0.5) * 5;
          const vy = (Math.random() - 0.5) * 5;
          let alpha = 1;

          const tick = (ticker: PIXI.Ticker) => {
            if (sparkle.destroyed || (app as unknown as { destroyed: boolean }).destroyed || !app.stage || app.stage.destroyed) {
              app.ticker.remove(tick);
              return;
            }
            sparkle.x += vx * ticker.deltaTime;
            sparkle.y += vy * ticker.deltaTime;
            alpha -= 0.05 * ticker.deltaTime;
            sparkle.alpha = alpha;
            if (alpha <= 0) {
              app.ticker.remove(tick);
              if (!drawingLayer.destroyed) drawingLayer.removeChild(sparkle);
              if (!sparkle.destroyed) sparkle.destroy();
            }
          };
          app.ticker.add(tick);
        }
      };

      const onPointerDown = (e: PIXI.FederatedPointerEvent) => {
        isDrawing = true;
        const pos = { x: e.global.x, y: e.global.y };

        if (toolRef.current === 'stamp') {
          placeStamp(pos.x, pos.y);
          return;
        }

        const g = new PIXI.Graphics();
        
        // Setup proper erase blending if eraser is selected
        if (toolRef.current === 'eraser') {
            g.blendMode = 'erase';
        }
        
        drawingLayer.addChild(g);
        g.moveTo(pos.x, pos.y);
        currentGraphicsRef.current = g;
      };

      const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
        if (!isDrawing) return;
        const pos = { x: e.global.x, y: e.global.y };

        if (toolRef.current === 'stamp') return;

        let drawColor = colorRef.current;
        let drawSize = sizeRef.current;
        const drawAlpha = 1;

        if (toolRef.current === 'rainbow') {
          hue = (hue + 5) % 360;
          drawColor = `hsl(${hue}, 100%, 50%)`;
        } else if (toolRef.current === 'eraser') {
          drawColor = '#ffffff'; // Color doesn't matter for erase blend mode, just needs alpha
          drawSize = sizeRef.current * 2;
        } else if (toolRef.current === 'sparkle') {
          createSparkle(pos.x, pos.y);
        }

        const g = currentGraphicsRef.current;
        if (g && !g.destroyed) {
          g.setStrokeStyle({
            width: drawSize,
            color: drawColor,
            join: 'round',
            cap: 'round',
            alpha: drawAlpha
          });
          g.lineTo(pos.x, pos.y);
          g.stroke();
        }

      };

      const onPointerUp = () => {
        isDrawing = false;
        currentGraphicsRef.current = null;
      };

      app.stage.on('pointerdown', onPointerDown);
      app.stage.on('pointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);
      app.stage.on('pointerupoutside', onPointerUp);
    },
    onCleanup: () => {
      drawingLayerRef.current = null;
    }
  });

  const clearCanvas = () => {
    currentGraphicsRef.current = null;

    if (drawingLayerRef.current) {
      // destroy all children
      const children = [...drawingLayerRef.current.children];
      children.forEach(c => {
        if (!c.destroyed) c.destroy({ children: true });
      });
      drawingLayerRef.current.removeChildren();
    }
  };

  const saveCanvas = async () => {
    if (appRef.current && appRef.current.canvas && !isSaving) {
      setIsSaving(true);
      try {
        const canvas = appRef.current.canvas;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // 1. Download locally (immediate feedback for kid)
        const filename = `kiddlr-art-${Date.now()}.png`;
        const link = document.createElement('a');
        
        link.setAttribute('href', dataUrl);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);

        // 2. Upload to Firebase Storage if parent is logged in
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          const timestamp = Date.now();
          const imageRef = ref(storage, `drawings/${uid}/${timestamp}.png`);
          
          await uploadString(imageRef, dataUrl, 'data_url');
          const downloadURL = await getDownloadURL(imageRef);

          // 3. Save reference in Firestore to show in Gallery
          await setDoc(doc(db, `drawings`, timestamp.toString()), {
            parentUid: uid,
            url: downloadURL,
            createdAt: timestamp
          });
          
          console.log("Artwork synced to cloud!");
        }

        // 4. Complete task if drawing assignment
        if (activeTask && activeTask.type === 'drawing') {
          setShowSuccess(true);
          await completeActiveTask();
        }

      } catch (error) {
        console.error("Magic Canvas: Save failed", error);
        alert("Oops! We couldn't save your art. Try again!");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar Toolbar (Desktop) / Bottom Bar (Mobile) */}
      <div className="z-10 w-full md:w-24 flex md:flex-col items-center justify-center gap-2 md:gap-4 p-2 md:p-4 bg-white/5 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 order-last md:order-first">
        <div className="flex md:flex-col gap-2 md:gap-4 overflow-x-auto md:overflow-visible w-full justify-center scrollbar-hide">
          <ToolButton
            id="tool-brush"
            active={activeTool === 'brush'}
            onClick={() => setActiveTool('brush')}
            icon={<Palette className="w-6 h-6 md:w-7 md:h-7" />}
            label="Paint"
            color="bg-sky-500"
          />
          <ToolButton
            id="tool-rainbow"
            active={activeTool === 'rainbow'}
            onClick={() => setActiveTool('rainbow')}
            icon={<Sparkles className="w-6 h-6 md:w-7 md:h-7" />}
            label="Magic"
            color="bg-gradient-to-br from-red-400 via-green-400 to-blue-400"
          />
          <ToolButton
            id="tool-stamp"
            active={activeTool === 'stamp'}
            onClick={() => setActiveTool('stamp')}
            icon={<Sticker className="w-6 h-6 md:w-7 md:h-7" />}
            label="Sticker"
            color="bg-amber-400"
          />
          <ToolButton
            id="tool-eraser"
            active={activeTool === 'eraser'}
            onClick={() => setActiveTool('eraser')}
            icon={<Eraser className="w-6 h-6 md:w-7 md:h-7" />}
            label="Eraser"
            color="bg-slate-500"
          />
        </div>
        
        <div className="hidden md:flex flex-col gap-4 mt-auto">
          <ToolButton
            id="btn-save"
            active={false}
            onClick={saveCanvas}
            icon={isSaving ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
            label={isSaving ? "Saving..." : "Save"}
            color="bg-emerald-500"
          />
          <ToolButton
            id="btn-clear"
            active={false}
            onClick={clearCanvas}
            icon={<Trash2 size={24} />}
            label="Clear"
            color="bg-rose-500"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 relative flex flex-col">
        {/* Top bar (Options) */}
        <div className="min-h-16 md:min-h-20 w-full flex flex-wrap items-center justify-start px-4 md:px-8 py-2 md:py-3 gap-4 md:gap-8 z-20">
          {activeTool === 'stamp' ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide max-w-[80vw]">
              {STAMPS.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStamp(s)}
                  className={`text-3xl sm:text-4xl p-2 rounded-2xl flex-shrink-0 transition-all ${selectedStamp === s ? 'bg-white/20 scale-125 shadow-lg' : 'hover:bg-white/10'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-[70vw] md:max-w-none">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    if (activeTool === 'eraser' || activeTool === 'rainbow' || activeTool === 'sparkle') {
                      setActiveTool('brush');
                    }
                  }}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 flex-shrink-0 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          <div className="flex flex-shrink-0 items-center gap-2 md:gap-3 bg-white/10 px-3 md:px-5 py-1 md:py-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg ml-auto md:ml-0">
            <span className="hidden sm:inline text-xs sm:text-sm font-bold text-white uppercase tracking-widest text-[10px] md:text-sm">Size</span>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 md:w-32 h-2 bg-white/20 rounded-full appearance-auto cursor-pointer outline-none accent-sky-400"
            />
          </div>
          
          {/* Mobile Actions (Save/Clear) */}
          <div className="flex md:hidden gap-2">
            <button 
              onClick={saveCanvas}
              className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg active:scale-95"
              aria-label="Save"
            >
              <Camera size={20} />
            </button>
            <button 
              onClick={clearCanvas}
              className="p-2 bg-rose-500 rounded-xl text-white shadow-lg active:scale-95"
              aria-label="Clear"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 m-2 md:m-4 mt-0 rounded-[24px] md:rounded-[40px] overflow-hidden border-2 md:border-4 border-white/5 shadow-inner" />

        {/* Task Objective Badge */}
        {activeTask && activeTask.type === 'drawing' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-amber-400 text-white rounded-full font-black shadow-[0_4px_20px_rgba(251,191,36,0.3)] border-2 border-white/20 animate-bounce">
            GOAL: DRAW A {activeTask.content.toUpperCase()}
          </div>
        )}
      </div>

      {activeTask && (
        <TaskSuccessOverlay 
          isVisible={showSuccess}
          onClose={() => setShowSuccess(false)}
          title={activeTask.title}
        />
      )}
    </div>
  );
};

interface ToolButtonProps {
  id?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const ToolButton = ({ id, active, onClick, icon, label, color }: ToolButtonProps) => (
  <button
    id={id}
    onClick={onClick}
    className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${active ? `${color} text-white shadow-xl scale-110` : 'hover:bg-white/10 text-white/60'}`}
  >
    {icon}
    <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
      {label}
    </span>
  </button>
);
