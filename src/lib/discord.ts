const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1491035590295031860/Tkr-86jMKVTrUewftwRU_97RjWJrQiJm-bNpMkFIrp3eQRLnumg7IDFU5ZfTIIGgJbw7';

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface SendDiscordOptions {
  title: string;
  color?: number;
  fields: DiscordField[];
  imageUrl?: string;
}

export async function sendToDiscord({ title, color = 0x3b82f6, fields, imageUrl }: SendDiscordOptions) {
  const embed: Record<string, unknown> = {
    title,
    color,
    fields: fields.map(f => ({ ...f, inline: f.inline ?? true })),
    timestamp: new Date().toISOString(),
  };

  if (imageUrl) {
    embed.image = { url: imageUrl };
  }

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      console.error('Discord webhook error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Discord webhook failed:', err);
  }
}
