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
    if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID is not configured');

    const body = await req.json();
    const {
      full_name, email, phone, amount_requested, purpose,
      date_of_birth, street_address, city, state_province, country, occupation,
      answers, id_card_front_url, id_card_back_url, signed_document_url,
    } = body;

    if (!full_name || !email || !amount_requested) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, amount_requested' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Telegram text message
    let message = `🆕 <b>New Grant Application</b>\n\n`;

    message += `<b>── Personal Details ──</b>\n`;
    message += `👤 <b>Name:</b> ${esc(full_name)}\n`;
    message += `📧 <b>Email:</b> ${esc(email)}\n`;
    if (phone) message += `📱 <b>Phone:</b> ${esc(phone)}\n`;
    if (date_of_birth) message += `🎂 <b>Date of Birth:</b> ${esc(date_of_birth)}\n`;
    if (occupation) message += `💼 <b>Occupation:</b> ${esc(occupation)}\n`;

    const addressParts = [street_address, city, state_province, country].filter(Boolean);
    if (addressParts.length > 0) {
      message += `🏠 <b>Address:</b> ${esc(addressParts.join(', '))}\n`;
    }

    message += `\n<b>── Funding Details ──</b>\n`;
    message += `💰 <b>Amount Requested:</b> $${Number(amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (purpose) message += `📝 <b>Purpose:</b> ${esc(purpose)}\n`;

    if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
      message += `\n<b>── Questionnaire ──</b>\n`;
      const labels: Record<string, string> = {
        why_need_grant: 'Why do you need this grant?',
        how_use_funds: 'How will you use the funds?',
        previous_grants: 'Previous grants received?',
        impact: 'Expected impact?',
        additional_info: 'Additional info',
      };
      for (const [key, value] of Object.entries(answers)) {
        if (value) {
          const label = labels[key] || key.replace(/_/g, ' ');
          message += `• <b>${esc(label)}</b>\n  ${esc(String(value))}\n`;
        }
      }
    }

    message += `\n⏰ <b>Submitted:</b> ${new Date().toUTCString()}`;

    // Send the text message first
    const telegramBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    const textRes = await fetch(`${telegramBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!textRes.ok) {
      const data = await textRes.json();
      console.error('Telegram sendMessage error:', JSON.stringify(data));
      throw new Error(`Telegram sendMessage failed [${textRes.status}]`);
    }

    // Send document images as actual photos via sendPhoto
    const imageEntries: { url: string; caption: string }[] = [];
    if (id_card_front_url) imageEntries.push({ url: id_card_front_url, caption: `🪪 ID Card — Front\n${full_name}` });
    if (id_card_back_url) imageEntries.push({ url: id_card_back_url, caption: `🪪 ID Card — Back\n${full_name}` });
    if (signed_document_url) imageEntries.push({ url: signed_document_url, caption: `📎 Signed Document\n${full_name}` });

    for (const img of imageEntries) {
      try {
        // Download the image from the signed URL
        const imgResponse = await fetch(img.url);
        if (!imgResponse.ok) {
          console.error(`Failed to download image: ${imgResponse.status}`);
          continue;
        }

        const imgBlob = await imgResponse.blob();
        const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

        // Send as photo using multipart form data
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('caption', img.caption);
        formData.append('photo', new File([imgBlob], `document.${ext}`, { type: contentType }));

        const photoRes = await fetch(`${telegramBase}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });

        if (!photoRes.ok) {
          // If sendPhoto fails (e.g. file too large or not an image), try sendDocument
          const docFormData = new FormData();
          docFormData.append('chat_id', TELEGRAM_CHAT_ID);
          docFormData.append('caption', img.caption);
          docFormData.append('document', new File([imgBlob], `document.${ext}`, { type: contentType }));

          const docRes = await fetch(`${telegramBase}/sendDocument`, {
            method: 'POST',
            body: docFormData,
          });

          if (!docRes.ok) {
            console.error('sendDocument also failed for:', img.caption);
          }
        }
      } catch (imgErr) {
        console.error('Error sending image to Telegram:', imgErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending Telegram notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
