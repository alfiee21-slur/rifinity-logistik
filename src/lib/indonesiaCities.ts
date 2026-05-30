export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  provinceId: string;
  name: string;
  type: 'Kota' | 'Kabupaten';
  lat: number;
  lng: number;
}

export const PROVINCES: Province[] = [
  { id: '1', name: 'Aceh' },
  { id: '2', name: 'Sumatera Utara' },
  { id: '3', name: 'Sumatera Barat' },
  { id: '4', name: 'Riau' },
  { id: '5', name: 'Kepulauan Riau' },
  { id: '6', name: 'Jambi' },
  { id: '7', name: 'Sumatera Selatan' },
  { id: '8', name: 'Kepulauan Bangka Belitung' },
  { id: '9', name: 'Bengkulu' },
  { id: '10', name: 'Lampung' },
  { id: '11', name: 'DKI Jakarta' },
  { id: '12', name: 'Banten' },
  { id: '13', name: 'Jawa Barat' },
  { id: '14', name: 'Jawa Tengah' },
  { id: '15', name: 'DI Yogyakarta' },
  { id: '16', name: 'Jawa Timur' },
  { id: '17', name: 'Bali' },
  { id: '18', name: 'Nusa Tenggara Barat (NTB)' },
  { id: '19', name: 'Nusa Tenggara Timur (NTT)' },
  { id: '20', name: 'Kalimantan Barat' },
  { id: '21', name: 'Kalimantan Tengah' },
  { id: '22', name: 'Kalimantan Selatan' },
  { id: '23', name: 'Kalimantan Timur' },
  { id: '24', name: 'Kalimantan Utara' },
  { id: '25', name: 'Sulawesi Utara' },
  { id: '26', name: 'Sulawesi Tengah' },
  { id: '27', name: 'Sulawesi Selatan' },
  { id: '28', name: 'Sulawesi Tenggara' },
  { id: '29', name: 'Gorontalo' },
  { id: '30', name: 'Sulawesi Barat' },
  { id: '31', name: 'Maluku' },
  { id: '32', name: 'Maluku Utara' },
  { id: '33', name: 'Papua' },
  { id: '34', name: 'Papua Barat' },
  { id: '35', name: 'Papua Tengah' },
  { id: '36', name: 'Papua Pegunungan' },
  { id: '37', name: 'Papua Selatan' },
  { id: '38', name: 'Papua Barat Daya' }
];

// Helper to generate coordinates centered around province with jitter
const PROVINCE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  '1': { lat: 4.6951, lng: 96.7494 },     // Aceh
  '2': { lat: 2.1154, lng: 99.5451 },     // Sumatera Utara
  '3': { lat: -0.7399, lng: 100.8000 },    // Sumatera Barat
  '4': { lat: 0.2933, lng: 101.7068 },     // Riau
  '5': { lat: 3.9162, lng: 108.2361 },     // Kepulauan Riau
  '6': { lat: -1.6185, lng: 102.7797 },    // Jambi
  '7': { lat: -3.3194, lng: 104.9147 },    // Sumatera Selatan
  '8': { lat: -2.7410, lng: 106.4406 },    // Bangka Belitung
  '9': { lat: -3.7928, lng: 102.2608 },    // Bengkulu
  '10': { lat: -4.5586, lng: 105.4000 },   // Lampung
  '11': { lat: -6.2088, lng: 106.8456 },   // DKI Jakarta
  '12': { lat: -6.4058, lng: 106.0600 },   // Banten
  '13': { lat: -6.9175, lng: 107.6191 },   // Jawa Barat
  '14': { lat: -7.1510, lng: 110.1400 },   // Jawa Tengah
  '15': { lat: -7.7956, lng: 110.3695 },   // DI Yogyakarta
  '16': { lat: -7.5360, lng: 112.2384 },   // Jawa Timur
  '17': { lat: -8.4095, lng: 115.1889 },   // Bali
  '18': { lat: -8.6529, lng: 117.3616 },   // NTB
  '19': { lat: -8.6573, lng: 121.0794 },   // NTT
  '20': { lat: -0.2788, lng: 111.4753 },   // Kalimantan Barat
  '21': { lat: -1.6815, lng: 113.3824 },   // Kalimantan Tengah
  '22': { lat: -3.0926, lng: 115.2838 },   // Kalimantan Selatan
  '23': { lat: 1.0820, lng: 116.5000 },    // Kalimantan Timur
  '24': { lat: 3.0731, lng: 116.0414 },    // Kalimantan Utara
  '25': { lat: 0.6247, lng: 123.9750 },    // Sulawesi Utara
  '26': { lat: -1.4300, lng: 121.4457 },   // Sulawesi Tengah
  '27': { lat: -5.1477, lng: 119.4327 },   // Sulawesi Selatan
  '28': { lat: -4.1449, lng: 122.1746 },   // Sulawesi Tenggara
  '29': { lat: 0.6999, lng: 122.4556 },    // Gorontalo
  '30': { lat: -2.8441, lng: 119.2321 },   // Sulawesi Barat
  '31': { lat: -3.2384, lng: 130.1453 },   // Maluku
  '32': { lat: 1.5700, lng: 127.8000 },    // Maluku Utara
  '33': { lat: -4.2699, lng: 138.0804 },   // Papua
  '34': { lat: -1.3361, lng: 133.1747 },   // Papua Barat
  '35': { lat: -3.7500, lng: 136.0000 },   // Papua Tengah
  '36': { lat: -4.0000, lng: 139.0000 },   // Papua Pegunungan
  '37': { lat: -6.5000, lng: 140.0000 },   // Papua Selatan
  '38': { lat: -1.0000, lng: 131.0000 }    // Papua Barat Daya
};

