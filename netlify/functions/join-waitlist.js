exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request body' }) };
  }

  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid email' }) };
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({ email, listIds: [3], updateEnabled: true }),
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (res.ok || res.status === 204) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (data.code === 'duplicate_parameter') {
    return { statusCode: 200, body: JSON.stringify({ duplicate: true }) };
  }

  return {
    statusCode: res.status,
    body: JSON.stringify({ message: data.message || 'Unknown error' }),
  };
};
