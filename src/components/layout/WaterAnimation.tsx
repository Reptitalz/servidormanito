
'use client';

import { useRef, useEffect } from 'react';

// Animation settings
const waveAmplitude = 10;
const waveFrequency = 0.01;
const waveSpeed = 0.05;

interface WaterAnimationProps {
    progress?: number; // Progress is optional, from 0 to 100
    isFlipped?: boolean; // If true, water "hangs" from the top
}

export function WaterAnimation({ progress = 100, isFlipped = false }: WaterAnimationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const waveOffsetRef = useRef(0);
    const animationFrameIdRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            if (!canvasRef.current?.parentElement) return;
            canvas.width = canvasRef.current.parentElement.offsetWidth;
            canvas.height = canvasRef.current.parentElement.offsetHeight;
        };

        const draw = () => {
            if (!canvasRef.current || !ctx) return;
            
            const computedStyle = getComputedStyle(document.documentElement);
            const primaryColor = computedStyle.getPropertyValue('--primary').trim();
            const accentColor = computedStyle.getPropertyValue('--accent').trim();

            const CW = canvas.width;
            const CH = canvas.height;
            
            ctx.clearRect(0, 0, CW, CH);

            const waterHeight = CH * (progress / 100);
            const waterY = isFlipped ? waterHeight : CH - waterHeight;

            const gradient = ctx.createLinearGradient(0, isFlipped ? 0 : waterY, 0, isFlipped ? waterY : CH);
            gradient.addColorStop(0, `hsla(${primaryColor.split(' ').join(',')}, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${accentColor.split(' ').join(',')}, 0.6)`);
            gradient.addColorStop(1, `hsla(${primaryColor.split(' ').join(',')}, 0.8)`);
            
            ctx.beginPath();
            
            if (isFlipped) {
                ctx.moveTo(0, 0); 
                ctx.lineTo(0, waterY);
            } else {
                ctx.moveTo(0, CH);
                ctx.lineTo(0, waterY);
            }

            for (let x = 0; x <= CW; x += 1) {
                const y = waterY + waveAmplitude * Math.sin(x * waveFrequency + waveOffsetRef.current);
                ctx.lineTo(x, y);
            }

            if (isFlipped) {
                ctx.lineTo(CW, 0);
            } else {
                ctx.lineTo(CW, CH);
            }
            ctx.closePath();
            
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            if (isFlipped) {
                ctx.moveTo(0, 0);
                ctx.lineTo(0, waterY);
            } else {
                ctx.moveTo(0, CH);
                ctx.lineTo(0, waterY);
            }
            for (let x = 0; x <= CW; x += 1) {
                const y = waterY + (waveAmplitude * 1.2) * Math.sin(x * (waveFrequency * 0.8) + waveOffsetRef.current + 2);
                ctx.lineTo(x, y);
            }
             if (isFlipped) {
                ctx.lineTo(CW, 0);
            } else {
                ctx.lineTo(CW, CH);
            }
            ctx.closePath();
            
            ctx.fillStyle = `hsla(${primaryColor.split(' ').join(',')}, 0.3)`;
            ctx.fill();

            waveOffsetRef.current += waveSpeed;
            animationFrameIdRef.current = requestAnimationFrame(draw);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animationFrameIdRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [progress, isFlipped]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />;
}
