
'use client';

import { useRef, useEffect } from 'react';

// Animation settings
const waveAmplitude = 10;
const waveFrequency = 0.01;
const waveSpeed = 0.05;

interface WaterAnimationProps {
    progress?: number; // Progress is optional, from 0 to 100
}

export function WaterAnimation({ progress = 100 }: WaterAnimationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const waveOffsetRef = useRef(0);
    const animationFrameIdRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const draw = () => {
            if (!canvasRef.current || !ctx) return;
            
            const computedStyle = getComputedStyle(document.documentElement);
            const primaryColor = computedStyle.getPropertyValue('--primary').trim();
            const accentColor = computedStyle.getPropertyValue('--accent').trim();

            const CW = canvas.width;
            const CH = canvas.height;

            // 1. Clear the Canvas
            ctx.clearRect(0, 0, CW, CH);

            // 2. Draw the Water
            const waterHeight = CH * (progress / 100);
            const waterY = CH - waterHeight;

            // Create a gradient for the water
            const gradient = ctx.createLinearGradient(0, waterY, 0, CH);
            gradient.addColorStop(0, `hsla(${primaryColor.split(' ').join(',')}, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${accentColor.split(' ').join(',')}, 0.6)`);
            gradient.addColorStop(1, `hsla(${primaryColor.split(' ').join(',')}, 0.8)`);
            
            ctx.beginPath();
            ctx.moveTo(0, CH);
            ctx.lineTo(0, waterY);

            for (let x = 0; x <= CW; x += 1) {
                const y = waterY + waveAmplitude * Math.sin(x * waveFrequency + waveOffsetRef.current);
                ctx.lineTo(x, y);
            }

            ctx.lineTo(CW, CH);
            ctx.closePath();
            
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw a second, slightly offset wave for depth
            ctx.beginPath();
            ctx.moveTo(0, CH);
            ctx.lineTo(0, waterY);
            for (let x = 0; x <= CW; x += 1) {
                const y = waterY + (waveAmplitude * 1.2) * Math.sin(x * (waveFrequency * 0.8) + waveOffsetRef.current + 2);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(CW, CH);
            ctx.closePath();
            
            ctx.fillStyle = `hsla(${primaryColor.split(' ').join(',')}, 0.3)`;
            ctx.fill();

            waveOffsetRef.current += waveSpeed;
            animationFrameIdRef.current = requestAnimationFrame(draw);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [progress]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />;
}
