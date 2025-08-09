import { Router } from 'express';
import { getSupabase } from '../utils/supabase';
import { auth, AuthRequest } from '../middleware/auth';

export const router = Router();

// Get all payments for user
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    res.json(payments || []);
  } catch (error) {
    console.error('Error in GET /payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new payment
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }
    const { title, amount, due_date, description, category } = req.body;

    if (!title || !amount || !due_date) {
      return res.status(400).json({ error: 'Title, amount, and due_date are required' });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        title,
        amount,
        due_date,
        description,
        category,
        paid_at: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return res.status(500).json({ error: 'Failed to create payment' });
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error in POST /payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark payment as paid
router.patch('/:id/paid', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ paid_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking payment as paid:', error);
      return res.status(500).json({ error: 'Failed to mark payment as paid' });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error in PATCH /payments/:id/paid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete payment
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not available' });
    }
    const { id } = req.params;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting payment:', error);
      return res.status(500).json({ error: 'Failed to delete payment' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /payments/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Detect payment from text
router.post('/detect', auth, async (req: AuthRequest, res) => {
  try {
    const { text, source } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple AI-like payment detection logic
    const paymentInfo = detectPaymentFromText(text, source);

    if (paymentInfo) {
      res.json({
        detected: true,
        payment: paymentInfo
      });
    } else {
      res.json({
        detected: false,
        message: 'No payment information detected in the text'
      });
    }
  } catch (error) {
    console.error('Error in POST /payments/detect:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to detect payment information from text
function detectPaymentFromText(text: string, source: string = 'manual') {
  const lowerText = text.toLowerCase();
  
  // Look for amount patterns
  const amountMatch = text.match(/\$([0-9]+(?:\.[0-9]{2})?)/g);
  if (!amountMatch) return null;
  
  const amount = amountMatch[0];
  
  // Look for due date patterns
  const datePatterns = [
    /due\s+(?:on\s+)?([a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i,
    /by\s+([a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i,
    /before\s+([a-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  let dueDate = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      dueDate = match[1] || match[0];
      break;
    }
  }
  
  // If no due date found, default to 30 days from now
  if (!dueDate) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    dueDate = futureDate.toISOString().split('T')[0];
  }
  
  // Look for service/company name
  const servicePatterns = [
    /(?:from|for)\s+([a-z\s]+?)(?:\s+(?:bill|payment|invoice|charge))/i,
    /([a-z\s]+?)\s+(?:bill|payment|invoice|charge)/i,
    /your\s+([a-z\s]+?)\s+(?:account|service)/i
  ];
  
  let title = 'Payment';
  for (const pattern of servicePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      break;
    }
  }
  
  // Common service names
  const commonServices = ['netflix', 'spotify', 'amazon', 'apple', 'google', 'microsoft', 'insurance', 'internet', 'phone', 'electric', 'gas', 'water', 'rent', 'mortgage'];
  for (const service of commonServices) {
    if (lowerText.includes(service)) {
      title = service.charAt(0).toUpperCase() + service.slice(1);
      break;
    }
  }
  
  return {
    title: `${title} Payment`,
    amount,
    dueDate,
    description: `Detected from ${source}: ${text.substring(0, 100)}...`,
    category: 'detected',
    source
  };
}