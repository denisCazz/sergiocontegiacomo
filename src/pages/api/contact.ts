export const prerender = false;

import { brevoRequest, isValidEmail } from '../../lib/brevo';

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const nome = payload?.nome?.toString().trim();
    const cognome = payload?.cognome?.toString().trim();
    const email = payload?.email?.toString().trim();
    const telefono = payload?.telefono?.toString().trim();
    const messaggio = payload?.messaggio?.toString().trim();
    const privacy = payload?.privacy;

    if (!nome || !cognome || !email) {
      return new Response(JSON.stringify({ success: false, message: 'Compila nome, cognome ed email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!privacy) {
      return new Response(JSON.stringify({ success: false, message: 'Devi accettare la privacy' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Email non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullName = `${nome} ${cognome}`.trim();
    const recipientEmail =
      import.meta.env.BREVO_CONTACT_RECIPIENT_EMAIL?.toString().trim() ||
      import.meta.env.CONTACT_RECIPIENT_EMAIL?.toString().trim() ||
      'info@sergiocontegiacomo.it';
    const recipientName = import.meta.env.BREVO_CONTACT_RECIPIENT_NAME?.toString().trim() || 'Sergio';

    const senderEmail = import.meta.env.BREVO_SENDER_EMAIL?.toString().trim() || recipientEmail;
    const senderName = import.meta.env.BREVO_SENDER_NAME?.toString().trim() || 'Sito web';

    const listIdRaw = import.meta.env.BREVO_CONTACT_LIST_ID?.toString().trim();
    const listId = listIdRaw ? Number(listIdRaw) : undefined;

    // Per evitare errori Brevo/duplicati: NON usare l'attributo standard "SMS".
    // Se vuoi salvare il telefono sul contatto, crea un attributo testuale in Brevo (es. TELEFONO)
    // e imposta qui la chiave.
    const phoneAttributeKey = import.meta.env.BREVO_CONTACT_PHONE_ATTRIBUTE?.toString().trim();

    const safeMessage = messaggio?.slice(0, 5000) || '';

    // Salva/aggiorna il contatto in Brevo così rimane “storico” lato piattaforma.
    const attributes: Record<string, unknown> = {
      FIRSTNAME: nome,
      LASTNAME: cognome,
    };

    if (phoneAttributeKey && telefono) {
      attributes[phoneAttributeKey] = telefono;
    }

    const contactResult = await brevoRequest('/contacts', {
      method: 'POST',
      body: {
        email,
        updateEnabled: true,
        listIds: listId ? [listId] : undefined,
        attributes,
      },
    });

    if (!(contactResult.status >= 200 && contactResult.status < 300)) {
      // Non blocchiamo il form: l'email a Sergio è la cosa più importante.
      // Questo tipicamente fallisce se hai configurato un attributo inesistente.
      console.error('[contact] errore brevo (contacts) - continuo con invio email', contactResult.status, contactResult.errorText);
    }

    const subject = `Nuovo contatto dal sito: ${fullName}`;
    const htmlContent = `
      <h2>Nuovo messaggio dal sito</h2>
      <p><strong>Nome:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${telefono ? `<p><strong>Telefono:</strong> ${escapeHtml(telefono)}</p>` : ''}
      ${safeMessage ? `<p><strong>Messaggio:</strong><br/>${escapeHtml(safeMessage).replace(/\n/g, '<br/>')}</p>` : ''}
      <hr/>
      <p><strong>Dati form (raw):</strong></p>
      <pre style="white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
${escapeHtml(
  [
    `nome=${nome}`,
    `cognome=${cognome}`,
    `email=${email}`,
    `telefono=${telefono || ''}`,
    `privacy=accepted`,
    `messaggio=${safeMessage || ''}`,
  ].join('\n'),
)}
      </pre>
      <hr/>
      <p><small>Fonte: pagina Contatti</small></p>
    `.trim();

    const mailResult = await brevoRequest('/smtp/email', {
      method: 'POST',
      body: {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: recipientEmail, name: recipientName }],
        replyTo: { email, name: fullName },
        subject,
        htmlContent,
      },
    });

    if (!(mailResult.status >= 200 && mailResult.status < 300)) {
      console.error('[contact] errore brevo (smtp)', mailResult.status, mailResult.errorText);
      return new Response(JSON.stringify({ success: false, message: 'Errore durante invio email' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3) Salva anche il testo del form nel CRM come Nota collegata al contatto (max 3000 chars)
    // Recupero l'ID contatto via GET /contacts/{identifier}
    const infoResult = await brevoRequest<{ id?: number }>(`/contacts/${encodeURIComponent(email)}`, {
      method: 'GET',
    });

    const contactId = infoResult.data?.id;
    if (contactId) {
      const noteText = buildNoteText({ nome, cognome, email, telefono, messaggio: safeMessage });
      const noteResult = await brevoRequest('/crm/notes', {
        method: 'POST',
        body: {
          contactIds: [contactId],
          text: noteText,
        },
      });

      if (!(noteResult.status >= 200 && noteResult.status < 300)) {
        // Non blocchiamo la richiesta: mail già inviata e contatto salvato.
        console.error('[contact] errore brevo (crm note)', noteResult.status, noteResult.errorText);
      }
    } else {
      console.error('[contact] impossibile recuperare contactId per nota', infoResult.status, infoResult.errorText);
    }

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

function buildNoteText(input: {
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  messaggio?: string;
}): string {
  const lines = [
    'Contatti — nuovo messaggio',
    '',
    `Nome: ${input.nome} ${input.cognome}`.trim(),
    `Email: ${input.email}`,
    input.telefono ? `Telefono: ${input.telefono}` : undefined,
    'Privacy: accettata',
    '',
    'Messaggio:',
    (input.messaggio || '').trim() || '(vuoto)',
  ].filter(Boolean) as string[];

  // Brevo CRM note: 1..3000
  const text = lines.join('\n').trim();
  return text.length > 3000 ? `${text.slice(0, 2997)}...` : text;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

