// The visitor's country, from Vercel's own header, so the pricing page can show naira in
// Nigeria and dollars elsewhere. Never cached, so one country's answer is never served to another.

export const config = { runtime: 'edge' }

export default function handler(request: Request) {
  const country = request.headers.get('x-vercel-ip-country')
  return new Response(JSON.stringify({ country }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  })
}
