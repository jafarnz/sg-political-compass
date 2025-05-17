import React, { useEffect, useRef } from 'react';
import { parties, Party, getQuadrantDescription } from '../data/parties';

interface PoliticalCompassProps {
  economicScore: number; // -10 to 10
  socialScore: number;   // -10 to 10
  userPartyScores?: {
    pap: number;
    wp: number;
    sdp: number;
    psp: number;
  };
}

const PoliticalCompass: React.FC<PoliticalCompassProps> = ({ economicScore, socialScore, userPartyScores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const partyImagesLoaded = useRef<Record<string, HTMLImageElement | null>>({});
  
  // Preload all party logo images
  useEffect(() => {
    const loadPartyImages = async () => {
      const imagePromises = parties.map(party => {
        return new Promise<[string, HTMLImageElement | null]>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve([party.id, img]);
          img.onerror = () => {
            console.warn(`Failed to load image for ${party.name}, using fallback`);
            resolve([party.id, null]); // Resolve with null to indicate fallback needed
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
  
  // Function to draw the compass
  const drawCompass = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = width / 25; // Scale for converting -10..10 to pixel coordinates
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fill background with different colors for each quadrant
    ctx.globalAlpha = 0.1;
    // Authoritarian Right (top right)
    ctx.fillStyle = '#FF9999';
    ctx.fillRect(centerX, 0, width/2, height/2);
    // Authoritarian Left (top left)
    ctx.fillStyle = '#FF99FF';
    ctx.fillRect(0, 0, width/2, height/2);
    // Libertarian Left (bottom left)
    ctx.fillStyle = '#99FF99';
    ctx.fillRect(0, height/2, width/2, height/2);
    // Libertarian Right (bottom right)
    ctx.fillStyle = '#9999FF';
    ctx.fillRect(centerX, height/2, width/2, height/2);
    ctx.globalAlpha = 1.0;
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = -10; x <= 10; x += 2) {
      ctx.beginPath();
      const xPos = centerX + x * scale;
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = -10; y <= 10; y += 2) {
      ctx.beginPath();
      const yPos = centerY + y * scale;
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.stroke();
    }
    
    // Draw x and y axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels
    ctx.fillText('Economic Left', width * 0.25, centerY - 10);
    ctx.fillText('Economic Right', width * 0.75, centerY - 10);
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillText('Authoritarian', centerX - 10, height * 0.1);
    ctx.textAlign = 'left';
    ctx.fillText('Libertarian', centerX + 10, height * 0.9);
    
    // Draw quadrant labels
    ctx.font = '14px Arial';
    ctx.globalAlpha = 0.7;
    ctx.fillText('Authoritarian Right', width * 0.75, height * 0.25);
    ctx.textAlign = 'right';
    ctx.fillText('Authoritarian Left', width * 0.25, height * 0.25);
    ctx.fillText('Libertarian Left', width * 0.25, height * 0.75);
    ctx.textAlign = 'left';
    ctx.fillText('Libertarian Right', width * 0.75, height * 0.75);
    ctx.globalAlpha = 1.0;
    
    // Plot party positions
    parties.forEach((party) => {
      const x = centerX + party.economicPosition * scale;
      const y = centerY - party.socialPosition * scale; // Invert Y-axis
      
      const partyImage = partyImagesLoaded.current[party.id];
      const logoSize = 24; // Size of the logo on the canvas
      
      if (partyImage) {
        // Draw party logo image
        try {
          ctx.save();
          // Draw a white background circle for the logo
          ctx.beginPath();
          ctx.arc(x, y, logoSize/2 + 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
          
          // Draw the logo
          ctx.drawImage(
            partyImage, 
            x - logoSize/2, 
            y - logoSize/2, 
            logoSize, 
            logoSize
          );
          ctx.restore();
        } catch (e) {
          // Fallback to colored circle if image drawing fails
          drawFallbackPartyMarker(ctx, x, y, party);
        }
      } else {
        // Fallback to colored circle if image not loaded
        drawFallbackPartyMarker(ctx, x, y, party);
      }
      
      // Add party name above the marker
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(party.shortName, x, y - logoSize/2 - 5);
    });
    
    // Draw user position
    if (economicScore !== undefined && socialScore !== undefined) {
      const userX = centerX + economicScore * scale;
      const userY = centerY - socialScore * scale; // Invert Y-axis
      
      // Draw user marker (larger than party markers)
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(userX, userY, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add "YOU" label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', userX, userY + 4);
    }
  };
  
  // Fallback function to draw a colored circle if image loading fails
  const drawFallbackPartyMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, party: Party) => {
    ctx.fillStyle = party.color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fill();
  };

  useEffect(() => {
    // Set canvas dimensions based on container size
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Make the canvas a square
      const size = Math.min(window.innerWidth * 0.8, 600);
      canvas.width = size;
      canvas.height = size;
    }
    
    drawCompass();
    
    // Redraw on window resize
    const handleResize = () => {
      if (canvasRef.current) {
        const size = Math.min(window.innerWidth * 0.8, 600);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        drawCompass();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [economicScore, socialScore]);

  // Find the quadrant the user is in
  const userQuadrant = getQuadrantDescription(economicScore, socialScore);

  // Find closest party by scores (if available)
  let closestParty: Party | undefined;
  if (userPartyScores) {
    const scores = Object.entries(userPartyScores);
    scores.sort((a, b) => b[1] - a[1]);
    const closestPartyId = scores[0][0];
    closestParty = parties.find(p => p.id === closestPartyId);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Political Compass</h2>
        
        <canvas 
          ref={canvasRef} 
          className="mx-auto border border-gray-300 rounded"
        />
        
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Your Position</h3>
          <p className="mb-4">
            You are in the <strong>{userQuadrant}</strong> quadrant.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <h4 className="font-medium">Economic: {economicScore.toFixed(1)}</h4>
              <p className="text-sm">
                {economicScore < 0 ? "Left-Leaning" : "Right-Leaning"}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <h4 className="font-medium">Social: {socialScore.toFixed(1)}</h4>
              <p className="text-sm">
                {socialScore < 0 ? "Libertarian" : "Authoritarian"}
              </p>
            </div>
          </div>
          
          {closestParty && (
            <div className="mt-4">
              <p className="flex items-center justify-center gap-2 mb-2">
                Your views most closely align with the 
                <span className="inline-flex items-center">
                  <span className="w-6 h-6 mr-1 rounded-full flex items-center justify-center overflow-hidden bg-white relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={closestParty.logoPath} 
                      alt={`${closestParty.name} logo`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to colored background with initials
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = closestParty!.color;
                        target.parentElement!.textContent = closestParty!.shortName[0];
                      }}
                    />
                  </span>
                  <strong style={{ color: closestParty.color }}>{closestParty.name}</strong>
                </span>
              </p>
              <p className="text-sm mt-2">{closestParty.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoliticalCompass; 