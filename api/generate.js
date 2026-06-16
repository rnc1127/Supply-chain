const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Initialize Groq Client
const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  const { admin, supplier, inputs } = req.body;

  if (!admin || !supplier || !inputs) {
    return res.status(400).json({ error: 'All fields (admin, supplier, inputs) are required.' });
  }

  if (!groq) {
    return res.status(500).json({ error: 'Groq API client is not configured on the server. Please check GROQ_API_KEY environment variable.' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client is not configured on the server. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.' });
  }

  const startTime = Date.now();

  try {
    const systemPrompt = `You are an expert supply chain analyst and assistant for Manikanta Enterprises, a goods distribution and supply company in Hyderabad. Your job is to analyze supplier notifications regarding delays or shortages and generate a structured Supply Chain Disruption Summary.

Your summary must contain the following four sections:
1. Executive Summary: A concise overview of the supply disruption (what is delayed/shortaged, why, and for how long).
2. Customer Impact: A detailed assessment of how this affects retail dealers, shopkeepers, and institutional buyers (credit and repeat-order customers in Hyderabad).
3. Affected Orders: Estimation of which orders or categories of goods are impacted (e.g. pending shipments, credit cycles, repeat-orders).
4. Recommended Actions: Immediate, concrete steps for Manikanta Enterprises management to take (e.g., proactive communication scripts, alternative sourcing options, inventory reallocation).

Format your response in clean, professional markdown. Use bullet points, bold text, and icons/emoji for key details. Do not include any introductory or concluding pleasantries; start directly with the title.`;

    const userPrompt = `Supplier Name: ${supplier}
Submitted By Admin: ${admin}
Raw Supplier Communication / Delay Notice:
"""
${inputs}
"""

Generate the disruption report for Manikanta Enterprises:`;

    // Call Groq API using Llama 3.3 70b
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    });

    const aiOutput = completion.choices[0]?.message?.content || '';
    const responseTimeMs = Date.now() - startTime;

    // Save to Supabase disruptions table
    const { data, error } = await supabase
      .from('disruptions')
      .insert([
        {
          admin_name: admin,
          supplier_name: supplier,
          raw_input: inputs,
          ai_output: aiOutput,
          prompt_version: 'v4',
          response_time_ms: responseTimeMs,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      // We still return the AI output even if saving to DB fails, so the app remains usable.
      return res.status(200).json({
        success: true,
        aiOutput,
        responseTimeMs,
        dbWarning: 'Could not log disruption record to database.'
      });
    }

    const savedRecord = data[0];

    return res.status(200).json({
      success: true,
      id: savedRecord.id,
      aiOutput,
      responseTimeMs,
      createdAt: savedRecord.created_at
    });

  } catch (apiError) {
    console.error('Groq/Supabase API error:', apiError);
    return res.status(500).json({ error: 'Failed to generate AI response. Details: ' + apiError.message });
  }
};
