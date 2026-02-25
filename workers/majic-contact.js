// Majic Auto — Contact Form → GHL Worker
// Deploy via Cloudflare Dashboard: Workers & Pages → Create → paste this code

const GHL_API_KEY = 'pit-511c7353-7803-41aa-a981-54d2f176676c';
const GHL_LOCATION_ID = '5SuaaG48JcFfliApSgF1';
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

const ALLOWED_ORIGINS = [
  'https://majicservice.com',
  'https://www.majicservice.com',
  'https://majicauto.provb3global.com',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'null' // local file:// opens
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin?.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const { first_name, last_name, email, phone, service, vehicle, message } = body;

      // Basic validation
      if (!first_name || !last_name || !email || !phone) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Build notes from service, vehicle, and message
      const noteLines = [];
      if (service) noteLines.push(`Service: ${service}`);
      if (vehicle) noteLines.push(`Vehicle: ${vehicle}`);
      if (message) noteLines.push(`Message: ${message}`);
      const noteBody = noteLines.join('\n');

      // Search for existing contact by email
      const searchRes = await fetch(
        `${GHL_API_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: '2021-07-28',
          },
        }
      );
      const searchData = await searchRes.json();
      let contactId = searchData?.contact?.id || null;

      if (contactId) {
        // Update existing contact
        await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: first_name,
            lastName: last_name,
            phone: phone,
            source: 'Website contact form',
          }),
        });
      } else {
        // Create new contact
        const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            firstName: first_name,
            lastName: last_name,
            email: email,
            phone: phone,
            source: 'Website contact form',
            tags: ['website lead'],
          }),
        });
        const createData = await createRes.json();
        contactId = createData?.contact?.id;
      }

      if (!contactId) {
        throw new Error('Failed to create or find contact');
      }

      // Add tag (re-add for existing contacts to trigger workflows)
      await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: ['website lead'] }),
      });

      // Add note with service/vehicle/message details
      if (noteBody) {
        await fetch(`${GHL_API_BASE}/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: noteBody }),
        });
      }

      return new Response(JSON.stringify({ success: true, contactId }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Server error', detail: err.message }), {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
  },
};
