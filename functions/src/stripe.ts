import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

const db = admin.firestore();

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
        res.status(400).send('Missing signature or secret');
        return;
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (userId) {
            try {
                // Update user's subscription status
                await db.collection('users').doc(userId).update({
                    subscription_active: true,
                    subscription_tier: 'professional',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Create Staking Record for Treasury
                await db.collection('staking_records').add({
                    customerId: userId,
                    amount: session.amount_total ? session.amount_total / 100 : 0, // Convert cents to dollars
                    leverage: 3, // Default to 3:1 as per USP
                    collateralUsed: session.amount_total ? session.amount_total / 100 : 0,
                    accruedRewards: 0,
                    status: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    currency: session.currency,
                    stripeSessionId: session.id
                });

                console.log(`Successfully updated subscription and created staking record for user ${userId}`);
            } catch (error) {
                console.error('Error updating user subscription/staking:', error);
            }
        } else {
            console.warn('No client_reference_id found in session');
        }
    }

    res.json({ received: true });
});
