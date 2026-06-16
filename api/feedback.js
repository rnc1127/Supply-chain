const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

module.exports = async (req, res) => {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client is not configured.' });
  }

  const { id, rating, comment } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Disruption ID (id) is required.' });
  }

  if (rating === undefined && !comment) {
    return res.status(400).json({ error: 'At least rating or comment must be provided.' });
  }

  try {
    const updateData = {};
    if (rating !== undefined) {
      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      }
      updateData.rating = parsedRating;
    }
    if (comment !== undefined) {
      updateData.feedback_comment = comment;
    }

    const { data, error } = await supabase
      .from('disruptions')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Disruption record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback updated successfully.',
      disruption: data[0]
    });
  } catch (err) {
    console.error('Feedback update error:', err);
    return res.status(500).json({ error: 'Failed to update feedback.' });
  }
};
