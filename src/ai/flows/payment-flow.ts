
'use server';
/**
 * @fileOverview A Genkit flow for handling payment processing with Stripe.
 *
 * - createCheckoutSession: Creates a Stripe Checkout session and returns the URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Stripe from 'stripe';

// Ensure the Stripe secret key is set in environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Define the input schema for creating a checkout session
const CheckoutInputSchema = z.object({
  planName: z.string().describe('The name of the plan being purchased.'),
  amount: z.number().describe('The price of the plan in the smallest currency unit (e.g., cents).'),
  description: z.string().describe('A description for the checkout page.'),
});
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

// Define the output schema for the checkout session
const CheckoutOutputSchema = z.object({
  checkoutUrl: z.string().describe('The URL for the Stripe Checkout session.'),
});
export type CheckoutOutput = z.infer<typeof CheckoutOutputSchema>;

/**
 * Creates a Stripe checkout session.
 * @param input The details of the plan to purchase.
 * @returns An object containing the checkout URL.
 */
export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput> {
  return createCheckoutSessionFlow(input);
}


const createCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'createCheckoutSessionFlow',
    inputSchema: CheckoutInputSchema,
    outputSchema: CheckoutOutputSchema,
  },
  async (input) => {
    // Note: For a real application, you would pass a customer ID from your database
    // and store the checkout session ID.

    const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'gpay'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: input.planName,
              description: input.description,
            },
            unit_amount: input.amount * 100, // Stripe expects the amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/dashboard/credits`,
    });

    if (!session.url) {
      throw new Error('Could not create Stripe checkout session.');
    }

    return {
      checkoutUrl: session.url,
    };
  }
);
