import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface LeadData {
  name: string;
  email: string;
  phone?: string;
  source: string;
  campaign?: string;
  notes?: string;
}

/**
 * HTTP Cloud Function to capture leads from landing pages
 * Adds lead to Firestore and triggers email with sales deck
 */
export const captureLead = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data: LeadData = req.body;

    // Validate required fields
    if (!data.name || !data.email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    // Create lead document matching CRM Lead interface
    const lead = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      status: 'new',
      source: data.source || 'landing-page',
      campaign: data.campaign || '',
      notes: data.notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedTo: null,
      followUpDate: null,
      value: 0,
    };

    // Add to Firestore leads collection
    const docRef = await db.collection('leads').add(lead);

    // Queue email with sales deck (uses Firebase Trigger Email extension if configured)
    // Otherwise, add to mail collection for processing
    await db.collection('mail').add({
      to: data.email,
      template: {
        name: 'sales-deck',
        data: {
          name: data.name,
          deckUrl: 'https://agency.goldbackbond.com/decks/USDGB-Pre-List-Allocation-Deck.pdf',
        },
      },
    });

    console.log(`Lead captured: ${docRef.id} - ${data.email}`);

    res.status(200).json({
      success: true,
      message: 'Lead captured successfully',
      leadId: docRef.id,
    });
  } catch (error) {
    console.error('Error capturing lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
