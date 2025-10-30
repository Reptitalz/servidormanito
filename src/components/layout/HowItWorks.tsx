
'use client';

import { motion } from 'framer-motion';
import { Wand2, QrCode, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
    {
        icon: <Wand2 className="w-8 h-8 text-primary" />,
        title: "1. Crea y Personaliza",
        description: "Elige un nombre, una imagen y define la personalidad y habilidades de tu bot. ¿Será un vendedor estrella o un amigable agente de soporte? ¡Tú decides!",
    },
    {
        icon: <QrCode className="w-8 h-8 text-primary" />,
        title: "2. Conecta con WhatsApp",
        description: "Escanea un simple código QR desde la app de WhatsApp en tu teléfono. En segundos, tu asistente estará vinculado y listo para la acción.",
    },
    {
        icon: <Rocket className="w-8 h-8 text-primary" />,
        title: "3. ¡Lanza y Monitorea!",
        description: "Activa tu bot y observa en tiempo real cómo interactúa con tus clientes. Ajusta su comportamiento y mejora su rendimiento sobre la marcha.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
};

const Shape = ({ className }: { className: string }) => (
    <div className={`absolute rounded-full filter blur-2xl -z-10 ${className}`}></div>
);

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 md:py-32 bg-background relative overflow-hidden">
            {/* Animated background shapes */}
            <Shape className="w-64 h-64 bg-primary/20 top-20 left-10 animate-shape1" />
            <Shape className="w-72 h-72 bg-accent/20 bottom-10 right-20 animate-shape2" />
            <Shape className="w-48 h-48 bg-primary/10 top-1/2 left-1/3 animate-shape3" />
            <Shape className="w-56 h-56 bg-accent/10 bottom-1/4 right-1/2 animate-shape4" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                        Tu Aventura IA Comienza en <span className="text-primary">3... 2... 1...</span>
                    </h2>
                    <p className="text-muted-foreground text-lg mb-12">
                        Lanzar tu propio asistente de WhatsApp nunca fue tan fácil y divertido. Sigue estos simples pasos:
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <Card className="text-center h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300 bg-card/80 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {step.icon}
                                    </div>
                                    <CardTitle className="font-headline">{step.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
