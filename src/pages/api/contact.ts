export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const nome = payload?.nome?.toString().trim();
    const cognome = payload?.cognome?.toString().trim();
    const email = payload?.email?.toString().trim();
    const messaggio = payload?.messaggio?.toString().trim();

    if (!nome || !email) {
      return new Response(JSON.stringify({ success: false, message: 'Compila nome ed email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.info('[contact] richiesta consulenza', {
      nome,
      cognome,
      email,
      telefono: payload?.telefono,
      messaggio,
    });

    // TODO: invia email o salva nel CRM (es. HubSpot, Notion, Airtable)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[contact] errore generale', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
