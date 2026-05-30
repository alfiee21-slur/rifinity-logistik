/**
 * WMS Telegram Alert Helper
 * centralizes the critical stock check and automated alert trigger.
 */
export async function checkAndSendTelegramAlert(item: { name: string; sku: string; quantity: number; unit: string }) {
  if (typeof window === 'undefined') return;

  try {
    const isTelegramEnabled = localStorage.getItem('rifinity_settings_notif_telegram') === 'true';
    const botToken = localStorage.getItem('rifinity_settings_telegram_bot_token');
    const chatId = localStorage.getItem('rifinity_settings_telegram_chat_id');
    const criticalThresholdStr = localStorage.getItem('rifinity_settings_wms_critical_threshold');
    const criticalThreshold = parseInt(criticalThresholdStr || '5', 10);

    // 1. Validasi prasyarat
    if (!isTelegramEnabled || !botToken || !chatId) {
      console.log('[WMS TELEGRAM Helper] Telegram tidak aktif atau belum dikonfigurasi.');
      return;
    }

    // 2. Cek apakah stok berada di bawah ambang batas kritis
    if (item.quantity <= criticalThreshold) {
      console.log(`[WMS TELEGRAM Helper] Stok kritis terdeteksi! ${item.name}: ${item.quantity} <= ${criticalThreshold}`);
      
      const message = `⚠️ <b>[RIFINITY WMS - PERINGATAN STOK KRITIS]</b>\n\n` +
                      `<b>Produk:</b> ${item.name}\n` +
                      `<b>SKU:</b> <code>${item.sku}</code>\n` +
                      `<b>Stok Fisik Tersisa:</b> <b>${item.quantity} ${item.unit}</b>\n` +
                      `<b>Batas Stok Kritis:</b> ${criticalThreshold} ${item.unit}\n\n` +
                      `<i>Tindakan: Mohon segera lakukan pemesanan ulang (restock) produk ini ke supplier agar operasional fulfillment pergudangan tetap berjalan lancar.</i>`;

      // 3. Panggil API Route untuk mengirim ke Telegram secara gratis
      const response = await fetch('/api/alerts/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: botToken,
          chatId: chatId,
          message: message,
        }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        console.log(`[WMS TELEGRAM Helper] Alert stok kritis untuk '${item.name}' sukses terkirim ke Telegram.`);
      } else {
        console.error(`[WMS TELEGRAM Helper] Gagal mengirim alert:`, resJson.error);
      }
    }
  } catch (error) {
    console.error('[WMS TELEGRAM Helper] Terjadi error saat mengecek/mengirim alert:', error);
  }
}
