import { NextResponse } from 'next/server';

/**
 * API ROUTE: WMS Telegram Alert Integration
 * PATH: /api/alerts/telegram
 * 
 * DESCRIPTION:
 * Mengirimkan pesan alert secara gratis menggunakan Telegram Bot API.
 * Bisa dikonfigurasi melalui Settings WMS dengan menginputkan Bot Token & Chat ID.
 */

export async function POST(request: Request) {
  try {
    const { token, chatId, message } = await request.json();

    // 1. Dapatkan kredensial (dari request payload, jika kosong fallback ke environment variable)
    const telegramToken = token || process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = chatId || process.env.TELEGRAM_CHAT_ID;
    const finalMessage = message || '⚠️ <b>[Rifinity WMS Alert]</b> Stok kritis terdeteksi di gudang pusat!';

    if (!telegramToken) {
      return NextResponse.json(
        { success: false, error: 'Telegram Bot Token belum dikonfigurasi!' },
        { status: 400 }
      );
    }

    if (!telegramChatId) {
      return NextResponse.json(
        { success: false, error: 'Telegram Chat ID / Group ID belum dikonfigurasi!' },
        { status: 400 }
      );
    }

    console.log(`[TELEGRAM WMS ALERT] Mengirimkan alert ke Chat ID: ${telegramChatId}`);

    // 2. Tembak Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: finalMessage,
        parse_mode: 'HTML',
      }),
    });

    const telegramData = await response.json();

    if (!response.ok || !telegramData.ok) {
      throw new Error(telegramData.description || 'Gagal mengirim pesan melalui gerbang Telegram Bot');
    }

    return NextResponse.json({
      success: true,
      provider: 'Telegram Bot API',
      messageId: telegramData.result.message_id,
      timestamp: new Date().toISOString(),
      details: 'WhatsApp Alert diganti Telegram: sukses dikirim 100% gratis ke Telegram Penerima.',
    });

  } catch (error: any) {
    console.error('[TELEGRAM ALERT ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error pada pengiriman alert Telegram'
      },
      { status: 500 }
    );
  }
}
