'use client';

import React, { useEffect, useRef, useState } from 'react';
import { parties, Party, getQuadrantName, getQuadrantDescription, calculatePartyDistances, getPartyPosition } from '../data/parties';
import { AXIS_RANGE } from '../data/axes';

interface PoliticalCompassProps {
  economicScore: number;
  socialScore: number;
  userPartyScores?: {
    pap: number;
    wp: number;
    psp: number;
    sdp: number;
  };
  closestPartyId?: string;
  showLabels?: boolean;
  interactive?: boolean;
}

const PoliticalCompass: React.FC<PoliticalCompassProps> = ({ 
  economicScore, 
  socialScore, 
  userPartyScores,
  closestPartyId,
  showLabels = true,
  interactive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const partyImagesLoaded = useRef<Record<string, HTMLImageElement | null>>({});
  const [hoveredParty, setHoveredParty] = useState<Party | null>(null);
  const [canvasSize, setCanvasSize] = useState(800);
  
  // Preload all party logo images
  useEffect(() => {
    const loadPartyImages = async () => {
      const imagePromises = parties.map(party => {
        return new Promise<[string, HTMLImageElement | null]>((resolve) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve([party.id, img]);
          img.onerror = () => {
            console.warn(`Failed to load image for ${party.name}, using fallback`);
            resolve([party.id, null]);
          };
          img.src = party.logoPath;
        });
      });
      
      try {
        const loadedImages = await Promise.all(imagePromises);
        const imagesMap: Record<string, HTMLImageElement | null> = {};
        loadedImages.forEach(([id, img]) => {
          imagesMap[id] = img;
        });
        partyImagesLoaded.current = imagesMap;
        drawCompass();
      } catch (error) {
        console.error("Error loading party images:", error);
      }
    };
    
    loadPartyImages();
  }, []);

  const drawCompass = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = canvas.width;
    const padding = 80; // More padding for larger labels
    const gridSize = size - (padding * 2);
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = gridSize / 20; // -10 to 10 = 20 units
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    
    // Draw gradient background for each quadrant
    ctx.globalAlpha = 0.35;
    
    // Authoritarian Right (top right) - Red
    const gradAR = ctx.createRadialGradient(
      centerX + gridSize/4, centerY - gridSize/4, 0,
      centerX + gridSize/4, centerY - gridSize/4, gridSize/2
    );
    gradAR.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
    gradAR.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    ctx.fillStyle = gradAR;
    ctx.fillRect(centerX, padding, gridSize/2, gridSize/2);
    
    // Authoritarian Left (top left) - Purple
    const gradAL = ctx.createRadialGradient(
      centerX - gridSize/4, centerY - gridSize/4, 0,
      centerX - gridSize/4, centerY - gridSize/4, gridSize/2
    );
    gradAL.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
    gradAL.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
    ctx.fillStyle = gradAL;
    ctx.fillRect(padding, padding, gridSize/2, gridSize/2);
    
    // Libertarian Left (bottom left) - Green
    const gradLL = ctx.createRadialGradient(
      centerX - gridSize/4, centerY + gridSize/4, 0,
      centerX - gridSize/4, centerY + gridSize/4, gridSize/2
    );
    gradLL.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
    gradLL.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
    ctx.fillStyle = gradLL;
    ctx.fillRect(padding, centerY, gridSize/2, gridSize/2);
    
    // Libertarian Right (bottom right) - Blue
    const gradLR = ctx.createRadialGradient(
      centerX + gridSize/4, centerY + gridSize/4, 0,
      centerX + gridSize/4, centerY + gridSize/4, gridSize/2
    );
    gradLR.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradLR.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
    ctx.fillStyle = gradLR;
    ctx.fillRect(centerX, centerY, gridSize/2, gridSize/2);
    
    ctx.globalAlpha = 1.0;
    
    // Draw grid lines with numbers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '12px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // Draw major grid lines every 2 units with labels
    for (let i = -10; i <= 10; i += 2) {
      const x = centerX + i * scale;
      const y = centerY - i * scale;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, size - padding);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(size - padding, y);
      ctx.stroke();
      
      // X-axis labels (bottom)
      if (i !== 0) {
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x, size - padding + 20);
      }
      
      // Y-axis labels (left)
      if (i !== 0) {
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), padding - 10, centerY - i * scale + 4);
      }
    }
    
    // Draw minor grid lines every 1 unit (lighter)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = -10; i <= 10; i += 1) {
      if (i % 2 === 0) continue; // Skip major lines
      const x = centerX + i * scale;
      const y = centerY - i * scale;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, size - padding);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(size - padding, y);
      ctx.stroke();
    }
    
    // Draw main axes with glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(size - padding, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, size - padding);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Draw axis arrows
    const arrowSize = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(size - padding + 5, centerY);
    ctx.lineTo(size - padding - arrowSize + 5, centerY - arrowSize / 2);
    ctx.lineTo(size - padding - arrowSize + 5, centerY + arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(padding - 5, centerY);
    ctx.lineTo(padding + arrowSize - 5, centerY - arrowSize / 2);
    ctx.lineTo(padding + arrowSize - 5, centerY + arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(centerX, padding - 5);
    ctx.lineTo(centerX - arrowSize / 2, padding + arrowSize - 5);
    ctx.lineTo(centerX + arrowSize / 2, padding + arrowSize - 5);
    ctx.closePath();
    ctx.fill();
    
    // Bottom arrow
    ctx.beginPath();
    ctx.moveTo(centerX, size - padding + 5);
    ctx.lineTo(centerX - arrowSize / 2, size - padding - arrowSize + 5);
    ctx.lineTo(centerX + arrowSize / 2, size - padding - arrowSize + 5);
    ctx.closePath();
    ctx.fill();
    
    // Draw "0" at origin
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('0', centerX - 8, centerY + 15);
    
    if (showLabels) {
      // Draw axis labels
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Economic axis labels
      ctx.fillText('ECONOMIC LEFT', padding + gridSize * 0.25, centerY + 40);
      ctx.fillText('ECONOMIC RIGHT', padding + gridSize * 0.75, centerY + 40);
      
      // Social axis labels - rotated
      ctx.save();
      ctx.translate(centerX + 40, padding + gridSize * 0.25);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('AUTHORITARIAN', 0, 0);
      ctx.restore();
      
      ctx.save();
      ctx.translate(centerX + 40, padding + gridSize * 0.75);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('LIBERTARIAN', 0, 0);
      ctx.restore();
      
      // Quadrant labels with backgrounds
      ctx.font = '14px "Space Grotesk", system-ui, sans-serif';
      ctx.globalAlpha = 0.8;
      
      // Auth Right
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(centerX + gridSize * 0.25 - 45, padding + 15, 90, 24);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Auth Right', centerX + gridSize * 0.25, padding + 32);
      
      // Auth Left
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.fillRect(centerX - gridSize * 0.25 - 40, padding + 15, 80, 24);
      ctx.fillStyle = '#c4b5fd';
      ctx.fillText('Auth Left', centerX - gridSize * 0.25, padding + 32);
      
      // Lib Left
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.fillRect(centerX - gridSize * 0.25 - 35, size - padding - 35, 70, 24);
      ctx.fillStyle = '#86efac';
      ctx.fillText('Lib Left', centerX - gridSize * 0.25, size - padding - 18);
      
      // Lib Right
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(centerX + gridSize * 0.25 - 40, size - padding - 35, 80, 24);
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('Lib Right', centerX + gridSize * 0.25, size - padding - 18);
      
      ctx.globalAlpha = 1.0;
    }
    
    // Plot party positions (using calculated positions from question data)
    parties.forEach((party) => {
      const partyPos = getPartyPosition(party.id) || { x: 0, y: 0 };
      const x = centerX + partyPos.x * scale;
      const y = centerY - partyPos.y * scale;
      
      // Draw party glow/ring if closest
      if (closestPartyId && party.id === closestPartyId) {
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      const partyImage = partyImagesLoaded.current[party.id];
      const logoSize = 44; // Larger logos
      
      // Draw white background circle
      ctx.beginPath();
      ctx.arc(x, y, logoSize / 2 + 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw colored ring
      ctx.beginPath();
      ctx.arc(x, y, logoSize / 2 + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = party.color;
      ctx.lineWidth = 4;
      ctx.stroke();
      
      if (partyImage) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, logoSize / 2, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(partyImage, x - logoSize / 2, y - logoSize / 2, logoSize, logoSize);
          ctx.restore();
        } catch {
          drawFallbackPartyMarker(ctx, x, y, party, logoSize);
        }
      } else {
        drawFallbackPartyMarker(ctx, x, y, party, logoSize);
      }
      
      // Party name label with background
      if (showLabels) {
        const labelWidth = ctx.measureText(party.shortName).width + 16;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - labelWidth/2, y - logoSize / 2 - 28, labelWidth, 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Space Grotesk", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(party.shortName, x, y - logoSize / 2 - 13);
      }
    });
    
    // Draw user position
    if (economicScore !== undefined && socialScore !== undefined) {
      const userX = centerX + economicScore * scale;
      const userY = centerY - socialScore * scale;
      
      // Pulsing glow effect
      ctx.beginPath();
      ctx.arc(userX, userY, 35, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fill();
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(userX, userY, 28, 0, 2 * Math.PI);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Inner circle
      ctx.beginPath();
      ctx.arc(userX, userY, 22, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // "YOU" text
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU', userX, userY);
      ctx.textBaseline = 'alphabetic';
      
      // Coordinate display
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(userX - 45, userY + 32, 90, 22);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '11px "Space Grotesk", system-ui, sans-serif';
      ctx.fillText(`(${economicScore.toFixed(1)}, ${socialScore.toFixed(1)})`, userX, userY + 46);
    }
    
    // Watermark
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 12px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('SG Political Compass 2025', size - 20, size - 20);
    ctx.globalAlpha = 1.0;
  };
  
  const drawFallbackPartyMarker = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    party: Party,
    size: number
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = party.color;
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size / 2.2}px "Space Grotesk", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(party.shortName[0], x, y);
    ctx.textBaseline = 'alphabetic';
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Much larger minimum and maximum sizes
        const newSize = Math.min(Math.max(containerWidth - 32, 500), 900);
        setCanvasSize(newSize);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasSize;
      canvasRef.current.height = canvasSize;
      drawCompass();
    }
  }, [canvasSize, economicScore, socialScore, closestPartyId]);

  const userQuadrant = getQuadrantName(economicScore, socialScore);
  const quadrantDescription = getQuadrantDescription(economicScore, socialScore);
  const partyDistances = calculatePartyDistances(economicScore, socialScore);

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <div className="compass-container p-4 md:p-8 rounded-2xl w-full" style={{ maxWidth: '950px' }}>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-white">
          Your Political Position
        </h2>
        
        <div className="flex justify-center overflow-x-auto">
          <canvas 
            ref={canvasRef} 
            className="rounded-xl"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              minWidth: '500px'
            }}
          />
        </div>
        
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <span className="text-amber-400 font-semibold text-lg">{userQuadrant}</span>
          </div>
          
          <p className="mt-4 text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
            {quadrantDescription}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
            <div className="score-card p-4 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Economic</div>
              <div className={`text-3xl font-bold ${economicScore < 0 ? 'text-green-400' : 'text-blue-400'}`}>
                {economicScore > 0 ? '+' : ''}{economicScore.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">
                {economicScore < -3 ? 'Left' : economicScore < 0 ? 'Center-Left' : economicScore < 3 ? 'Center-Right' : 'Right'}
              </div>
            </div>
            <div className="score-card p-4 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Social</div>
              <div className={`text-3xl font-bold ${socialScore < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {socialScore > 0 ? '+' : ''}{socialScore.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">
                {socialScore < -3 ? 'Libertarian' : socialScore < 0 ? 'Lean Libertarian' : socialScore < 3 ? 'Lean Authoritarian' : 'Authoritarian'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticalCompass;
