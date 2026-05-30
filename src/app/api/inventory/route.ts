import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, location, status } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const updateData: any = {};
    let isReactivation = false;
    let isLocationChange = false;

    if (location !== undefined) {
      updateData.location = location;
      isLocationChange = true;
    }
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'AKTIF') {
        isReactivation = true;
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData
    });

    // Write audit logs based on the type of update
    if (isReactivation) {
      await createAuditLog('ITEM_ACTIVATE', `Mengaktifkan kembali barang "${updatedItem.name}" (SKU: ${updatedItem.sku}) di sistem WMS.`);
    } else if (isLocationChange) {
      await createAuditLog('ITEM_UPDATE', `Mengubah lokasi barang "${updatedItem.name}" (SKU: ${updatedItem.sku}) menjadi "${location}".`);
    }
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID barang wajib disertakan' }, { status: 400 });
    }

    // Selalu lakukan Soft Delete (ubah status menjadi NONAKTIF) sesuai instruksi pengguna
    const updated = await prisma.item.update({
      where: { id },
      data: { status: 'NONAKTIF' }
    });

    // Tulis Audit Log
    await createAuditLog('ITEM_DEACTIVATE', `Menonaktifkan barang "${updated.name}" (SKU: ${updated.sku}) dari daftar operasional WMS.`);

    return NextResponse.json({ 
      success: true, 
      action: 'SOFT_DELETE', 
      item: updated,
      message: 'Barang berhasil dinonaktifkan dari sistem WMS.'
    });
  } catch (error: any) {
    console.error('Error executing delete action:', error);
    return NextResponse.json({ error: error.message || 'Gagal menonaktifkan barang' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      sku, 
      category, 
      owner, 
      quantity, 
      unit, 
      location, 
      rackLocation, 
      supplier, 
      buyPrice, 
      sellPrice 
    } = body;

    if (!name || !sku || !category) {
      return NextResponse.json({ error: 'Nama, SKU, dan Kategori wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.item.findUnique({
      where: { sku }
    });

    if (existing) {
      return NextResponse.json({ error: `SKU '${sku}' sudah digunakan oleh barang '${existing.name}'` }, { status: 400 });
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        sku,
        category,
        owner: owner || 'PT Rifinity Logistik',
        quantity: parseInt(quantity) || 0,
        unit: unit || 'pcs',
        location: location || 'TBD',
        rackLocation: rackLocation || 'TBD',
        supplier: supplier || '',
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0
      }
    });

    // Tulis Audit Log
    await createAuditLog('ITEM_CREATE', `Menambahkan barang baru "${newItem.name}" (SKU: ${newItem.sku}) dengan stok awal ${newItem.quantity} ${newItem.unit}.`);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Gagal menambahkan barang baru' }, { status: 500 });
  }
}
