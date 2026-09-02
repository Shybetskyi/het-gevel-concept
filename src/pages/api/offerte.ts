import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { SITE } from '../../consts';

export const prerender = false;

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_form' }), { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field in.
  if (form.get('website')) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const aanhef = String(form.get('aanhef') ?? '');
  const voornaam = String(form.get('voornaam') ?? '').trim();
  const achternaam = String(form.get('achternaam') ?? '').trim();
  const straat = String(form.get('straat') ?? '').trim();
  const postcode = String(form.get('postcode') ?? '').trim();
  const plaats = String(form.get('plaats') ?? '').trim();
  const telefoon = String(form.get('telefoon') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const opmerkingen = String(form.get('opmerkingen') ?? '').trim();
  const diensten = form.getAll('diensten').map(String);

  if (!voornaam || !achternaam || !straat || !postcode || !plaats || !telefoon || !email) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400 });
  }

  const files = form.getAll('fotos').filter((f): f is File => f instanceof File && f.size > 0);
  const oversized = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
  if (oversized) {
    return new Response(JSON.stringify({ error: 'file_too_large' }), { status: 400 });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      '[offerte] RESEND_API_KEY ontbreekt — voeg deze toe aan .env om formulierverzending in te schakelen.',
    );
    return new Response(JSON.stringify({ error: 'email_not_configured' }), { status: 503 });
  }

  const resend = new Resend(apiKey);

  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    })),
  );

  const html = `
    <h2>Nieuwe offerteaanvraag</h2>
    <p><strong>${escapeHtml(aanhef)} ${escapeHtml(voornaam)} ${escapeHtml(achternaam)}</strong></p>
    <p>${escapeHtml(straat)}<br />${escapeHtml(postcode)} ${escapeHtml(plaats)}</p>
    <p>Tel: ${escapeHtml(telefoon)}<br />E-mail: ${escapeHtml(email)}</p>
    <p><strong>Gewenste diensten:</strong> ${diensten.map(escapeHtml).join(', ') || '-'}</p>
    <p><strong>Opmerkingen:</strong><br />${escapeHtml(opmerkingen).replace(/\n/g, '<br />') || '-'}</p>
  `;

  try {
    await resend.emails.send({
      from: `Offerteformulier <offerte@${SITE.email.split('@')[1]}>`,
      to: SITE.email,
      replyTo: email,
      subject: `Offerteaanvraag van ${voornaam} ${achternaam}`,
      html,
      attachments,
    });
  } catch (error) {
    console.error('[offerte] Resend-verzending mislukt:', error);
    return new Response(JSON.stringify({ error: 'send_failed' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
