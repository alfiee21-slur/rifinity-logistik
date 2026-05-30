import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json(); // Accept full message history
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is missing' }, { status: 500 });
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1].text;
    
    // Fetch real inventory data with latest supplier info
    const items = await prisma.item.findMany({
      include: {
        transactions: {
          where: { type: 'IN' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    const inventoryData = items.map(i => {
      let supplier = "Supplier Belum Ditentukan";
      if (i.transactions.length > 0 && i.transactions[0].notes) {
        const match = i.transactions[0].notes.match(/Supplier:\s*([^-]+)/);
        if (match) supplier = match[1].trim();
      }
      return `- ${i.name} (${i.sku}): ${i.quantity} ${i.unit} di RAK ${i.rackLocation || 'Belum Ditentukan'} (Supplier: ${supplier || i.supplier || 'Belum Ditentukan'}, Harga Beli: Rp${i.buyPrice})`;
    }).join('\n');

    // Fetch oldest and newest inbound transactions from DB
    const oldestInbound = await prisma.transaction.findFirst({
      where: { type: 'IN' },
      orderBy: { createdAt: 'asc' },
      include: { item: true }
    });

    const newestInbound = await prisma.transaction.findFirst({
      where: { type: 'IN' },
      orderBy: { createdAt: 'desc' },
      include: { item: true }
    });

    let oldestInboundStr = "Belum ada data masuk";
    if (oldestInbound) {
      oldestInboundStr = `${oldestInbound.item.name} (${oldestInbound.item.sku}) sejumlah ${oldestInbound.quantity} ${oldestInbound.item.unit} di RAK ${oldestInbound.item.rackLocation || 'Belum Ditentukan'} (Tanggal Masuk: ${new Date(oldestInbound.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })})`;
    }

    let newestInboundStr = "Belum ada data masuk";
    if (newestInbound) {
      newestInboundStr = `${newestInbound.item.name} (${newestInbound.item.sku}) sejumlah ${newestInbound.quantity} ${newestInbound.item.unit} di RAK ${newestInbound.item.rackLocation || 'Belum Ditentukan'} (Tanggal Masuk: ${new Date(newestInbound.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })})`;
    }

    // Fetch live dashboard & financial stats
    const totalItems = await prisma.item.count();
    const criticalStock = await prisma.item.count({ where: { quantity: { lte: 20 } } });
    const unitsAgg = await prisma.item.aggregate({ _sum: { quantity: true } });
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const incomeAgg = await prisma.transaction.aggregate({
      where: { 
        type: 'OUT',
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { totalValue: true }
    });
    
    const expenseAgg = await prisma.transaction.aggregate({
      where: { 
        type: 'IN',
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { totalValue: true }
    });

    const totalIncome = incomeAgg._sum.totalValue || 0;
    const totalExpense = expenseAgg._sum.totalValue || 0;
    const totalUnits = unitsAgg._sum.quantity || 0;

    const currentDateGMT7 = new Date().toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTimeGMT7 = new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const systemPrompt = `Anda adalah Logistic AI Assistant Super-Powerful untuk Rifinity Logistik.
Anda dilatih khusus untuk menangani seluruh pekerjaan yang berkaitan dengan pergudangan, logistik, operasional supply chain, dan ekspor-impor secara profesional, cepat, dan cerdas.

WAKTU & TANGGAL SEKARANG (WIB / GMT+7): ${currentDateGMT7}, pukul ${currentTimeGMT7}.

RUANG LINGKUP PEKERJAAN & KEMAMPUAN LOGISTIK ANDA:
1. PENGALIHAN UNTUK PEMBUATAN DOKUMEN: Jika pengguna meminta Anda untuk membuat, mendraf, menyusun, atau meng-generate dokumen logistik apa pun (seperti Purchase Order, Delivery Order, Surat Jalan, Invoice, Packing List, dll.), Anda DILARANG menulis atau membuat draf dokumen tersebut langsung di panel obrolan chat ini. Sebagai gantinya, arahkan pengguna secara ramah dan sopan untuk menggunakan fitur "Asisten Pembuat Dokumen", jelaskan bahwa fitur tersebut dirancang khusus agar draf dokumen sangat rapi dan siap diekspor ke PDF/Word tanpa terganggu teks obrolan, lalu Anda WAJIB menyelipkan tag rute khusus \`[ROUTE: /docs]\` di bagian paling akhir balasan Anda untuk mengarahkan pengguna ke sana secara otomatis.
2. EKSPOR-IMPOR (EXPORT-IMPORT): Menguasai terminologi perdagangan internasional Incoterms (EXW, FOB, CIF, CFR, DDP, DDU, dll.), kalkulasi kubikasi container (20ft, 40ft GP, 40ft HQ), pengurusan Bea Cukai (Customs Clearance), klasifikasi HS Code, pajak bea masuk (BM, PPN Impor, PPH Pasal 22), dokumen kepabeanan (PEB, PIB, COO / Surat Keterangan Asal, Bill of Lading / B/L, Air Waybill / AWB).
3. MANAJEMEN GUDANG & PERSEDIAAN (WMS): Memahami optimasi rack location, metode pengelolaan stok (FIFO, LIFO, FEFO), replenishment limit, rumus safety stock, reorder point, dan kalkulasi berat volumetrik barang. Anda mampu menjelaskan dan mengatur seluruh sistem pergudangan yang berkaitan dengan penyimpanan, stock taking, inbound-outbound, serta pengaturan barang.
4. PENGIRIMAN & RUTE CARGO: Menguasai moda transportasi logistik (Sea Freight, Air Freight, Land Cargo, FCL - Full Container Load, LCL - Less Container Load), serta kurir pengiriman domestik & internasional.

BATASAN SANGAT KETAT (GUARDRAILS):
- Jika pengguna menanyakan hal, meminta bantuan, atau mengobrol tentang topik di LUAR ruang lingkup logistik dan manajemen gudang (misalnya: resep masakan, obrolan cinta/asmara, berita politik, coding pemrograman non-logistik, penulisan cerita fiksi umum, penyanyi pop, dll.), Anda WAJIB menolak dengan sopan namun tegas. 
- Katakan bahwa Anda adalah sistem kecerdasan buatan khusus Rifinity Logistik yang hanya diprogram untuk melayani kebutuhan logistik, manajemen gudang, ekspor-impor, dan operasional rantai pasok.
- Contoh Jawaban Penolakan: "Maaf, sebagai AI Logistik Rifinity Logistik, sistem saya diprogram secara khusus hanya untuk membantu pekerjaan dan pertanyaan seputar logistik, operasional gudang, surat-menyurat logistik, dan ekspor-impor."
- Jika ada pertanyaan singkat dari pengguna, jawab dengan sangat singkat, padat, dan langsung pada inti jawaban (to-the-point). JANGAN memberikan penjelasan bertele-tele yang melenceng atau di luar hal yang ditanyakan.

DATA INVENTORY REAL-TIME (Tiap barang tercatat beserta jumlah dan lokasinya di RAK yang sebenarnya):
${inventoryData}

INFORMASI TRANSAKSI INBOUND TERPENTING (REAL-TIME DARI LOG HISTORIS DATABASE):
- Barang Paling Lama Masuk (FIFO Terdepan): ${oldestInboundStr}
- Barang Paling Baru Masuk (Terbaru): ${newestInboundStr}

STATUS KEUANGAN & GUDANG BULAN INI (REAL-TIME):
- Total Jenis Barang: ${totalItems} jenis
- Total Fisik Stok di Gudang: ${totalUnits.toLocaleString('id-ID')} unit
- Barang Kritis (Stok <= 20): ${criticalStock} jenis
- Total Pengeluaran (Bulan Ini): Rp${totalExpense.toLocaleString('id-ID')}
- Total Pemasukan (Bulan Ini): Rp${totalIncome.toLocaleString('id-ID')}

ATURAN UTAMA BALASAN:
1. Selalu gunakan data inventory dan status keuangan di atas jika ditanya soal stok atau keuangan. Jawab dengan data angka asli di atas!
2. Jawab dengan bahasa Indonesia, ramah, profesional, dan humoris/menghibur jika pengguna menyapa dengan santai. JANGAN SELALU MENYAPA "Halo" di setiap balasan, cukup langsung jawab inti pertanyaannya.
3. Anda memiliki kemampuan untuk mengarahkan pengguna ke halaman tertentu jika mereka memintanya. Caranya adalah dengan menyelipkan tag khusus \`[ROUTE: /rute-halaman]\` di paling akhir balasan Anda.
   RUTE-RUTE YANG TERSEDIA:
   - Beranda/Dashboard: \`[ROUTE: /]\`
   - Manajemen Stok / Inventory: \`[ROUTE: /inventory]\`
   - Pendaftaran Barang / Inbound: \`[ROUTE: /inbound]\`
   - Volumetrik & Rekomendasi Box / Packaging: \`[ROUTE: /packaging]\`
   - Asisten Pembuat Dokumen / Docs: \`[ROUTE: /docs]\`
   - Laporan Analisis Keuangan / Reports: \`[ROUTE: /reports]\`
4. Jangan sebutkan bahwa Anda membaca "data prompt" atau status tersembunyi, bertingkahlah natural seperti asisten cerdas yang terhubung ke server gudang.
5. Gunakan format teks markdown yang rapi.
6. Untuk setiap pertanyaan singkat, berikan jawaban to-the-point, jangan melenceng, jangan menambah-nambahkan bahasan lain di luar pertanyaan.`;

    // Format history for Gemini (excluding the very last user message, and mapping roles)
    const formattedHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Gemini requires the first history item to be 'user'. 
    // The initial UI greeting is 'model', so we must remove it from history if it's first.
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const MODELS_TO_TRY = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-pro-latest"
    ];

    let text = '';
    let success = false;
    let lastError: any = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Trying AI model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemPrompt
        });

        // Start chat session with history
        const chat = model.startChat({
          history: formattedHistory
        });

        const result = await chat.sendMessage(latestMessage);
        text = result.response.text();
        success = true;
        console.log(`Successfully generated content using: ${modelName}`);
        break; // Stop loop if successful
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying next... Error:`, err.message || err);
        lastError = err;
      }
    }

    if (!success) {
      throw lastError || new Error("All fallback models failed.");
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