const CITY_RAW_DATA: Record<string, string[]> = {
  '1': ['Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam', 'Aceh Besar', 'Aceh Utara', 'Aceh Timur', 'Aceh Barat', 'Pidie', 'Gayo Lues', 'Bener Meriah'],
  '2': ['Medan', 'Binjai', 'Gunungsitoli', 'Padang Sidempuan', 'Pematangsiantar', 'Sibolga', 'Tanjungbalai', 'Tebing Tinggi', 'Deli Serdang', 'Langkat', 'Karo', 'Asahan', 'Samosir'],
  '3': ['Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Solok', 'Sawahlunto', 'Padang Panjang', 'Agam', 'Pasaman', 'Tanah Datar', 'Kepulauan Mentawai'],
  '4': ['Pekanbaru', 'Dumai', 'Kampar', 'Bengkalis', 'Indragiri Hilir', 'Indragiri Hulu', 'Siak', 'Pelalawan', 'Rokan Hulu', 'Rokan Hilir'],
  '5': ['Tanjungpinang', 'Batam', 'Bintan', 'Karimun', 'Natuna', 'Kepulauan Anambas', 'Lingga'],
  '6': ['Jambi', 'Sungai Penuh', 'Muaro Jambi', 'Batanghari', 'Tanjung Jabung Barat', 'Tanjung Jabung Timur', 'Bungo', 'Tebo', 'Merangin', 'Sarolangun'],
  '7': ['Palembang', 'Lubuklinggau', 'Pagar Alam', 'Prabumulih', 'Banyuasin', 'Musi Banyuasin', 'Ogan Komering Ilir', 'Ogan Komering Ulu', 'Muara Enim'],
  '8': ['Pangkalpinang', 'Bangka', 'Bangka Barat', 'Bangka Tengah', 'Bangka Selatan', 'Belitung', 'Belitung Timur'],
  '9': ['Bengkulu', 'Bengkulu Utara', 'Bengkulu Selatan', 'Rejang Lebong', 'Mukomuko', 'Seluma', 'Kaur', 'Lebong', 'Kepahiang'],
  '10': ['Bandar Lampung', 'Metro', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Utara', 'Lampung Timur', 'Pesawaran', 'Pringsewu', 'Tanggamus'],
  '11': ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'],
  '12': ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon', 'Lebak', 'Pandeglang', 'Kabupaten Tangerang', 'Kabupaten Serang'],
  '13': ['Bandung', 'Bekasi', 'Depok', 'Bogor', 'Cimahi', 'Tasikmalaya', 'Cirebon', 'Sukabumi', 'Banjar', 'Karawang', 'Cianjur', 'Garut', 'Subang', 'Sumedang', 'Purwakarta', 'Indramayu', 'Majalengka', 'Ciamis', 'Kuningan', 'Pangandaran'],
  '14': ['Semarang', 'Surakarta', 'Salatiga', 'Magelang', 'Pekalongan', 'Tegal', 'Banyumas', 'Cilacap', 'Brebes', 'Kudus', 'Jepara', 'Pati', 'Demak', 'Grobogan', 'Boyolali', 'Klaten', 'Sukoharjo', 'Wonogiri', 'Karanganyar', 'Sragen', 'Kebumen', 'Purworejo', 'Wonosobo', 'Temanggung', 'Kendal', 'Batang', 'Pemalang'],
  '15': ['Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul'],
  '16': ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Kediri', 'Madiun', 'Probolinggo', 'Pasuruan', 'Blitar', 'Batu', 'Banyuwangi', 'Jember', 'Bojonegoro', 'Tuban', 'Lamongan', 'Mojokerto', 'Jombang', 'Nganjuk', 'Magetan', 'Ngawi', 'Ponorogo', 'Pacitan', 'Trenggalek', 'Tulungagung', 'Lumajang', 'Bondowoso', 'Situbondo', 'Pamekasan', 'Sumenep', 'Sampang', 'Bangkalan'],
  '17': ['Denpasar', 'Badung', 'Gianyar', 'Buleleng', 'Tabanan', 'Karangasem', 'Klungkung', 'Bangli', 'Jembrana'],
  '18': ['Mataram', 'Bima', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara', 'Sumbawa', 'Sumbawa Barat', 'Dompu'],
  '19': ['Kupang', 'Ende', 'Sikka', 'Flores Timur', 'Manggarai', 'Alor', 'Belu', 'Rote Ndao', 'Sumba Timur', 'Sumba Barat'],
  '20': ['Pontianak', 'Singkawang', 'Kubu Raya', 'Mempawah', 'Sambas', 'Ketapang', 'Sintang', 'Kapuas Hulu', 'Landak'],
  '21': ['Palangkaraya', 'Kotawaringin Barat', 'Kotawaringin Timur', 'Kapuas', 'Barito Selatan', 'Barito Utara', 'Katingan', 'Seruyan'],
  '22': ['Banjarmasin', 'Banjarbaru', 'Banjar', 'Tanah Laut', 'Kotabaru', 'Tabalong', 'Hulu Sungai Selatan', 'Barito Kuala'],
  '23': ['Samarinda', 'Balikpapan', 'Bontang', 'Kutai Kartanegara', 'Kutai Timur', 'Kutai Barat', 'Berau', 'Paser', 'Penajam Paser Utara'],
  '24': ['Tanjung Selor', 'Tarakan', 'Nunukan', 'Malinau', 'Bulungan', 'Tana Tidung'],
  '25': ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Minahasa', 'Bolaang Mongondow', 'Kepulauan Sangihe'],
  '26': ['Palu', 'Donggala', 'Poso', 'Toli-Toli', 'Banggai', 'Morowali', 'Parigi Moutong', 'Sigi'],
  '27': ['Makassar', 'Parepare', 'Palopo', 'Gowa', 'Maros', 'Bone', 'Bulukumba', 'Toraja Utara', 'Tana Toraja', 'Luwu', 'Wajo', 'Bantaeng'],
  '28': ['Kendari', 'Baubau', 'Konawe', 'Kolaka', 'Muna', 'Buton', 'Bombana', 'Wakatobi'],
  '29': ['Gorontalo', 'Gorontalo Utara', 'Boalemo', 'Pohuwan', 'Bone Bolango'],
  '30': ['Mamuju', 'Majene', 'Polewali Mandar', 'Mamasa', 'Mamuju Tengah'],
  '31': ['Ambon', 'Tual', 'Maluku Tengah', 'Maluku Tenggara', 'Kepulauan Aru', 'Seram Bagian Barat', 'Seram Bagian Timur'],
  '32': ['Ternate', 'Tidore Kepulauan', 'Halmahera Utara', 'Halmahera Selatan', 'Halmahera Barat', 'Kepulauan Sula'],
  '33': ['Jayapura', 'Biak Numfor', 'Kepulauan Yapen', 'Keerom', 'Sarmi', 'Mamberamo Raya'],
  '34': ['Manokwari', 'Fakfak', 'Kaimana', 'Teluk Wondama', 'Teluk Bintuni'],
  '35': ['Nabire', 'Mimika', 'Paniai', 'Intan Jaya', 'Puncak', 'Dogiyai'],
  '36': ['Wamena', 'Jayawijaya', 'Lanny Jaya', 'Tolikara', 'Nduga', 'Yalimo'],
  '37': ['Merauke', 'Boven Digoel', 'Mappi', 'Asmat'],
  '38': ['Sorong', 'Raja Ampat', 'Sorong Selatan', 'Maybrat', 'Tambrauw']
};

export const CITIES: City[] = (() => {
  const list: City[] = [];
  let globalId = 1;

  PROVINCES.forEach(prov => {
    const rawCities = CITY_RAW_DATA[prov.id] || [];
    const centroid = PROVINCE_CENTROIDS[prov.id] || { lat: 0, lng: 0 };

    rawCities.forEach((cityName, idx) => {
      const isKota = cityName.startsWith('Banda Aceh') || cityName.startsWith('Jakarta') || 
                     cityName.startsWith('Surabaya') || cityName.startsWith('Bandung') || 
                     cityName.startsWith('Medan') || cityName.startsWith('Makassar') || 
                     cityName.startsWith('Semarang') || cityName.startsWith('Palembang') || 
                     cityName.startsWith('Denpasar') || cityName.startsWith('Ambon') || 
                     cityName.startsWith('Ternate') || cityName.startsWith('Jayapura') || 
                     cityName.startsWith('Manado') || cityName.startsWith('Palu') || 
                     cityName.startsWith('Kendari') || cityName.startsWith('Gorontalo') || 
                     cityName.startsWith('Mataram') || cityName.startsWith('Kupang') || 
                     cityName.startsWith('Pontianak') || cityName.startsWith('Samarinda') || 
                     cityName.startsWith('Banjarmasin') || cityName.startsWith('Yogyakarta') ||
                     cityName.startsWith('Langsa') || cityName.startsWith('Lhokseumawe') || 
                     cityName.startsWith('Sabang') || cityName.startsWith('Subulussalam') || 
                     cityName.startsWith('Binjai') || cityName.startsWith('Gunungsitoli') || 
                     cityName.startsWith('Padang') || cityName.startsWith('Bukittinggi') || 
                     cityName.startsWith('Payakumbuh') || cityName.startsWith('Solok') || 
                     cityName.startsWith('Pariaman') || cityName.startsWith('Dumai') || 
                     cityName.startsWith('Tanjungpinang') || cityName.startsWith('Batam') || 
                     cityName.startsWith('Sungai Penuh') || cityName.startsWith('Lubuklinggau') || 
                     cityName.startsWith('Metro') || cityName.startsWith('Tangerang') || 
                     cityName.startsWith('Cilegon') || cityName.startsWith('Serang') || 
                     cityName.startsWith('Bekasi') || cityName.startsWith('Depok') || 
                     cityName.startsWith('Bogor') || cityName.startsWith('Cimahi') || 
                     cityName.startsWith('Tasikmalaya') || cityName.startsWith('Cirebon') || 
                     cityName.startsWith('Sukabumi') || cityName.startsWith('Banjar') || 
                     cityName.startsWith('Malang') || cityName.startsWith('Batu') || 
                     cityName.startsWith('Bima') || cityName.startsWith('Singkawang') || 
                     cityName.startsWith('Tarakan') || cityName.startsWith('Bitung') || 
                     cityName.startsWith('Tomohon') || cityName.startsWith('Kotamobagu') || 
                     cityName.startsWith('Parepare') || cityName.startsWith('Palopo') || 
                     cityName.startsWith('Baubau') || cityName.startsWith('Tual') || 
                     cityName.startsWith('Sorong') || cityName.startsWith('Nabire') || 
                     cityName.startsWith('Wamena') || cityName.startsWith('Merauke') || 
                     cityName.split(' ').length === 1; // Simplification

      // Jitter for unique coordinates
      const angle = (idx / rawCities.length) * 2 * Math.PI;
      const radius = 0.15 + (idx * 0.05); // dynamic deviation from center
      const latJitter = radius * Math.sin(angle);
      const lngJitter = radius * Math.cos(angle);

      list.push({
        id: globalId.toString(),
        provinceId: prov.id,
        name: (isKota ? 'Kota ' : 'Kab. ') + cityName,
        type: isKota ? 'Kota' : 'Kabupaten',
        lat: centroid.lat + latJitter,
        lng: centroid.lng + lngJitter
      });
      globalId++;
    });
  });

  return list;
})();
