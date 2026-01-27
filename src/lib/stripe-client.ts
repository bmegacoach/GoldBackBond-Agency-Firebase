/**
 * Stripe Client Utilities
 * Handles Stripe payment processing on the client side
 */

import { auth } from './firebase/config';

export function redirectToStripeLink(email?: string) {
  // Use payment link from environment
  let link = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

  if (!link) {
    console.error('ERROR: VITE_STRIPE_PAYMENT_LINK not set in .env.local');
    alert('Payment link not configured. Please add VITE_STRIPE_PAYMENT_LINK to .env.local');
    return;
  }

  console.log('=== STRIPE PAYMENT DEBUG ===');
  console.log('Payment Link:', link);
  console.log('Email:', email);
  console.log('Public Key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 30) + '...');
  console.log('Payment Link Mode:', link.includes('buy.stripe.com') ? 'Hosted Link' : 'Direct Link');

  try {
    const url = new URL(link);

    if (email) {
      // Add email to pre-fill the form
      url.searchParams.append('prefilled_email', email);
    }

    // Add client_reference_id if user is logged in
    const user = auth.currentUser;
    if (user) {
      url.searchParams.append('client_reference_id', user.uid);
      console.log('Added client_reference_id:', user.uid);
    }

    console.log('Redirecting to Stripe...');
    window.location.href = url.toString();
  } catch (err) {
    console.error('Error redirecting to payment link:', err);
    alert('Error: Invalid payment link URL');
  }
}
