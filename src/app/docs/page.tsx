'use client'

import React, { useState, Suspense, useRef, useEffect } from 'react'
import { HelpCircle, Sparkles, Send, BookOpen, Globe, FileCheck, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthGuard'
import { useLanguage } from '@/components/LanguageProvider'



function parseMarkdownTable(rows: string[], isWord = false): string {
  if (rows.length < 2) return '';
  
  const headers = rows[0]
    .split('|')
    .map(x => x.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  const dataRows = rows.slice(2).map(row => 
    row.split('|')
       .map(x => x.trim())
       .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
  );

  let html = '';
  
  if (isWord) {
    html += `<table style="width: 100%; border-collapse: collapse; margin: 12pt 0; font-family: Arial, sans-serif;">`;
    html += `<thead><tr style="background-color: #f2f2f2; border-bottom: 2px solid #333333;">`;
    headers.forEach(h => {
      html += `<th style="text-align: left; padding: 8pt; font-weight: bold; border: 1px solid #cccccc; background-color: #f2f2f2;">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    dataRows.forEach(row => {
      if (row.length === 0 || row.every(c => c === '')) return;
      const isSubtotalRow = row.some(cell => cell.includes('Subtotal') || cell.includes('PPN') || cell.includes('Grand Total') || cell.includes('Total'));
      const rowStyle = isSubtotalRow 
        ? `font-weight: bold; background-color: #f9f9f9; border-top: 1.5pt solid #333333;`
        : `border-bottom: 1px solid #e0e0e0;`;

      html += `<tr style="${rowStyle}">`;
      row.forEach(cell => {
        const cleanCell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<td style="padding: 8pt; border: 1px solid #cccccc;">${cleanCell}</td>`;
      });
      html += `</tr>`;
    });
  } else {
    html += `<div style="overflow-x: auto; margin: 1rem 0;"><table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; border: 1px solid var(--glass-border); border-radius: 8px;">`;
    html += `<thead><tr style="border-bottom: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05);">`;
    headers.forEach(h => {
      html += `<th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: rgba(255,255,255,0.8);">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    dataRows.forEach(row => {
      if (row.length === 0 || row.every(c => c === '')) return;
      const isSubtotalRow = row.some(cell => cell.includes('Subtotal') || cell.includes('PPN') || cell.includes('Grand Total') || cell.includes('Total'));
      const rowStyle = isSubtotalRow 
        ? `border-top: 1px solid rgba(255,255,255,0.15); font-weight: bold; background: rgba(255,255,255,0.03);`
        : `border-bottom: 1px solid rgba(255,255,255,0.05);`;

      html += `<tr style="${rowStyle}">`;
      row.forEach(cell => {
        const cleanCell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<td style="padding: 0.75rem 1rem; color: rgba(255,255,255,0.85);">${cleanCell}</td>`;
      });
      html += `</tr>`;
    });
  }
  
  html += `</tbody></table></div>`;
  return html;
}

function markdownToHtml(md: string, isWord = false) {
  if (!md) return '';
  let html = md;

  const lines = html.split('\n');
  let inTable = false;
  let tableRows: string[] = [];
  const processedLines: string[] = [];

  const sigKeywords = ['diajukan oleh', 'disetujui oleh', 'diketahui oleh', 'prepared by', 'approved by', 'authorized signatory', 'hormat kami', 'tanda tangan'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if this is a signature table — if so, skip it entirely (handled by getSignatureHtml)
      const lLower = line.toLowerCase();
      const isSigTable = sigKeywords.some(k => lLower.includes(k));
      if (isSigTable) {
        // Consume all subsequent rows of this signature table silently
        if (inTable) { inTable = false; tableRows = []; }
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) { i++; }
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        processedLines.push(parseMarkdownTable(tableRows, isWord));
        inTable = false;
      }
      processedLines.push(line);
    }
  }
  if (inTable) {
    processedLines.push(parseMarkdownTable(tableRows, isWord));
  }

  let bodyHtml = processedLines.map(line => {
    if (line.startsWith('<table') || line.startsWith('<div')) {
      return line;
    }
    if (line === '---') {
      return isWord 
        ? '<hr style="border: 0; border-top: 1px solid #444444; margin: 15pt 0;" />'
        : '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.5rem 0;" />';
    }
    if (line === '') {
      return isWord ? '<p style="margin: 0 0 8pt 0;">&nbsp;</p>' : '<br/>';
    }

    // --- HEADING PARSING (check h3 → h2 → h1 to avoid false positive) ---
    const h3Match = line.match(/^###\s+(.+)$/);
    const h2Match = !h3Match && line.match(/^##\s+(.+)$/);
    const h1Match = !h3Match && !h2Match && line.match(/^#\s+(.+)$/);

    if (h1Match) {
      const text = h1Match[1];
      return isWord
        ? `<h1 style="margin: 18pt 0 6pt 0; font-size: 16pt; font-weight: bold; font-family: Arial, sans-serif; color: #0f172a; text-align: center; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #0f172a; padding-bottom: 6pt;">${text}</h1>`
        : `<h1 style="margin: 1.5rem 0 0.5rem 0; font-size: 1.3rem; font-weight: 800; color: white; text-align: center; text-transform: uppercase; letter-spacing: 3px; border-bottom: 2px solid rgba(255,255,255,0.5); padding-bottom: 0.4rem;">${text}</h1>`;
    }
    if (h2Match) {
      const text = h2Match[1];
      return isWord
        ? `<h2 style="margin: 14pt 0 4pt 0; font-size: 13pt; font-weight: bold; font-family: Arial, sans-serif; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4pt;">${text}</h2>`
        : `<h2 style="margin: 1.2rem 0 0.4rem 0; font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.95); border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.3rem;">${text}</h2>`;
    }
    if (h3Match) {
      const text = h3Match[1];
      return isWord
        ? `<h3 style="margin: 10pt 0 3pt 0; font-size: 11.5pt; font-weight: bold; font-family: Arial, sans-serif; color: #334155;">${text}</h3>`
        : `<h3 style="margin: 1rem 0 0.3rem 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9);">${text}</h3>`;
    }
    
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const cleanLine = line.substring(2);
      return isWord
        ? `<li style="margin-left: 20px; margin-bottom: 4pt; font-size: 11pt; font-family: Arial, sans-serif; color: #333333;">${cleanLine}</li>`
        : `<li style="margin-left: 20px; margin-bottom: 0.5rem; color: rgba(255,255,255,0.85);">${cleanLine}</li>`;
    }
    
    return isWord
      ? `<p style="margin: 0 0 8pt 0; font-size: 11pt; font-family: Arial, sans-serif; color: #333333; line-height: 1.5;">${line}</p>`
      : `<p style="margin-bottom: 0.75rem; color: rgba(255,255,255,0.85); line-height: 1.7;">${line}</p>`;
  }).join('\n');

  bodyHtml = bodyHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  bodyHtml = bodyHtml.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  return bodyHtml;
}

function DocsContent() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const item = searchParams.get('item')
  const owner = searchParams.get('owner')
  const triggeredRef = useRef(false)

  const docTopics = [
    { icon: Globe, label: t('topic_incoterms'), desc: t('topic_incoterms_desc') },
    { icon: FileCheck, label: t('topic_export_docs'), desc: t('topic_export_docs_desc') },
    { icon: BookOpen, label: t('topic_hs_code'), desc: t('topic_hs_code_desc') },
  ]

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (action === 'order' && item && !triggeredRef.current) {
      triggeredRef.current = true
      const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      const isInternal = !owner || owner === 'PT Rifinity Logistik'
      
      const queryPrompt = isInternal
        ? `Tolong bantu buatkan draf Purchase Order (PO) untuk restock barang: ${item}. Stok saat ini sudah kritis. 
Tolong buatkan versi LENGKAP dan SIAP PAKAI tanpa placeholder kurung siku (seperti [isi nama] dsb). 
Gunakan profil resmi berikut untuk Pembeli:
- Perusahaan: PT. RIFINITY LOGISTIK GLOBAL (Jl. Raya Logistik No. 18, Jakarta Timur, Indonesia. Telp: (021) 1234 5678)
- Dikirim Ke (Ship To): PT. RIFINITY LOGISTIK GLOBAL (Alamat sama seperti di atas, Email: procurement@rifinitylogistics.com)
- Ditagihkan Ke (Bill To): PT. RIFINITY LOGISTIK GLOBAL (Alamat sama seperti di atas, Email: finance@rifinitylogistics.com)
Gunakan detail berikut untuk dokumen:
- Nomor PO: PO/RFL/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}
- Tanggal: ${today}
- Supplier: (Gunakan nama supplier asli dari database untuk barang ini)
Tampilkan langsung dalam format teks yang rapi.`
        : `Tolong bantu buatkan draf "Surat Pemberitahuan Stok Kritis & Permohonan Inbound Restock" (Restock Request Notification) untuk Klien kita: ${owner}. 
Saat ini barang titipan mereka, yaitu: ${item}, stoknya sudah sangat kritis di gudang kita.
Tolong buatkan versi LENGKAP, SIAP PAKAI, dan formal tanpa placeholder kurung siku (seperti [isi nama] dsb). 
Gunakan detail berikut:
- Pengirim: PT. RIFINITY LOGISTIK GLOBAL (Pihak Pengelola Gudang / 3PL Warehouse Provider, Jl. Raya Logistik No. 18, Jakarta Timur. Telp: (021) 1234 5678, Email: support@rifinitylogistics.com)
- Penerima / Klien (Owner Barang): ${owner}
- Detail Masalah: Stok barang "${item}" tersisa sangat sedikit di gudang penyimpanan kami.
- Nomor Surat: Ref: SR/RFL/STOCK-ALERT/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}
- Tanggal Surat: ${today}
- Isi Surat: Pemberitahuan resmi yang ramah namun formal bahwa kapasitas stok mereka telah mendekati batas aman minimum, dan memohon mereka segera mengirimkan armada pengiriman inbound (restock) barang tersebut ke gudang kami demi kelancaran pemenuhan pesanan (order fulfillment).
Tampilkan langsung dalam format teks yang rapi dan terstruktur.`;
      
      setQuestion(queryPrompt)
      
      setIsLoading(true)
      setAnswer('')
      const savedStrict = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_strict') !== 'false' : true
      const savedCreativity = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_creativity') || '0.2' : '0.2'
      const savedContext = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_custom_context') || '' : ''
      const savedAiModel = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_model') || 'gemini-1.5-flash' : 'gemini-1.5-flash'

      fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: queryPrompt,
          strictPrefix: savedStrict,
          creativity: parseFloat(savedCreativity),
          customContext: savedContext,
          modelName: savedAiModel
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setAnswer(data.answer)
      })
      .catch(err => {
        setAnswer(isInternal 
          ? t('ai_failed_draft_po')
          : t('ai_failed_restock')
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
    }
  }, [action, item, owner, t])

  const cleanDraft = (text: string) => {
    let cleaned = text.trim();
    
    // Strip markdown code block wrappers if present
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      if (lines[0].startsWith('```')) {
        lines.shift();
      }
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleaned = lines.join('\n').trim();
    }
    
    // Safe check: if there is a '---' wrapper at the very beginning and near the very end, strip the conversational envelope.
    // Otherwise keep the document intact. This preserves markdown horizontal lines inside the document.
    const firstDivider = cleaned.indexOf('---');
    const lastDivider = cleaned.lastIndexOf('---');
    if (firstDivider !== -1 && lastDivider !== -1 && firstDivider !== lastDivider) {
      if (firstDivider < 250 && (cleaned.length - lastDivider) < 250) {
        cleaned = cleaned.substring(firstDivider + 3, lastDivider).trim();
      }
    }

    // REMOVE REDUNDANT AI SIGNATURE BLOCK
    // Since we dynamically append a clean, authenticated signature block,
    // we strip ALL signature placeholder text generated by the AI model.
    const lines = cleaned.split('\n');
    let cutIndex = -1;

    
    const sigHeaders = [
      // Indonesian
      'diajukan oleh', 'disetujui oleh', 'diketahui oleh', 'mengetahui',
      'hormat kami', 'tanda tangan', 'ttd',
      // English
      'prepared by', 'approved by', 'authorized signatory', 'authorized signature',
      'authorized by', 'signed by', 'signatory', 'for and on behalf',
      // "FOR PT / CV ..." pattern (company sign-off line)
      'for pt', 'for cv', 'for and behalf',
      // Digital stamp placeholders
      'digital signature', 'stamp', 'cap perusahaan',
      // Bracket placeholders that AI generates
      'nama lengkap', 'jabatan pejabat', '[nama', '[jabatan',
      // Generic sign-off triggers
      'materai', 'tempel', 'bermaterai',
    ];

    // Scan backwards through last 60 lines (handles long documents)
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 60); i--) {
      const lineLower = lines[i].toLowerCase().replace(/[*_[\]()]/g, '');
      // Plain-text or bracketed placeholder match
      const isPlainHeader = sigHeaders.some(h => lineLower.includes(h))
        && !lineLower.includes('dan sah tanpa')
        && !lineLower.includes('secara elektronik dan');
      // Table-format header: | DIAJUKAN OLEH | ... |
      const isTableHeader = lines[i].trim().startsWith('|')
        && lines[i].trim().endsWith('|')
        && sigHeaders.some(h => lineLower.includes(h));
      if (isPlainHeader || isTableHeader) {
        cutIndex = i;
      }
    }

    if (cutIndex !== -1) {
      // Trace back and remove date strings / blank lines preceding the signature block
      let startCut = cutIndex;
      while (startCut > 0) {
        const prevLine = lines[startCut - 1].trim();
        const prevLower = prevLine.toLowerCase();
        if (
          prevLine === '' ||
          prevLower.includes('jakarta,') ||
          prevLower.includes('tanggal:') ||
          prevLower.includes('date:') ||
          prevLower.includes('tempat,') ||
          prevLower.includes('place &') ||
          /^[a-zA-Z]+, \d+ [a-zA-Z]+ \d{4}$/.test(prevLine) // e.g. "Jumat, 22 Mei 2026"
        ) {
          startCut--;
        } else {
          break;
        }
      }
      cleaned = lines.slice(0, startCut).join('\n').trim();
    }
    
    return cleaned;
  };

  const getSignatureHtml = () => {
    if (typeof window !== 'undefined' && user) {
      const savedSig = localStorage.getItem(`rifinity_signature_${user.username}`)
      const savedScale = localStorage.getItem(`rifinity_signature_scale_${user.username}`)
      const scale = savedScale ? parseFloat(savedScale) / 100 : 1.0

      const finalHeight = Math.round(75 * scale)
      const finalWidth = Math.round(170 * scale)
      const containerHeight = Math.round(80 * scale)

      const roleLabel = user.role === 'MANAGER' ? 'Warehouse Manager'
        : user.role === 'ADMIN' ? 'Warehouse Admin'
        : user.role === 'FINANCE' ? 'Finance Officer'
        : 'Warehouse Operator'

      let cName = 'PT. RIFINITY LOGISTIK GLOBAL'
      cName = localStorage.getItem('rifinity_settings_company_name') || cName

      return `
        <div class="signature-container" style="width: 100%; margin-top: 50px; font-family: 'Arial', sans-serif; page-break-inside: avoid;">
          <div style="float: right; text-align: center; width: 220px;">
            <p style="margin: 0; font-size: 10pt; color: #444;">Hormat Kami,</p>
            <p style="margin: 2px 0 0 0; font-weight: bold; font-size: 10pt; color: #111;">${cName}</p>
            <div style="height: ${containerHeight}px; display: flex; align-items: center; justify-content: center; margin: 10px 0; overflow: visible;">
              ${savedSig
                ? `<img src="${savedSig}" style="max-height: ${finalHeight}px; max-width: ${finalWidth}px; object-fit: contain; transform: scale(${scale}); transform-origin: center;" />`
                : `<div style="height: 1px; border-bottom: 1.5px solid #555; width: 150px; margin: 55px auto 0 auto;"></div>`
              }
            </div>
            <p style="text-decoration: underline; margin: 0; font-weight: bold; font-size: 10pt; color: #111;">${user.name}</p>
            <p style="font-size: 8.5pt; color: #555; margin: 2px 0 0 0;">${roleLabel}</p>
          </div>
          <div style="clear: both;"></div>
        </div>
      `
    }
    return ''
  }

  const getLetterheadHtml = () => {
    let logoHtml = `
      <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="#3b82f6" />
        <path d="M18 22L32 14L46 22V42L32 50L18 42V22Z" stroke="white" stroke-width="3" stroke-linejoin="round" />
        <path d="M32 14V32M32 32L18 22M32 32L46 22M32 32V50" stroke="white" stroke-width="2.5" stroke-linejoin="round" opacity="0.85" />
      </svg>
    `
    let cName = 'PT. RIFINITY LOGISTIK GLOBAL'
    let cTagline = 'Smart Warehouse & Digital Logistics Solutions'
    let cAddr = 'Jl. Tekno Logistik No. 88, Kawasan Industri Modern, Jakarta 12340'
    let cPhone = '(021) 8899-7711'
    let cEmail = 'support@rifinitylogistik.co.id'
    let cWeb = 'www.rifinitylogistik.co.id'

    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('rifinity_settings_company_logo')
      if (savedLogo) {
        logoHtml = `<img src="${savedLogo}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 12px;" />`
      }
      cName = localStorage.getItem('rifinity_settings_company_name') || cName
      cTagline = localStorage.getItem('rifinity_settings_company_tagline') || cTagline
      cAddr = localStorage.getItem('rifinity_settings_company_address') || cAddr
      cPhone = localStorage.getItem('rifinity_settings_company_phone') || cPhone
      cEmail = localStorage.getItem('rifinity_settings_company_email') || cEmail
      cWeb = localStorage.getItem('rifinity_settings_company_web') || cWeb
    }

    return `
      <div style="width: 100%; border-bottom: 3px double #3b82f6; padding-bottom: 12px; margin-bottom: 25px; font-family: 'Arial', sans-serif;">
        <table class="letterhead-table" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border: none; border-collapse: collapse; margin: 0; background: transparent;">
          <tr style="border: none; background: transparent;">
            <td style="width: 70px; border: none; padding: 0; vertical-align: middle; background: transparent;">
              ${logoHtml}
            </td>
            <td style="border: none; padding: 0 0 0 15px; vertical-align: middle; text-align: left; background: transparent;">
              <h1 style="margin: 0; font-size: 16pt; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase; font-family: 'Arial', sans-serif;">${cName}</h1>
              <p style="margin: 2px 0 6px 0; font-size: 8.5pt; font-weight: 600; color: #3b82f6; letter-spacing: 0.3px; text-transform: uppercase; font-style: italic; font-family: 'Arial', sans-serif;">${cTagline}</p>
              <p style="margin: 0; font-size: 8pt; color: #475569; line-height: 1.4; font-family: 'Arial', sans-serif;">
                ${cAddr}<br/>
                Telp: ${cPhone} | Email: ${cEmail} | Web: ${cWeb}
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  }

  const downloadDocx = () => {
    if (!answer) return
    
    const cleanedAnswer = cleanDraft(answer);
    const formattedHtml = markdownToHtml(cleanedAnswer, true);
    const letterhead = getLetterheadHtml();
    const sigBlock = getSignatureHtml();

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Purchase Order Draft</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .letterhead-table, .letterhead-table tr, .letterhead-table td {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
        </style>
      </head>
      <body>
        ${letterhead}
        ${formattedHtml}
        ${sigBlock}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const isInternal = !owner || owner === 'PT Rifinity Logistik';
    const fileName = isInternal 
      ? `Draft_PO_${item || 'Dokumen'}` 
      : `Surat_Restock_${item || 'Dokumen'}`;
    a.download = `${fileName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    if (!answer) return
    
    const cleanedAnswer = cleanDraft(answer);
    const formattedHtml = markdownToHtml(cleanedAnswer, true);
    const letterhead = getLetterheadHtml();
    const sigBlock = getSignatureHtml();

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
        <head>
          <title>Document Draft - PT. Rifinity Logistik Global</title>
          <style>
            @page { size: A4; margin: 2cm; }
            @media print {
              @page { size: A4; margin: 2cm; }
            }
            body { 
              font-family: 'Arial', sans-serif; 
              color: #333333; 
              line-height: 1.6; 
              margin: 0; 
              padding: 0; 
              background: #fff; 
              font-size: 11pt; 
            }
            p { margin: 0 0 10pt 0; text-align: justify; }
            hr { border: 0; border-top: 1px solid #444444; margin: 20px 0; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              font-size: 10pt; 
            }
            th { 
              text-align: left; 
              padding: 8pt; 
              font-weight: bold; 
              border-bottom: 2px solid #333333; 
              background-color: #f8f9fa; 
              border-top: 1px solid #dddddd; 
              border-left: 1px solid #dddddd; 
              border-right: 1px solid #dddddd; 
            }
            td { 
              padding: 8pt; 
              border: 1px solid #dddddd; 
            }
            tr.subtotal-row { font-weight: bold; background-color: #fafafa; }
            li { margin-left: 20px; margin-bottom: 6px; }
            h1, h2, h3, h4 { color: #111111; margin-top: 0; margin-bottom: 12pt; }
            strong { color: #111111; }
            
            .letterhead-table, .letterhead-table tr, .letterhead-table td {
              border: none !important;
              padding: 0 !important;
              background: transparent !important;
            }
            .document-container {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            ${letterhead}
            ${formattedHtml}
            ${sigBlock}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 100);
            }
          </script>
        </body>
        </html>
      `);
      doc.close();
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setIsLoading(true)
    setAnswer('')
    try {
      const savedStrict = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_strict') !== 'false' : true
      const savedCreativity = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_creativity') || '0.2' : '0.2'
      const savedContext = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_custom_context') || '' : ''
      const savedAiModel = typeof window !== 'undefined' ? localStorage.getItem('rifinity_settings_ai_model') || 'gemini-1.5-flash' : 'gemini-1.5-flash'

      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          strictPrefix: savedStrict,
          creativity: parseFloat(savedCreativity),
          customContext: savedContext,
          modelName: savedAiModel
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnswer(data.answer)
    } catch (err) {
      setAnswer(t('ai_failed_system'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">{t('docs_helper_title')}</h1>
          <p className="page-subtitle">{t('docs_helper_subtitle')}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('ask_ai_logistics')}</h3>
            </div>
            <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={t('ask_ai_placeholder')}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={isLoading} style={{ flexShrink: 0 }}>
                <Send size={18} />
              </button>
            </form>

            {isLoading && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }} />
                {t('ai_drafting_answer')}
              </div>
            )}

            {answer && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  marginTop: '1.5rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.75rem 1.25rem', 
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={14} /> {t('ai_response_draft_po')}
                  </span>
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)} 
                      className="btn-primary" 
                      style={{ 
                        padding: '0.35rem 0.75rem', 
                        fontSize: '0.75rem', 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Download size={14} /> {t('download')} <span style={{ fontSize: '0.6rem' }}>▼</span>
                    </button>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '0.5rem',
                          background: 'rgba(25, 30, 45, 0.98)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          zIndex: 10,
                          minWidth: '150px',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => {
                            downloadDocx();
                            setDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.85)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <BookOpen size={14} className="text-primary" /> {t('download_docx')}
                        </button>
                        <button
                          onClick={() => {
                            downloadPdf();
                            setDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.85)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.2s',
                            borderTop: '1px solid var(--glass-border)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <FileCheck size={14} style={{ color: '#ef4444' }} /> {t('download_pdf')}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div 
                  style={{ 
                    padding: '1.25rem', 
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: 'rgba(255,255,255,0.85)',
                    textAlign: 'justify'
                  }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(cleanDraft(answer), false) }}
                />
              </motion.div>
            )}
          </div>

          <div className="card glass">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('common_questions')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                t('common_q_1'),
                t('common_q_2'),
                t('common_q_3'),
                t('common_q_4'),
                t('common_q_5'),
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuestion(q) }}
                  style={{
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: 400,
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('document_topics')}</p>
          {docTopics.map((topic, i) => (
            <div key={i} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <topic.icon size={18} className="text-primary" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{topic.label}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{topic.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="page-container" style={{ padding: '2rem', textAlign: 'center' }}>{t('loading_docs_helper')}</div>}>
      <DocsContent />
    </Suspense>
  )
}
