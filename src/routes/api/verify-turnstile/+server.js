import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { token } = await request.json();
  const cfSecret = import.meta.env.VITE_CF_SECRET;
//   console.log('Cloudflare Secret:', cfSecret);

  
  if (!cfSecret) {
    return json({ success: false, error: 'missing-secret' }, { status: 400 });
  }


  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        response: token,
        secret: cfSecret,
      }),
    }
  );

  const data = await response.json();

  return json({
    success: data.success,
    error: data['error-codes']?.length ? data['error-codes'][0] : null,
  });
}