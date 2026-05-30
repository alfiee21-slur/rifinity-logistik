import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const transactions = await prisma.transaction.findMany({
      where: type ? { type } : undefined,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { item: true }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Common fields
      itemName, sku, category, quantity, unit, notes,
      type = 'IN', buyPrice = 0, sellPrice = 0, owner,

      // IN-specific
      supplier, rackLocation, location,

      // OUT-specific
      recipient, recipientCity, recipientAddr,
      courierName, courierCode, awbNumber,
      shippingCost = 0, paymentMethod
    } = body;
    
    const parsedQty = parseInt(quantity) || 0;
    const parsedBuyPrice = parseFloat(buyPrice) || 0;
    const parsedSellPrice = parseFloat(sellPrice) || 0;
    const parsedShippingCost = parseFloat(shippingCost) || 0;
    
    // Find or create the item
    let item = await prisma.item.findUnique({ where: { sku } });
    
    if (item) {
      item = await prisma.item.update({
        where: { id: item.id },
        data: {
          quantity: type === 'IN' ? item.quantity + parsedQty : Math.max(0, item.quantity - parsedQty),
          ...(type === 'IN' && parsedBuyPrice > 0 ? { buyPrice: parsedBuyPrice } : {}),
          ...(type === 'IN' && parsedSellPrice > 0 ? { sellPrice: parsedSellPrice } : {}),
          ...(type === 'IN' && supplier ? { supplier } : {}),
          ...(type === 'IN' && rackLocation ? { rackLocation } : {}),
          ...(type === 'IN' && location ? { location } : {}),
        }
      });
    } else {
      item = await prisma.item.create({
        data: {
          name: itemName,
          sku,
          category,
          quantity: parsedQty,
          unit,
          location: location || 'TBD',
          buyPrice: parsedBuyPrice,
          sellPrice: parsedSellPrice,
          owner: owner || 'PT Rifinity Logistik',
          supplier: supplier || null,
          rackLocation: rackLocation || null,
        }
      });
    }
    
    // Calculate total value (goods only, shipping is a pass-through)
    const transactionValue = parsedQty * (type === 'IN' ? item.buyPrice : item.sellPrice);
    
    // Record transaction with structured fields
    const transaction = await prisma.transaction.create({
      data: {
        itemId: item.id,
        type,
        quantity: parsedQty,
        totalValue: transactionValue,
        notes: notes || null,

        // IN fields
        supplier: type === 'IN' ? (supplier || null) : null,

        // OUT fields
        recipient: type === 'OUT' ? (recipient || null) : null,
        recipientCity: type === 'OUT' ? (recipientCity || null) : null,
        recipientAddr: type === 'OUT' ? (recipientAddr || null) : null,
        courierName: type === 'OUT' ? (courierName || null) : null,
        courierCode: type === 'OUT' ? (courierCode || null) : null,
        awbNumber: type === 'OUT' ? (awbNumber || null) : null,
        shippingCost: type === 'OUT' ? parsedShippingCost : 0,
        paymentMethod: type === 'OUT' ? (paymentMethod || 'Tunai') : null,
      }
    });

    // Tulis Audit Log untuk Transaksi Inbound / Outbound
    if (type === 'IN') {
      await createAuditLog('TRANSACTION_IN', `Melakukan Inbound barang "${item.name}" (SKU: ${item.sku}) sebanyak ${parsedQty} ${item.unit} dari supplier "${supplier || 'N/A'}".`);
    } else {
      await createAuditLog('TRANSACTION_OUT', `Melakukan Outbound barang "${item.name}" (SKU: ${item.sku}) sebanyak ${parsedQty} ${item.unit} ke "${recipient || 'N/A'}" (${recipientCity || 'N/A'}) via ${courierName || 'N/A'}.`);
    }

    return NextResponse.json({ success: true, transaction, item });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }
}
