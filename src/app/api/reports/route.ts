import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    
    // Parse selected month & year (default to current if not provided)
    const monthParam = searchParams.get('month'); // "0" to "11"
    const yearParam = searchParams.get('year'); // "2026"
    
    const selectedMonth = monthParam !== null ? parseInt(monthParam) : now.getMonth();
    const selectedYear = yearParam !== null ? parseInt(yearParam) : now.getFullYear();

    // 1. Calculate boundaries for the filtered month
    const startOfFiltered = new Date(selectedYear, selectedMonth, 1);
    const endOfFiltered = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    
    // Check if the selected month is the current month
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const daysToDivide = isCurrentMonth ? Math.max(now.getDate(), 1) : endOfFiltered.getDate();

    // 2. Volume metrics for the filtered month
    const inboundFiltered = await prisma.transaction.aggregate({
      where: { type: 'IN', createdAt: { gte: startOfFiltered, lte: endOfFiltered } },
      _sum: { quantity: true }
    });
    
    const outboundFiltered = await prisma.transaction.aggregate({
      where: { type: 'OUT', createdAt: { gte: startOfFiltered, lte: endOfFiltered } },
      _sum: { quantity: true }
    });

    const averageDaily = Math.round(
      ((inboundFiltered._sum.quantity || 0) + (outboundFiltered._sum.quantity || 0)) / daysToDivide
    );

    // 3. Financial metrics for the filtered month (WMS 3PL Logic)
    const outTransactions = await prisma.transaction.findMany({
      where: { 
        type: 'OUT',
        createdAt: { gte: startOfFiltered, lte: endOfFiltered }
      },
      include: { item: true }
    });

    const inTransactions = await prisma.transaction.findMany({
      where: { 
        type: 'IN',
        createdAt: { gte: startOfFiltered, lte: endOfFiltered }
      },
      include: { item: true }
    });

    // 3PL Handling Fee: Rp 2.500 per unit packed for clients
    let internalIncome = 0;
    let fulfillmentRevenue = 0;
    for (const tx of outTransactions) {
      if (tx.item?.owner === 'PT Rifinity Logistik') {
        internalIncome += tx.totalValue;
      } else {
        fulfillmentRevenue += tx.quantity * 2500;
      }
    }

    // PT Expense: Only count purchases of our own inventory, not client consigned goods
    let totalExpense = 0;
    for (const tx of inTransactions) {
      if (tx.item?.owner === 'PT Rifinity Logistik') {
        totalExpense += tx.totalValue;
      }
    }

    const totalIncome = internalIncome + fulfillmentRevenue;
    const netProfit = totalIncome - totalExpense;

    // Logistics shipping expenditures
    const shippingAgg = await prisma.transaction.aggregate({
      where: { 
        type: 'OUT',
        createdAt: { gte: startOfFiltered, lte: endOfFiltered }
      },
      _sum: { shippingCost: true }
    });
    const totalShippingCost = shippingAgg._sum.shippingCost || 0;

    // Real-Time Asset Valuation & Storage Insurance Valuation
    const itemsWithStock = await prisma.item.findMany({
      where: { quantity: { gt: 0 } },
      select: { quantity: true, buyPrice: true, owner: true }
    });
    
    let totalAssetValuation = 0;
    let clientAssetValuation = 0;
    let totalStockUnits = 0;
    for (const item of itemsWithStock) {
      totalStockUnits += item.quantity;
      if (item.owner === 'PT Rifinity Logistik') {
        totalAssetValuation += item.quantity * item.buyPrice;
      } else {
        clientAssetValuation += item.quantity * item.buyPrice;
      }
    }

    // Inventory Turnover = berapa kali stok "berputar" dalam sebulan
    // Formula WMS: Outbound units / Inbound units bulan itu (perputaran vs penerimaan)
    // Fallback: Outbound / Avg stok, ditampilkan dengan presisi adaptif
    const outboundUnits = outboundFiltered._sum.quantity || 0;
    const inboundUnits = inboundFiltered._sum.quantity || 0;

    let turnoverValue: string;
    if (outboundUnits === 0) {
      turnoverValue = '0x';
    } else if (inboundUnits > 0) {
      // Ratio outbound vs inbound: angka > 1 artinya lebih banyak keluar dari masuk
      const ratio = outboundUnits / inboundUnits;
      turnoverValue = (ratio < 0.01 ? ratio.toFixed(3) : ratio < 0.1 ? ratio.toFixed(2) : ratio.toFixed(1)) + 'x';
    } else if (totalStockUnits > 0) {
      // Tidak ada inbound bulan ini, pakai stok saat ini sebagai penyebut
      const ratio = outboundUnits / totalStockUnits;
      turnoverValue = (ratio < 0.01 ? ratio.toFixed(3) : ratio < 0.1 ? ratio.toFixed(2) : ratio.toFixed(1)) + 'x';
    } else {
      turnoverValue = '0x';
    }

    // 4. Top active items for that specific filtered month
    const topItemsData = await prisma.transaction.groupBy({
      by: ['itemId'],
      where: { createdAt: { gte: startOfFiltered, lte: endOfFiltered } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const items = await prisma.item.findMany({
      where: { id: { in: topItemsData.map(t => t.itemId) } },
      select: { id: true, name: true }
    });

    const maxMoves = topItemsData.length > 0 ? topItemsData[0]._count.id : 1;
    const topItems = topItemsData.map(t => ({
      name: items.find(i => i.id === t.itemId)?.name || 'Unknown',
      moves: t._count.id,
      pct: Math.round((t._count.id / maxMoves) * 100)
    }));

    // 5. Rolling 6-month historical operational volume (always Dec to May / last 6 months)
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

    return NextResponse.json({
      summary: {
        totalInbound: inboundFiltered._sum.quantity || 0,
        totalOutbound: outboundFiltered._sum.quantity || 0,
        averageDaily,
        turnover: turnoverValue,
        totalExpense,
        totalIncome,
        netProfit,
        totalShippingCost,
        totalAssetValuation,
        clientAssetValuation,
        fulfillmentRevenue,
        internalSales: internalIncome,
        selectedMonth,
        selectedYear
      },
      topItems,
      monthlyData
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
