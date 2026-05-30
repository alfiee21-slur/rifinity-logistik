/**
 * Rifinity Logistik - Web Bluetooth Thermal Printer Engine & Simulator Parser
 * Standard ESC/POS implementation for BLE Thermal Printers
 */

// Connection state type
export type BluetoothPrinterState = 
  | 'disconnected'
  | 'connecting'
  | 'connected_sim'
  | 'connected_real'
  | 'printing'
  | 'error';

// Standard common BLE Thermal Printer Service and Characteristic UUIDs
export const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE Printer Service
  'e7e1a220-4f7a-11e1-b13c-0800200c9a66', // Custom thermal printer service
  '00001101-0000-1000-8000-00805f9b34fb', // SPP Serial Service (Common in dual-mode printers)
];

// ────────────────────────────────────────────────────────────────────────
// 1. ESC/POS ENCODER
// ────────────────────────────────────────────────────────────────────────
export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.initialize();
  }

  // Initialize printer (ESC @)
  initialize() {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  // Set alignment (ESC a n)
  // 0: Left, 1: Center, 2: Right
  align(alignment: 'left' | 'center' | 'right') {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1B, 0x61, val);
    return this;
  }

  // Bold mode (ESC E n)
  bold(enable: boolean) {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  // Text size (GS ! n)
  // 0x00: Normal, 0x01: Double Height, 0x10: Double Width, 0x11: Double Width & Height
  size(fontSize: 'normal' | 'double-height' | 'double-width' | 'double-both') {
    let val = 0x00;
    if (fontSize === 'double-height') val = 0x01;
    else if (fontSize === 'double-width') val = 0x10;
    else if (fontSize === 'double-both') val = 0x11;
    this.buffer.push(0x1D, 0x21, val);
    return this;
  }

  // Write simple text line
  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i));
    }
    return this;
  }

  // Write text line and feed line (LF)
  textLine(str: string) {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  // Draw separator line based on standard 32-character (58mm) or 48-character (80mm) width
  line(char = '-', width = 32) {
    this.textLine(char.repeat(width));
    return this;
  }

  // Feed n lines (LF)
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  // Set Barcode Height (GS h n)
  // n: height in dots, 1 to 255 (default 162)
  barcodeHeight(height = 80) {
    this.buffer.push(0x1D, 0x68, height);
    return this;
  }

  // Set Barcode Width (GS w n)
  // n: 2, 3, 4 (default 3)
  barcodeWidth(width = 2) {
    this.buffer.push(0x1D, 0x77, width);
    return this;
  }

  // Print Barcode (GS k m n d1...dn)
  // m = 73 (Code 128), n = length, d = chars
  barcode(code: string) {
    this.barcodeHeight(60);
    this.barcodeWidth(2);
    
    // GS k 73 len
    this.buffer.push(0x1D, 0x6B, 73, code.length);
    for (let i = 0; i < code.length; i++) {
      this.buffer.push(code.charCodeAt(i));
    }
    this.buffer.push(0x0A); // print feed
    return this;
  }

  // Get final Uint8Array buffer
  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// ────────────────────────────────────────────────────────────────────────
// 2. ESC/POS PARSER FOR SIMULATOR
// ────────────────────────────────────────────────────────────────────────
export interface SimulatedSegment {
  type: 'text' | 'barcode' | 'line';
  text?: string;
  barcodeValue?: string;
  bold: boolean;
  size: 'normal' | 'double-height' | 'double-width' | 'double-both';
}

export interface SimulatedLine {
  align: 'left' | 'center' | 'right';
  segments: SimulatedSegment[];
}

export class EscPosParser {
  static parse(bytes: Uint8Array): SimulatedLine[] {
    const lines: SimulatedLine[] = [];
    let currentLine: SimulatedLine = { align: 'left', segments: [] };
    
    let bold = false;
    let size: 'normal' | 'double-height' | 'double-width' | 'double-both' = 'normal';
    
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      
      // 1. ESC @ (Initialize)
      if (b === 0x1B && bytes[i + 1] === 0x40) {
        bold = false;
        size = 'normal';
        currentLine.align = 'left';
        i += 2;
        continue;
      }
      
      // 2. ESC a n (Alignment)
      if (b === 0x1B && bytes[i + 1] === 0x61) {
        const alignVal = bytes[i + 2];
        let align: 'left' | 'center' | 'right' = 'left';
        if (alignVal === 1) align = 'center';
        if (alignVal === 2) align = 'right';
        
        // If current line already has segments, push it and start a new line with the new alignment
        if (currentLine.segments.length > 0) {
          lines.push(currentLine);
          currentLine = { align, segments: [] };
        } else {
          currentLine.align = align;
        }
        i += 3;
        continue;
      }
      
      // 3. ESC E n (Bold Mode)
      if (b === 0x1B && bytes[i + 1] === 0x45) {
        bold = bytes[i + 2] === 1;
        i += 3;
        continue;
      }
      
      // 4. GS ! n (Font Size)
      if (b === 0x1D && bytes[i + 1] === 0x21) {
        const sizeVal = bytes[i + 2];
        if (sizeVal === 0x01) size = 'double-height';
        else if (sizeVal === 0x10) size = 'double-width';
        else if (sizeVal === 0x11) size = 'double-both';
        else size = 'normal';
        i += 3;
        continue;
      }
      
      // Skip barcode settings
      if (b === 0x1D && bytes[i + 1] === 0x68) { i += 3; continue; } // GS h height
      if (b === 0x1D && bytes[i + 1] === 0x77) { i += 3; continue; } // GS w width

      // 5. GS k m n d1...dn (Barcode Code 128)
      if (b === 0x1D && bytes[i + 1] === 0x6B) {
        const m = bytes[i + 2];
        if (m === 73) { // Code 128 format 2
          const len = bytes[i + 3];
          let barcodeVal = '';
          for (let j = 0; j < len; j++) {
            barcodeVal += String.fromCharCode(bytes[i + 4 + j]);
          }
          currentLine.segments.push({
            type: 'barcode',
            barcodeValue: barcodeVal,
            bold: false,
            size: 'normal'
          });
          i += 4 + len;
          continue;
        }
      }
      
      // 6. LF (Line Feed - New Line)
      if (b === 0x0A) {
        lines.push(currentLine);
        currentLine = { align: currentLine.align, segments: [] };
        i++;
        continue;
      }
      
      // 7. Regular ASCII text characters
      let textStr = '';
      while (i < bytes.length && bytes[i] !== 0x1B && bytes[i] !== 0x1D && bytes[i] !== 0x0A) {
        textStr += String.fromCharCode(bytes[i]);
        i++;
      }
      
      if (textStr) {
        // Detect if text is mostly dashes or equals, represent as visual divider line
        const isDivider = (textStr.trim().length > 10) && 
                          (textStr.replace(/-|=|\*/g, '').trim().length === 0);
        
        currentLine.segments.push({
          type: isDivider ? 'line' : 'text',
          text: textStr,
          bold,
          size
        });
      }
    }
    
    // Push remaining line if it contains segments
    if (currentLine.segments.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

// ────────────────────────────────────────────────────────────────────────
// 3. WEB BLUETOOTH DRIVER (REALHARDWARE DRIVER)
// ────────────────────────────────────────────────────────────────────────
export class WebBluetoothPrinterManager {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private connectionState: BluetoothPrinterState = 'disconnected';
  private onStateChange: (state: BluetoothPrinterState, errorMsg?: string) => void = () => {};

  constructor(onStateChange?: (state: BluetoothPrinterState, errorMsg?: string) => void) {
    if (onStateChange) this.onStateChange = onStateChange;
  }

  // Connect to Simulated Printer (Mock)
  async connectSimulator() {
    this.connectionState = 'connecting';
    this.onStateChange('connecting');
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Smooth simulation delay
    
    this.connectionState = 'connected_sim';
    this.onStateChange('connected_sim');
  }

  // Connect to Real Bluetooth GATT Server
  async connectRealDevice() {
    if (!(navigator as any).bluetooth) {
      this.onStateChange('error', 'Browser Anda tidak mendukung Web Bluetooth API.');
      throw new Error('Web Bluetooth not supported');
    }

    try {
      this.connectionState = 'connecting';
      this.onStateChange('connecting');

      // Request Bluetooth device accepting general devices
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS
      });

      this.device = device;
      
      // Auto-disconnect listener
      device.addEventListener('gattserverdisconnected', () => {
        this.disconnect();
      });

      const server = await device.gatt.connect();
      this.server = server;

      // Find standard writable printer characteristic
      let writeChar: any = null;
      
      // Scan registered services
      for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          
          // Find first characteristic that supports 'write' or 'writeWithoutResponse'
          writeChar = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) break;
        } catch (e) {
          // Continue scanning next service UUID
          console.warn(`Service ${serviceUuid} not found on this device.`);
        }
      }

      // Fallback service scanning if above generic fail
      if (!writeChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            const chars = await service.getCharacteristics();
            writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
            if (writeChar) break;
          }
        } catch (e) {
          console.error('Error scanning all services:', e);
        }
      }

      if (!writeChar) {
        throw new Error('Tidak dapat menemukan karakteristik penulisan printer (Write characteristic).');
      }

      this.characteristic = writeChar;
      this.connectionState = 'connected_real';
      this.onStateChange('connected_real');

    } catch (err: any) {
      const isCancelled = err.name === 'NotFoundError' || err.message?.includes('cancelled');
      this.connectionState = 'disconnected';
      
      if (isCancelled) {
        this.onStateChange('disconnected');
      } else {
        this.onStateChange('error', err.message);
      }
      throw err;
    }
  }

  // Disconnect active devices
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.connectionState = 'disconnected';
    this.onStateChange('disconnected');
  }

  // Get current connection state
  getState() {
    return this.connectionState;
  }

  // Print raw bytes
  async print(bytes: Uint8Array) {
    if (this.connectionState === 'connected_sim') {
      this.onStateChange('printing');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate printing progress
      this.onStateChange('connected_sim');
      return;
    }

    if (this.connectionState !== 'connected_real' || !this.characteristic) {
      throw new Error('Printer tidak terhubung.');
    }

    this.onStateChange('printing');

    try {
      // Chunk writing for BLE stability (MTU usually limited to 20-100 bytes)
      const chunkSize = 20;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        
        // Write chunk based on characteristic support
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValueWithResponse(chunk);
        }
        
        // Tiny pacing delay to prevent cheap buffer overflow
        await new Promise(resolve => setTimeout(resolve, 25));
      }

      this.onStateChange('connected_real');
    } catch (err: any) {
      this.onStateChange('error', 'Gagal mencetak data: ' + err.message);
      throw err;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────
// 4. ESC/POS FORMATTER HELPERS FOR LOGISTICS LABEL DATA
// ────────────────────────────────────────────────────────────────────────
export function generateLogisticsLabelEscPos(label: {
  recipient: string;
  city: string;
  address: string;
  courier: string;
  resi: string;
  paymentMethod: string;
  itemName: string;
  qty: number;
  unit: string;
  weight: string;
  date: string;
  notes: string;
}): Uint8Array {
  const encoder = new EscPosEncoder();
  
  // Format courier prefix block
  const courierUpper = label.courier.toUpperCase();
  let courierShort = 'EXPRESS';
  if (courierUpper.includes('J&T')) courierShort = 'J&T EXPRESS';
  else if (courierUpper.includes('SICEPAT')) courierShort = 'SICEPAT REG';
  else if (courierUpper.includes('JNE')) courierShort = 'JNE REG';

  encoder.initialize();

  // 1. Header Brand & Courier
  encoder.align('center');
  encoder.size('double-height');
  encoder.bold(true);
  encoder.textLine(courierShort);
  
  encoder.size('normal');
  encoder.bold(false);
  encoder.textLine('RIFINITY LOGISTIK WMS');
  encoder.line('-');

  // 2. Barcode
  encoder.align('center');
  encoder.barcode(label.resi);
  encoder.bold(true);
  encoder.textLine(label.resi);
  encoder.bold(false);
  encoder.line('-');

  // 3. Recipient / Receiver
  encoder.align('left');
  encoder.bold(true);
  encoder.textLine('PENERIMA:');
  encoder.size('double-height');
  encoder.textLine(label.recipient.toUpperCase());
  
  encoder.size('normal');
  encoder.bold(false);
  encoder.textLine(label.address);
  encoder.bold(true);
  encoder.textLine(`KOTA: ${label.city.toUpperCase()}`);
  encoder.bold(false);
  encoder.line('-');

  // 4. Sender / Pengirim
  encoder.textLine('PENGIRIM:');
  encoder.bold(true);
  encoder.textLine('PT. RIFINITY LOGISTIK');
  encoder.bold(false);
  encoder.textLine('WMS Fulfillment Center, Yogyakarta');
  encoder.line('-');

  // 5. Package Content Details
  encoder.bold(true);
  encoder.textLine('DETAIL BARANG:');
  encoder.bold(false);
  encoder.textLine(`${label.itemName}`);
  encoder.bold(true);
  encoder.textLine(`Jumlah: ${label.qty} ${label.unit} | Berat: ${label.weight}`);
  encoder.bold(false);
  encoder.line('-');

  // 6. Footer (Payment & Notes)
  encoder.align('center');
  encoder.bold(true);
  encoder.size('double-height');
  encoder.textLine(label.paymentMethod.toUpperCase());
  
  encoder.size('normal');
  if (label.notes) {
    encoder.align('left');
    encoder.bold(false);
    encoder.textLine(`Catatan: ${label.notes}`);
  }
  
  encoder.align('center');
  encoder.textLine(`Tanggal: ${label.date}`);
  encoder.textLine('Terima kasih atas kepercayaan Anda!');
  encoder.feed(3); // extra paper feeding space to pull paper out of printer

  return encoder.getBuffer();
}

export function generateStockLabelEscPos(item: {
  name: string;
  sku: string;
  quantity: number | string;
  unit: string;
  owner: string;
  location: string;
  rackLocation?: string;
}): Uint8Array {
  const encoder = new EscPosEncoder();
  
  encoder.initialize();

  // 1. Header Brand & Label Type
  encoder.align('center');
  encoder.bold(true);
  encoder.textLine('RIFINITY WMS');
  encoder.size('double-height');
  encoder.textLine('STOCK BIN LABEL');
  
  encoder.size('normal');
  encoder.bold(false);
  encoder.line('-');

  // 2. Barcode SKU
  encoder.align('center');
  encoder.barcode(item.sku);
  encoder.bold(true);
  encoder.textLine(item.sku);
  encoder.bold(false);
  encoder.line('-');

  // 3. Item Details
  encoder.align('left');
  encoder.bold(true);
  encoder.text('NAMA: ');
  encoder.bold(false);
  encoder.textLine(item.name.toUpperCase());
  
  encoder.bold(true);
  encoder.text('PEMILIK: ');
  encoder.bold(false);
  encoder.textLine((item.owner || 'PT RIFINITY LOGISTIK').toUpperCase());
  
  encoder.bold(true);
  encoder.text(`JUMLAH: ${item.quantity} ${item.unit || 'pcs'}`);
  encoder.feed(1);
  encoder.line('-');

  // 4. Rack Location block
  encoder.align('center');
  encoder.bold(true);
  encoder.size('double-height');
  const loc = item.rackLocation || item.location || 'ZONA-A / RAK-01';
  encoder.textLine(loc.toUpperCase());
  
  encoder.size('normal');
  encoder.bold(false);
  encoder.feed(3); // extra paper feeding space to pull paper out of printer

  return encoder.getBuffer();
}
