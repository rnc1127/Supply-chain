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
    // We select just the fields needed for analytics to reduce bandwidth
    const { data, error } = await supabase
      .from('disruptions')
      .select('id, created_at, supplier_name, rating, response_time_ms')
      .order('created_at', { ascending: false })
      .limit(500); // safety cap

    if (error) {
      throw error;
    }

    // Perform basic high-level server-side stats calculation
    let totalCount = data.length;
    let sumRatings = 0;
    let countRatings = 0;
    let sumResponseTime = 0;

    data.forEach(item => {
      if (item.rating !== null && item.rating !== undefined) {
        sumRatings += item.rating;
        countRatings++;
      }
      if (item.response_time_ms) {
        sumResponseTime += item.response_time_ms;
      }
    });

    const averageRating = countRatings > 0 ? parseFloat((sumRatings / countRatings).toFixed(2)) : 0;
    const averageResponseTime = totalCount > 0 ? Math.round(sumResponseTime / totalCount) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalGenerations: totalCount,
        averageRating,
        averageResponseTimeMs: averageResponseTime,
        ratedCount: countRatings
      },
      raw: data
    });
  } catch (err) {
    console.error('Analytics aggregation error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
};
