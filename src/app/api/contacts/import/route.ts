import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/contacts/import — Auto-learn contacts from existing transaction history
export async function POST() {
  try {
    let imported = 0;

    // --- Import SUPPLIERS from IN transactions ---
    const inboundTxns = await prisma.transaction.findMany({
      where: { type: 'IN', supplier: { not: null } },
      select: { supplier: true },
      distinct: ['supplier'],
    });

    for (const tx of inboundTxns) {
      if (!tx.supplier || tx.supplier.trim() === '') continue;
      const existing = await prisma.contact.findFirst({
        where: { type: 'SUPPLIER', name: tx.supplier.trim() }
      });
      if (!existing) {
        await prisma.contact.create({
          data: { type: 'SUPPLIER', name: tx.supplier.trim() }
        });
        imported++;
      }
    }

    // --- Import CUSTOMERS from OUT transactions ---
    const outboundTxns = await prisma.transaction.findMany({
      where: { type: 'OUT', recipient: { not: null } },
      select: { recipient: true, recipientCity: true, recipientAddr: true },
      distinct: ['recipient'],
    });

    for (const tx of outboundTxns) {
      if (!tx.recipient || tx.recipient.trim() === '') continue;
      const existing = await prisma.contact.findFirst({
        where: { type: 'CUSTOMER', name: tx.recipient.trim() }
      });
      if (!existing) {
        await prisma.contact.create({
          data: {
            type: 'CUSTOMER',
            name: tx.recipient.trim(),
            city: tx.recipientCity || undefined,
            address: tx.recipientAddr || undefined,
          }
        });
        imported++;
      }
    }

    // --- Also import from Item.supplier field ---
    const itemSuppliers = await prisma.item.findMany({
      where: { supplier: { not: null } },
      select: { supplier: true },
      distinct: ['supplier'],
    });

    for (const item of itemSuppliers) {
      if (!item.supplier || item.supplier.trim() === '') continue;
      const existing = await prisma.contact.findFirst({
        where: { type: 'SUPPLIER', name: item.supplier.trim() }
      });
      if (!existing) {
        await prisma.contact.create({
          data: { type: 'SUPPLIER', name: item.supplier.trim() }
        });
        imported++;
      }
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 });
  }
}
