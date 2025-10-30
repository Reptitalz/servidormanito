
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { WaterAnimation } from '@/components/layout/WaterAnimation';

export default function CreatingAssistantPage() {
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [displayText, setDisplayText] = useState("Inicializando...");

    useEffect(() => {
        const statuses = [
            { p: 0, text: "Inicializando motor IA..." },
            { p: 25, text: "Configurando personalidad del bot..." },
            { p: 50, text: "Asignando habilidades..." },
            { p: 75, text: "Realizando pruebas finales..." },
            { p: 100, text: "¡Listo para la acción!" },
        ];

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 0.5;
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        router.push('/dashboard/asistentes');
                    }, 1000);
                    return 100;
                }

                const currentStatus = statuses.find((s, i) => {
                    const nextStatus = statuses[i + 1];
                    return newProgress >= s.p && (!nextStatus || newProgress < nextStatus.p);
                });
                if (currentStatus) {
                    setDisplayText(currentStatus.text);
                }

                return newProgress;
            });
        }, 50); // Adjust speed of progress

        return () => clearInterval(progressInterval);
    }, [router]);

    return (
        <>
            <div className="absolute inset-0 z-0 w-full h-full bg-gray-900">
              <WaterAnimation progress={progress} />
            </div>
            
            <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Bot className="h-16 w-16 mb-4 animate-bounce" />
                <h1 className="text-2xl font-bold font-headline mb-2 flex items-center gap-3">
                    Generando Bot
                    <Sparkles className="h-6 w-6 animate-ping" />
                </h1>
                <p className="text-base text-white/80 transition-opacity duration-300">
                    {displayText}
                </p>
                <div className="w-48 h-2 bg-white/20 rounded-full mt-8 overflow-hidden">
                     <div
                        className="h-full bg-white rounded-full animated-gradient"
                        style={{
                            width: `${progress}%`,
                            transition: 'width 0.1s linear',
                        }}
                    ></div>
                </div>
                 <p className="text-2xl font-bold mt-4 font-mono">{Math.round(progress)}%</p>
            </motion.div>
        </>
    );
}
