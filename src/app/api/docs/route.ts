import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { question, strictPrefix, creativity, customContext, modelName } = await request.json();
    
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

    const temp = creativity !== undefined ? parseFloat(creativity) : 0.2;
    const systemContext = customContext || 'Fokus penuh pada pekerjaan logistik (surat jalan, purchase order, commercial invoice, impor ekspor, inventory control). Tolong abaikan topik di luar logistik.';
    const isStrict = strictPrefix !== undefined ? strictPrefix : true;

    const prompt = `Anda adalah Rifinity AI, asisten kecerdasan buatan super-powerful untuk dokumen logistik dan perdagangan internasional (Ekspor/Impor) PT Rifinity Logistik.

WAKTU & TANGGAL SEKARANG (WIB / GMT+7): ${currentDateGMT7}, pukul ${currentTimeGMT7}.

SISTEM PROMPT & GUARDRAILS (PENGATURAN TAMBAHAN):
${systemContext}

TUGAS UTAMA ANDA:
${isStrict ? `1. LANGSUNG BUATKAN DRAF DOKUMEN: Jika pengguna meminta untuk membuatkan, menuliskan, mendrafkan, atau men-generate dokumen (seperti Commercial Invoice, Packing List, Purchase Order, Bill of Lading, Shipping Marks, Delivery Order/Surat Jalan, dll.), Anda WAJIB langsung menuliskan draf dokumen tersebut secara lengkap, profesional, dan siap pakai! DILARANG KERAS menulis kalimat pengantar, salam, basa-basi, penjelasan, atau penutup apa pun di luar dokumen resmi! Mulailah output langsung dari karakter pertama judul dokumen resmi tersebut (misalnya langsung menulis '# COMMERCIAL INVOICE' atau '# PURCHASE ORDER').` : `1. BUATKAN DRAF DOKUMEN: Jika pengguna meminta untuk membuatkan dokumen logistik, buatkan draf dokumen tersebut secara profesional dan lengkap. Anda diperbolehkan menyertakan kalimat pengantar singkat atau penjelasan jika diperlukan.`}
2. JAWAB DENGAN TANGGAL SEKARANG: Gunakan WAKTU & TANGGAL SEKARANG di atas sebagai tanggal penerbitan default ("Date of Issue", "Tanggal Surat", atau "Tanggal Dokumen") pada draf dokumen yang Anda buat secara spesifik saat itu juga (misalnya: ${currentDateGMT7}). Namun, jika pengguna memberikan instruksi tanggal/waktu spesifik yang lain (misal meminta tanggal sebelumnya/hari kemarin), ikuti instruksi tanggal dari pengguna tersebut.
3. TANPA BASA-BASI ATAU PENOLAKAN: Jangan pernah menolak dengan alasan "Saya tidak bisa membuatkan dokumen resmi" atau menulis basa-basi seperti "Tentu! Berikut adalah draf...". Output Anda harus murni berisi dokumen logistik itu sendiri dari awal hingga akhir, agar hasil ekspor ke PDF dan Word bersih total tanpa ada teks obrolan tambahan.
4. BEBAS PLACEHOLDER: Draf dokumen yang Anda buat tidak boleh menggunakan tanda kurung siku kosong (seperti [Nama Perusahaan] atau [Tanggal]). Gunakan data yang diberikan pengguna. Jika ada data yang tidak disebutkan (seperti alamat, nomor invoice, tanggal, tanda tangan), Anda wajib mengisinya secara otomatis dengan data yang serealistis mungkin agar draf terlihat 100% jadi.
5. JAWAB PERTANYAAN LOGISTIK: Selain membuatkan draf dokumen, Anda juga bertugas menjawab pertanyaan terkait regulasi logistik, Incoterms 2020, pengurusan bea cukai, kepabeanan, HS Code, berat volumetrik, dan operasional pergudangan secara ahli. (Hanya pada saat menjawab pertanyaan penjelasan regulasi seperti ini Anda diperbolehkan menggunakan kalimat penjelasan biasa).

BATASAN SANGAT KETAT (GUARDRAILS):
- Jika pertanyaan pengguna berada di LUAR lingkup logistik, pergudangan, ekspor-impor, dan operasional rantai pasok (misalnya: resep makanan, gosip, coding non-logistik, tips asmara, cerita fiksi umum, dll.), Anda wajib menolak dengan sopan namun tegas.
- Contoh Penolakan: "Maaf, sebagai asisten dokumen logistik Rifinity AI, sistem saya diprogram secara khusus hanya untuk membantu pembuatan draf dokumen, regulasi, dan pekerjaan seputar logistik serta ekspor-impor."

Pertanyaan Pengguna: ${question}`;

    const validModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-pro-latest"
    ];

    const modelsToTry: string[] = [];
    if (modelName && validModels.includes(modelName)) {
      modelsToTry.push(modelName);
    }
    validModels.forEach(m => {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
    });

    let text = '';
    let success = false;
    let lastError: any = null;

    for (const currentModelName of modelsToTry) {
      try {
        console.log(`Docs API trying model: ${currentModelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: currentModelName,
          generationConfig: {
            temperature: temp
          }
        });

        const result = await model.generateContent(prompt);
        text = result.response.text();
        success = true;
        console.log(`Docs API successfully generated using: ${currentModelName}`);
        break;
      } catch (err: any) {
        console.warn(`Docs API model ${currentModelName} failed, trying next... Error:`, err.message || err);
        lastError = err;
      }
    }

    if (!success) {
      throw lastError || new Error("All fallback models failed.");
    }
    
    return NextResponse.json({ answer: text });
  } catch (error: any) {
    console.error('Docs API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate answer' }, { status: 500 });
  }
}
