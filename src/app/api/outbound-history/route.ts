import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "0" to "11" or "all"
    const year = searchParams.get('year');   // e.g. "2026" or "all"
    const search = searchParams.get('search'); // query

    let whereClause: any = { type: 'OUT' };

    // Handle Date filters
    if (month && month !== 'all' && year && year !== 'all') {
      const parsedMonth = parseInt(month);
      const parsedYear = parseInt(year);
      const start = new Date(parsedYear, parsedMonth, 1);
      const end = new Date(parsedYear, parsedMonth + 1, 0, 23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    } else if (year && year !== 'all') {
      const parsedYear = parseInt(year);
      const start = new Date(parsedYear, 0, 1);
      const end = new Date(parsedYear, 12, 0, 23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    }

    // Handle Search filter
    if (search && search.trim() !== '') {
      const term = search.trim();
      whereClause.OR = [
        { recipient: { contains: term } },
        { recipientCity: { contains: term } },
        { recipientAddr: { contains: term } },
        { awbNumber: { contains: term } },
        { courierName: { contains: term } },
        { notes: { contains: term } },
        { item: { name: { contains: term } } },
        { item: { sku: { contains: term } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { item: true }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching outbound history:', error);
    return NextResponse.json({ error: 'Failed to fetch outbound history' }, { status: 500 });
  }
}
