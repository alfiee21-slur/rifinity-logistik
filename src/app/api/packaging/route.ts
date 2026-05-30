import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function GET() {
  try {
    const history = await prisma.packagingLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch packaging history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { length, width, height, weight } = await request.json();
    
    let parsedData;
    try {
      // AI Integration for Packaging Recommendation
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Anda adalah asisten gudang logistik cerdas. 
Diberikan barang dengan dimensi: Panjang ${length} cm, Lebar ${width} cm, Tinggi ${height} cm, dan Berat ${weight} kg.

Berikan rekomendasi kemasan (kardus, bubble wrap, polymailer, wooden crate, dsb) dalam format JSON dengan struktur:
{
  "type": "Nama Kemasan Utama",
  "reason": "Alasan singkat (maks 2 kalimat)",
  "material": "Rekomendasi bahan pelindung tambahan (contoh: Bubble wrap 2 lapis)"
}
Hanya berikan JSON tanpa format markdown.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (aiError) {
      console.warn("AI Generation failed, using local rules-based fallback:", aiError);
      
      const parsedLen = parseFloat(length) || 10;
      const parsedWid = parseFloat(width) || 10;
      const parsedHgt = parseFloat(height) || 10;
      const parsedWgt = parseFloat(weight) || 1;
      
      const volume = parsedLen * parsedWid * parsedHgt;
      
      if (volume <= 1000 && parsedWgt < 1) {
        parsedData = {
          type: "Polymailer Premium & Bubble Envelope",
          reason: "Barang berukuran sangat ringkas dan ringan. Polymailer tebal dengan bantalan bubble envelop sangat efisien untuk meminimalkan ongkir volume.",
          material: "Bubble wrap 1 lapis + Kantong plastik polymailer"
        };
      } else if (volume <= 8000 && parsedWgt <= 3) {
        parsedData = {
          type: "Kardus Karton Kecil (Standard Box)",
          reason: "Dimensi barang relatif kecil dengan bobot ringan. Kardus karton standar sangat pas dan ekonomis untuk menjaga stabilitas barang.",
          material: "Bubble wrap 2 lapis + Shredded paper filling"
        };
      } else if (volume <= 64000 && parsedWgt <= 12) {
        parsedData = {
          type: "Kardus Medium Double-Wall",
          reason: "Barang berukuran sedang dengan bobot menengah. Kardus jenis double-wall memberikan ketahanan struktural yang solid terhadap tumpukan di kurir.",
          material: "Bubble wrap 2 lapis + Siku pelindung kardus (edge protector)"
        };
      } else {
        parsedData = {
          type: "Peti Kayu / Wooden Crate Protektif",
          reason: "Barang berdimensi besar atau memiliki bobot berat. Proteksi struktural kayu eksternal diperlukan untuk mencegah guncangan ekstrem.",
          material: "Bubble wrap tebal + Foam sheet + Rangka kayu penguat"
        };
      }
    }
    
    // Save to database with secure default fallbacks to avoid NaN crashes
    const log = await prisma.packagingLog.create({
      data: {
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        weight: parseFloat(weight) || 0,
        recommendation: parsedData.type || "Kardus Standard"
      }
    });

    return NextResponse.json({
      ...parsedData,
      id: log.id
    });
  } catch (error) {
    console.error('Packaging API Error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}
