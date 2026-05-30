import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/contacts?type=SUPPLIER|CUSTOMER&q=searchterm
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const q = searchParams.get('q') || '';
    const limitStr = searchParams.get('limit');
    const take = limitStr ? parseInt(limitStr) : 20;

    const contacts = await prisma.contact.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(q ? {
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { city: { contains: q } },
          ]
        } : {})
      },
      orderBy: { name: 'asc' },
      take,
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/contacts — create new contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name, company, phone, email, address, city, notes } = body;

    if (!type || !name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 });
    }

    // Check for duplicate (same type + name)
    const existing = await prisma.contact.findFirst({
      where: { type, name: { equals: name } }
    });
    if (existing) {
      return NextResponse.json(existing); // Return existing instead of error
    }

    const contact = await prisma.contact.create({
      data: { type, name, company, phone, email, address, city, notes }
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

// PUT /api/contacts — update contact
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, type, name, company, phone, email, address, city, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { type, name, company, phone, email, address, city, notes }
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE /api/contacts?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
