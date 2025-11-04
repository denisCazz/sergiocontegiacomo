export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const email = payload?.email?.toString().trim();

    if (!email) {
      return new Response(JSON.stringify({ success: false, message: 'Email mancante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: integra con provider esterno (Mailchimp, Brevo, ConvertKit...)
    console.info('[newsletter] nuova iscrizione', email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[newsletter] errore generale', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
