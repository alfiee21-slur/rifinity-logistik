import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askAI } from '@/lib/gemini';

export async function GET(request: Request) {
  try {
    // Fetch all active items to perform velocity-based analysis
    const items = await prisma.item.findMany({
      where: { status: 'AKTIF' }
    });

    if (items.length === 0) {
      return NextResponse.json([]);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Compute outbound velocity and days remaining for all items
    const processedItems = await Promise.all(
      items.map(async (item) => {
        const outTransactions = await prisma.transaction.findMany({
          where: {
            itemId: item.id,
            type: 'OUT',
            createdAt: { gte: thirtyDaysAgo }
          },
          select: { quantity: true }
        });

        const totalOut = outTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
        const dailyOutflow = Math.round((totalOut / 30) * 10) / 10; // 1 decimal place
        const daysRemaining = dailyOutflow > 0 ? Math.round(item.quantity / dailyOutflow) : null;

        return {
          ...item,
          totalOut,
          dailyOutflow,
          daysRemaining
        };
      })
    );

    // Filter to only items that have active outbound velocity (dailyOutflow > 0)
    // Sort by daysRemaining ascending (fastest to deplete first)
    // Take top 5 items at risk of running out
    let itemsToForecast = processedItems
      .filter(item => item.daysRemaining !== null)
      .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999))
      .slice(0, 5);

    // Fallback: If no items have outbound velocity, show top 5 lowest physical stock items
    if (itemsToForecast.length === 0) {
      itemsToForecast = processedItems
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);
    }

    // Prepare JSON payload for Gemini AI
    const itemsData = itemsToForecast.map(item => ({
      itemId: item.id,
      name: item.name,
      currentStock: item.quantity,
      unit: item.unit,
      supplier: item.supplier || 'Supplier Umum',
      outboundLast30Days: item.totalOut,
      dailyOutflowRate: item.dailyOutflow,
      mathematicalDaysRemaining: item.daysRemaining
    }));

    const prompt = `Anda adalah Asisten AI Logistik Cerdas untuk WMS Rifinity Logistik.
Analisis data persediaan di bawah ini. Fokuslah memprediksi item yang memiliki tingkat pengeluaran cepat (velocity tinggi) yang berisiko habis dalam waktu dekat meskipun jumlah fisiknya saat ini terlihat banyak.

Berikan estimasi hari kapan stok akan habis (daysRemaining) serta rekomendasi pembelian stok ulang dalam bahasa Indonesia yang ringkas, profesional, dan padat.

Data Persediaan:
${JSON.stringify(itemsData, null, 2)}

Harap berikan respons HANYA berupa format JSON array valid, tanpa markdown backticks (seperti \`\`\`json atau \`\`\`), tanpa penjelasan pembuka atau penutup tambahan. Struktur array harus persis seperti ini:
[
  {
    "itemId": "ID barang dari input",
    "daysRemaining": 4 (estimasi hari stok habis berupa angka bulat, atau null jika tidak ada arus keluar),
    "analysis": "Meskipun stok Anda masih lumayan banyak yaitu Y [unit], barang ini keluar sangat cepat rata-rata X [unit]/hari berdasarkan transaksi 30 hari terakhir. Stok diprediksi habis dalam Z hari ke depan.",
    "recommendation": "Direkomendasikan pesan ulang [Jumlah] [unit] ke [Nama Supplier]."
  }
]`;

    let aiForecasts: any[] = [];
    let isAiProcessed = false;

    try {
      const aiResponse = await askAI(prompt);
      if (aiResponse && aiResponse !== "Error generating response from AI.") {
        const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        aiForecasts = JSON.parse(cleanJson);
        isAiProcessed = true;
      }
    } catch (err) {
      console.error('Error generating AI forecast, falling back to math logic:', err);
    }

    // Map forecasts and apply resilient fallback if AI failed or was incomplete
    const finalForecasts = itemsToForecast.map(item => {
      const mathematicalDays = item.daysRemaining;
      
      const foundAi = isAiProcessed ? aiForecasts.find(f => f.itemId === item.id || f.name === item.name) : null;

      if (foundAi) {
        return {
          itemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          supplier: item.supplier || null,
          daysRemaining: foundAi.daysRemaining !== undefined ? foundAi.daysRemaining : mathematicalDays,
          dailyOutflow: item.dailyOutflow,
          analysis: foundAi.analysis,
          recommendation: foundAi.recommendation
        };
      }

      // Mathematical Fallback
      const analysis = item.dailyOutflow > 0
        ? `Meskipun stok Anda saat ini ${item.quantity} ${item.unit}, barang ini keluar sangat cepat rata-rata ${item.dailyOutflow} ${item.unit}/hari. Stok diprediksi habis dalam ${mathematicalDays} hari ke depan.`
        : `Tidak ada transaksi pengeluaran (OUT) untuk ${item.name} dalam 30 hari terakhir. Tingkat persediaan saat ini stabil.`;

      const recommendation = item.dailyOutflow > 0
        ? `Direkomendasikan pesan ulang ${Math.max(item.quantity * 3, 100)} ${item.unit} ke ${item.supplier || 'Supplier default'}.`
        : `Pantau terus pergerakan stok untuk mengantisipasi lonjakan permintaan mendadak.`;

      return {
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        supplier: item.supplier || null,
        daysRemaining: mathematicalDays,
        dailyOutflow: item.dailyOutflow,
        analysis,
        recommendation
      };
    });

    return NextResponse.json(finalForecasts);
  } catch (error) {
    console.error('Error generating AI forecast route:', error);
    return NextResponse.json({ error: 'Failed to generate AI stock forecasting' }, { status: 500 });
  }
}
