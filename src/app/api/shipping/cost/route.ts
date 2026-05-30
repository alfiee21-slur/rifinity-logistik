import { NextResponse } from 'next/server';
import { CITIES, PROVINCES } from '@/lib/indonesiaCities';

const ORIGIN_CITY = { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 };

// Haversine Distance Formula between coordinates
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(request: Request) {
  try {
    const { destinationId, weightKg } = await request.json();
    
    if (!destinationId) {
      return NextResponse.json({ error: 'Missing destinationId' }, { status: 400 });
    }
    
    const weight = parseFloat(weightKg) || 1.0;
    const destCity = CITIES.find(c => c.id === destinationId);
    
    if (!destCity) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }
    
    // Calculate geographic distance from Yogyakarta (gudang asal)
    const distance = getDistanceKm(ORIGIN_CITY.lat, ORIGIN_CITY.lng, destCity.lat, destCity.lng);
    
    // Generate dynamic shipping courier choices with realistic pricing
    const services = [
      {
        code: 'jne',
        name: 'JNE Regular (REG)',
        baseCostPerKg: Math.round(7500 + (distance * 11.5)),
        eta: Math.max(1, Math.round(1 + (distance / 400))) + ' - ' + Math.max(2, Math.round(2 + (distance / 350))) + ' Hari'
      },
      {
        code: 'jnt',
        name: 'J&T Express (Standard)',
        baseCostPerKg: Math.round(7000 + (distance * 9.8)),
        eta: Math.max(1, Math.round(1 + (distance / 450))) + ' - ' + Math.max(2, Math.round(2 + (distance / 400))) + ' Hari'
      },
      {
        code: 'sicepat',
        name: 'SiCepat Reg (HALU)',
        baseCostPerKg: Math.round(6200 + (distance * 8.5)),
        eta: Math.max(1, Math.round(2 + (distance / 350))) + ' - ' + Math.max(3, Math.round(3 + (distance / 300))) + ' Hari'
      }
    ];
    
    // Calculate absolute totals for this package weight
    const results = services.map(s => {
      let finalCost = s.baseCostPerKg * weight;
      
      // Yogyakarta local delivery is cheap and flat
      if (destCity.name.includes('Yogyakarta') || destCity.name.includes('Sleman') || destCity.name.includes('Bantul')) {
        finalCost = s.code === 'sicepat' ? 7000 : s.code === 'jnt' ? 8000 : 9000;
        s.eta = '1 Hari (Sameday)';
      }
      
      return {
        code: s.code,
        name: s.name,
        cost: Math.round(finalCost),
        eta: s.eta
      };
    });
    
    return NextResponse.json({
      origin: ORIGIN_CITY.name,
      destination: destCity.name,
      distanceKm: Math.round(distance),
      weightKg: weight,
      options: results
    });
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return NextResponse.json({ error: 'Failed to calculate shipping cost' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    provinces: PROVINCES,
    cities: CITIES
  });
}
