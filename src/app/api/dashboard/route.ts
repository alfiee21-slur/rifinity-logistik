import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const criticalQuery = searchParams.get('critical');
    const predictiveQuery = searchParams.get('predictive');
    
    const criticalThreshold = criticalQuery ? parseInt(criticalQuery) : 5;
    const predictiveThreshold = predictiveQuery ? parseInt(predictiveQuery) : 20;

    const totalItems = await prisma.item.count();
    
    // Total units is sum of all quantity
    const items = await prisma.item.findMany({ select: { quantity: true } });
    const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
    
    const criticalStock = await prisma.item.count({
      where: { quantity: { lte: criticalThreshold } }
    });
    
    const recentActivity = await prisma.transaction.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { item: { select: { name: true } } }
    });

    const predictiveAlerts = await prisma.item.findMany({
      where: { quantity: { lte: predictiveThreshold } },
      take: 6,
      orderBy: { quantity: 'asc' }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const incomeAgg = await prisma.transaction.aggregate({
      where: { 
        type: 'OUT',
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { totalValue: true }
    });
    
    const expenseAgg = await prisma.transaction.aggregate({
      where: { 
        type: 'IN',
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { totalValue: true }
    });

    // Rolling 6-month historical operational volume
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const inAgg = await prisma.transaction.aggregate({
        where: { type: 'IN', createdAt: { gte: start, lte: end } },
        _sum: { quantity: true }
      });
      const outAgg = await prisma.transaction.aggregate({
        where: { type: 'OUT', createdAt: { gte: start, lte: end } },
        _sum: { quantity: true }
      });

      monthlyData.push({
        month: monthNames[d.getMonth()],
        inbound: inAgg._sum.quantity || 0,
        outbound: outAgg._sum.quantity || 0
      });
    }

    // 30-day daily breakdown
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const inDay = await prisma.transaction.aggregate({
        where: { type: 'IN', createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { quantity: true }
      });
      const outDay = await prisma.transaction.aggregate({
        where: { type: 'OUT', createdAt: { gte: dayStart, lte: dayEnd } },
        _sum: { quantity: true }
      });

      dailyData.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        fullDate: dayStart.toISOString(),
        inbound: inDay._sum.quantity || 0,
        outbound: outDay._sum.quantity || 0,
      });
    }

    return NextResponse.json({
      totalItems,
      totalUnits,
      criticalStock,
      recentActivity,
      predictiveAlerts,
      totalIncome: incomeAgg._sum.totalValue || 0,
      totalExpense: expenseAgg._sum.totalValue || 0,
      monthlyData,
      dailyData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
