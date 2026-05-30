import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { 
      imageBase64, 
      mimeType,
      model: clientModel,
      temperature,
      systemInstruction,
      cleanPreamble,
      optimizationStrategy,
      documentLanguage,
      complianceCheck
    } = await request.json();
    
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing image data or mimeType' }, { status: 400 });
    }

    // Map the selected client-side model names to Google Generative AI compatible model ids
    let modelId = 'gemini-2.5-flash'; // High-performance default
    if (clientModel === 'gemini-2.5-pro') {
      modelId = 'gemini-2.5-pro';
    } else if (clientModel === 'gemini-2.0-flash-lite') {
      modelId = 'gemini-2.0-flash-lite'; 
    } else if (clientModel === 'gemini-3.5-flash') {
      modelId = 'gemini-3.5-flash';
    }

    // Configure model with dynamic settings (like temperature)
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.2,
      }
    });
    
    // Construct dynamic prompt matching the custom AI Settings
    let dynamicPrompt = `Anda adalah asisten AI WMS untuk ekstraksi dokumen surat jalan, invoice, packing list, atau kwitansi logistik.
Tugas Anda adalah membaca gambar dokumen ini dan mengekstrak informasi yang TERTERA SECARA EKSPLISIT di dokumen. Jangan mengestimasi atau mengarang nilai apapun yang tidak ada di dokumen.`;

    if (systemInstruction) {
      dynamicPrompt += `\n\n[Sistem Prompt & Guardrails AI]: ${systemInstruction}`;
    }

    if (optimizationStrategy) {
      dynamicPrompt += `\n\n[Strategi Optimasi Logistik]: Lakukan prioritas ekstraksi berdasarkan strategi ${optimizationStrategy} (misal: memprioritaskan kalkulasi biaya jika Cost-Opt, atau kecepatan tanggapan jika Speed-Opt).`;
    }

    if (documentLanguage) {
      dynamicPrompt += `\n\n[Bahasa Output Dokumen]: Format bahasa hasil ekstraksi adalah ${documentLanguage}.`;
    }

    if (complianceCheck) {
      dynamicPrompt += `\n\n[Kepatuhan & Regulasi Logistik]: Pastikan untuk memverifikasi kesesuaian HS Code atau detail regulasi logistik, berikan perhatian lebih pada kepatuhan data logistik.`;
    }

    if (cleanPreamble) {
      dynamicPrompt += `\n\n[Peringatan Preamble]: Hapus kalimat basa-basi di awal draf. Jangan kembalikan teks preamble lain, langsung kembalikan data dalam format JSON murni.`;
    }

    dynamicPrompt += `\n\nHarap kembalikan data dalam format JSON murni tanpa pembungkus markdown (no backticks) dengan struktur kunci sebagai berikut:
{
  "itemName": "Nama barang yang di-inbound persis seperti tertera di dokumen",
  "sku": "Kode SKU/kode barang jika tertera di dokumen, atau buat kode SKU singkat logis (misal: BW-CLR-001) dari nama barang jika tidak ada",
  "category": "Kategori barang (misal: Packaging, Fashion, Cosmetics, Food, Electronics, General) sesuai jenis barang",
  "quantity": "Jumlah unit yang tertera di dokumen, angka saja tanpa satuan (misal: 150)",
  "unit": "Satuan barang yang tertera di dokumen (misal: pcs, roll, box, kg, liter)",
  "buyPrice": "Harga beli/harga satuan yang TERTERA EKSPLISIT di dokumen, angka saja tanpa titik/koma (misal: 75000). Jika tidak ada, isikan 0",
  "sellPrice": "Harga jual yang TERTERA EKSPLISIT di dokumen sebagai harga jual, angka saja. JANGAN mengestimasi atau menghitung. Jika tidak ada harga jual yang ditulis secara jelas di dokumen, WAJIB isikan 0",
  "supplier": "Nama perusahaan atau supplier pengirim barang yang tertera pada dokumen, jika tidak ada isikan ''",
  "owner": "Nama penerima/pemilik barang (perusahaan tujuan) yang tertera pada dokumen, jika tidak ada isikan 'PT Rifinity Logistik'"
}
PERINGATAN PENTING: Untuk sellPrice, HANYA isi jika ada harga jual yang DITULIS SECARA EKSPLISIT di dokumen. Jangan pernah menghitung atau mengestimasi.
Pastikan hanya mengembalikan JSON yang valid agar dapat di-parse secara langsung oleh sistem.`;

    const result = await model.generateContent([
      dynamicPrompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    
    // Attempt to sanitize potential markdown codeblock wrappers if Gemini returns them
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', text);
      return NextResponse.json({ error: 'Failed to parse AI extraction results', rawText: text }, { status: 500 });
    }
  } catch (error) {
    console.error('Inbound Extract API Error:', error);
    return NextResponse.json({ error: 'Failed to extract document contents via AI' }, { status: 500 });
  }
}
