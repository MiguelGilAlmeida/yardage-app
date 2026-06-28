export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      email,
      listIds: [3],
      updateEnabled: false,
    }),
  });

  if (response.status === 204 || response.status === 201) {
    return res.status(200).json({ success: true });
  }

  const data = await response.json();

  if (response.status === 400 && data.code === 'duplicate_parameter') {
    return res.status(200).json({ duplicate: true });
  }

  return res.status(500).json({ error: data.message || 'Unknown error' });
}
