'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from '@/ai/flows/payment-flow';

interface Plan {
    name: string;
    price: number;
    priceString: string;
    description: string;
}

interface GooglePayButtonProps {
    plan: Plan;
}

const GooglePayButton: React.FC<GooglePayButtonProps> = ({ plan }) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleCheckout = async () => {
        try {
            const { checkoutUrl } = await createCheckoutSession({
                planName: plan.name,
                amount: plan.price,
                description: plan.description,
            });

            if (checkoutUrl) {
                // Redirect to Stripe's checkout page
                window.location.href = checkoutUrl;
            } else {
                throw new Error("No se pudo crear la sesión de pago.");
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            toast({
                variant: 'destructive',
                title: 'Error al Pagar',
                description: 'No se pudo iniciar el proceso de pago. Por favor, inténtalo de nuevo.',
            });
        }
    };


    useEffect(() => {
        if (typeof window === 'undefined' || window.self !== window.top) {
            return;
        }

        if (!(window as any).google || !(window as any).google.payments) {
            console.warn("Google Pay script not loaded.");
            return;
        }

        const googlePayClient = new (window as any).google.payments.api.PaymentsClient({
            environment: 'TEST',
        });

        const baseCardPaymentMethod = {
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['MASTERCARD', 'VISA'],
            },
        };
        
        try {
            googlePayClient.isReadyToPay({
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [baseCardPaymentMethod],
            }).then((response: { result: any; }) => {
                if (response.result && buttonRef.current) {
                    const button = googlePayClient.createButton({
                        onClick: handleCheckout,
                        buttonColor: 'default',
                        buttonType: 'buy', 
                        buttonSizeMode: 'fill',
                        buttonLocale: 'es', // Set button language to Spanish
                    });
                    buttonRef.current.appendChild(button);
                }
            }).catch((err: any) => {
                console.error('Google Pay isReadyToPay check failed:', err);
            });
        } catch (err) {
             console.error('Error initializing Google Pay button. This can happen in non-secure or iframe contexts:', err);
        }

        return () => {
            if (buttonRef.current) {
                buttonRef.current.innerHTML = '';
            }
        };
    }, [plan, toast]);

    return <div ref={buttonRef} className="w-full"></div>;
};

export default GooglePayButton;
