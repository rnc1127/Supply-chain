const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

module.exports = async (req, res) => {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client is not configured.' });
  }

  try {
    const { data, error } = await supabase
      .from('disruptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // safety cap

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      history: data
    });
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve history logs.' });
  }
};
