// Vercel Serverless Function — Send reservation email via Resend
// Env vars required: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. "Passagens <noreply@seudominio.com>")

function buildEmailHtml(d) {
  const formatCurrency = (v) => {
    if (v == null || isNaN(v)) return null;
    return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
  };

  const row = (label, value) => {
    if (!value) return '';
    return `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:6px 12px;font-weight:600;color:#1f2937;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6">${value}</td></tr>`;
  };

  const brandName = d.brand_name || 'Passagens Online';
  const brandColor = '#1e40af';

  const statusLabel = d.payment_status || 'AGUARDANDO PAGAMENTO';
  const statusColor = statusLabel.toLowerCase().includes('pago') ? '#16a34a' : '#d97706';

  let ctaButtons = '';
  if (d.payment_link) {
    ctaButtons += `<a href="${d.payment_link}" style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:6px">Pagar agora</a>`;
  }
  if (d.ticket_pdf_url) {
    ctaButtons += `<a href="${d.ticket_pdf_url}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:6px">Baixar bilhete</a>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">

<!-- Header -->
<tr><td style="background:${brandColor};padding:24px 32px;text-align:center">
${d.brand_logo ? `<img src="${d.brand_logo}" alt="${brandName}" style="max-height:40px;margin-bottom:8px">` : ''}
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">${brandName}</h1>
</td></tr>

<!-- Title -->
<tr><td style="padding:28px 32px 8px;text-align:center">
<h2 style="margin:0;color:#1f2937;font-size:22px;font-weight:700">Prévia da sua Reserva</h2>
<p style="margin:8px 0 0;color:#6b7280;font-size:14px">Confira os detalhes da sua viagem abaixo</p>
</td></tr>

<!-- Status Badge -->
<tr><td style="padding:12px 32px;text-align:center">
<span style="display:inline-block;background:${statusColor};color:#fff;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px">${statusLabel}</span>
</td></tr>

<!-- Trip Card -->
<tr><td style="padding:8px 32px">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
<tr><td style="padding:16px 20px;background:${brandColor}10">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:42%;text-align:center">
<p style="margin:0;font-size:18px;font-weight:700;color:#1f2937">${d.origin_city || '—'}${d.origin_state ? ` <span style="color:#6b7280;font-size:12px">${d.origin_state}</span>` : ''}</p>
${d.departure_time ? `<p style="margin:4px 0 0;font-size:24px;font-weight:800;color:${brandColor}">${d.departure_time}</p>` : ''}
</td>
<td style="width:16%;text-align:center;color:#9ca3af;font-size:20px">→</td>
<td style="width:42%;text-align:center">
<p style="margin:0;font-size:18px;font-weight:700;color:#1f2937">${d.destination_city || '—'}${d.destination_state ? ` <span style="color:#6b7280;font-size:12px">${d.destination_state}</span>` : ''}</p>
${d.arrival_time ? `<p style="margin:4px 0 0;font-size:24px;font-weight:800;color:${brandColor}">${d.arrival_time}</p>` : ''}
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:0">
<table width="100%" cellpadding="0" cellspacing="0">
${row('Companhia', d.carrier_name)}
${row('Data', d.departure_date)}
${row('Poltrona', d.seat_number)}
${row('Categoria', d.service_type)}
${row('Localizador', d.locator_code ? `<span style="font-family:monospace;letter-spacing:1px;color:${brandColor}">${d.locator_code}</span>` : null)}
${row('Cód. Reserva', d.reservation_code ? `<span style="font-family:monospace;letter-spacing:1px">${d.reservation_code}</span>` : null)}
</table>
</td></tr>
</table>
</td></tr>

<!-- Passenger -->
<tr><td style="padding:16px 32px 4px">
<h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Passageiro</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
${row('Nome', d.passenger_name)}
${row('Documento', d.passenger_document)}
${d.passenger_type ? row('Tipo', d.passenger_type) : ''}
</table>
</td></tr>

<!-- Financial -->
<tr><td style="padding:16px 32px 4px">
<h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Valores</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
${row('Tarifa', formatCurrency(d.fare_amount))}
${row('Taxa de embarque', formatCurrency(d.boarding_fee))}
${row('Seguro', formatCurrency(d.insurance_amount))}
<tr><td style="padding:10px 12px;font-weight:700;color:#1f2937;font-size:15px;border-top:2px solid #e5e7eb">Total</td><td style="padding:10px 12px;font-weight:800;color:${brandColor};font-size:18px;text-align:right;border-top:2px solid #e5e7eb">${formatCurrency(d.total_amount) || '—'}</td></tr>
${row('Forma de pagamento', d.payment_method === 'pix' ? 'PIX' : d.payment_method)}
</table>
</td></tr>

<!-- CTA Buttons -->
${ctaButtons ? `<tr><td style="padding:20px 32px;text-align:center">${ctaButtons}</td></tr>` : ''}

<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
<p style="margin:0;color:#9ca3af;font-size:12px">Este e-mail é uma confirmação automática da sua reserva.</p>
<p style="margin:4px 0 0;color:#9ca3af;font-size:12px">Em caso de dúvidas${d.support_whatsapp ? `, entre em contato pelo WhatsApp: ${d.support_whatsapp}` : ''}${d.support_email ? ` ou e-mail: ${d.support_email}` : ''}.</p>
<p style="margin:12px 0 0;color:#d1d5db;font-size:11px">${brandName} · ${d.issue_date || new Date().toLocaleDateString('pt-BR')}${d.order_id ? ` · Pedido ${d.order_id}` : ''}</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const body = req.body;
    if (!body || !body.to || !body.data) {
      return res.status(400).json({ error: 'Missing required fields: to, data' });
    }

    const { to, data } = body;
    const brandName = data.brand_name || 'Passagens Online';
    const subject = `Reserva ${data.reservation_code || ''} — ${data.origin_city || ''} → ${data.destination_city || ''} · ${data.payment_status || 'Aguardando Pagamento'}`;

    const html = buildEmailHtml(data);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error('[send-email] Resend error:', result);
      return res.status(502).json({ error: 'Failed to send email', details: result });
    }

    console.log('[send-email] sent successfully:', result.id, 'to:', to);
    return res.status(200).json({ success: true, email_id: result.id });
  } catch (err) {
    console.error('[send-email] unexpected error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
