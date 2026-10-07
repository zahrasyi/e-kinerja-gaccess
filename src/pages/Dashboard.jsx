import React, { useState, useEffect } from 'react';
import { Wifi, Activity, Users, DollarSign, Maximize2, X, Lightbulb, Filter, UserCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar 
} from 'recharts';
import { supabase } from '../supabaseClient'; 

// WARNA SESUAI REQUEST
const BRAND_COLORS = ['#01BFD7', '#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

// Opsi Filter
const TANGGAL_OPTIONS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const BULAN_OPTIONS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
];
const TAHUN_OPTIONS = ['2024', '2025', '2026', '2027', '2028'];

export default function Dashboard({ currentRole }) {
  const [psbData, setPsbData] = useState([]);
  const [lemburData, setLemburData] = useState([]);
  const [absenData, setAbsenData] = useState([]);
  
  // State Modal & Filter
  const [expandedChart, setExpandedChart] = useState(null); 
  const [modalFilterDate, setModalFilterDate] = useState('');
  const [modalFilterMonth, setModalFilterMonth] = useState('');
  const [modalFilterYear, setModalFilterYear] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: dataPsb } = await supabase.from('psb').select('*');
    if (dataPsb) setPsbData(dataPsb);

    const { data: dataLembur } = await supabase.from('lembur').select('*');
    if (dataLembur) setLemburData(dataLembur);

    const { data: dataAbsen } = await supabase.from('absen').select('*');
    if (dataAbsen) setAbsenData(dataAbsen);
  };

  const applyFilter = (data, dateField) => {
    return data.filter(row => {
      if (!row[dateField]) return false;
      const dateObj = new Date(row[dateField]);
      const dateMatch = modalFilterDate === '' || dateObj.getDate().toString() === modalFilterDate;
      const monthMatch = modalFilterMonth === '' || (dateObj.getMonth() + 1).toString() === modalFilterMonth;
      const yearMatch = modalFilterYear === '' || dateObj.getFullYear().toString() === modalFilterYear;
      return dateMatch && monthMatch && yearMatch;
    });
  };

  const closeModal = () => {
    setExpandedChart(null);
    setModalFilterDate('');
    setModalFilterMonth('');
    setModalFilterYear('');
  };

  const getTrendPSB = (data) => {
    const raw = data.reduce((acc, curr) => {
      if (!curr.tgl_aktivasi) return acc;
      const d = new Date(curr.tgl_aktivasi);
      if (isNaN(d.getTime())) return acc;

      const dateKey = d.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          dateObj: d,
          Total: 0
        };
      }
      acc[dateKey].Total += 1;
      return acc;
    }, {});

    return Object.keys(raw)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(key => ({
        name: raw[key].dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        Total: raw[key].Total
      }));
  };

  const getPaketStats = (data) => {
    const raw = data.reduce((acc, curr) => {
      const key = curr.paket ? `Rp ${curr.paket}` : 'Lainnya';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(raw).map(key => ({ name: key, value: raw[key] }));
  };

  const getPromoStats = (data) => {
    const raw = data.reduce((acc, curr) => {
      const key = curr.keterangan || 'Berbayar';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(raw).map(key => ({ name: key, value: raw[key] }));
  };

  const getViaStats = (data) => {
    const raw = data.reduce((acc, curr) => {
      const key = curr.via || 'Tidak Ada';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(raw).map(key => ({ name: key, Total: raw[key] })).sort((a, b) => b.Total - a.Total);
  };

  const getLemburStats = (data) => {
    const raw = data.reduce((acc, curr) => {
      const key = curr.nama || 'Tanpa Nama';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(raw)
      .map((key, index) => ({ name: key, Total: raw[key], fill: BRAND_COLORS[index % BRAND_COLORS.length] }))
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 6); 
  };

  // 👇 PERBAIKAN: Fungsi Data Absensi (Pisahkan Nur CS dan Nur Teknisi)
  const getAbsenStats = (data) => {
    const groupedData = {};
    data.forEach(item => {
      if (!item.nama) return;
      
      const namaStr = String(item.nama);
      const divisiStr = item.divisi ? String(item.divisi) : 'Umum';

      // Kunci unik untuk memisahkan nama kembar (ex: "Nur-CS")
      const uniqueKey = `${namaStr}-${divisiStr}`;

      let labelName = namaStr.split(' ')[0]; 
      if (namaStr.toLowerCase() === 'nur') {
        labelName = `Nur ${divisiStr}`; 
      }

      if (!groupedData[uniqueKey]) {
        groupedData[uniqueKey] = { name: labelName, Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Total: 0 };
      }

      if (item.ket === 'Hadir') groupedData[uniqueKey].Hadir += 1;
      else if (item.ket === 'Izin') groupedData[uniqueKey].Izin += 1;
      else if (item.ket === 'Sakit') groupedData[uniqueKey].Sakit += 1;
      else if (item.ket === 'Alpha') groupedData[uniqueKey].Alpha += 1;

      groupedData[uniqueKey].Total += 1;
    });

    return Object.values(groupedData)
      .sort((a, b) => b.Total - a.Total) 
      .slice(0, 10); 
  };

  const CustomAbsenTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; 
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 min-w-[200px]">
          <p className="text-sm font-bold text-[#394059] mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#01BFD7]" /> Karyawan: {label}
          </p>
          {payload.map((entry, index) => {
            if (entry.value === 0) return null; 
            return (
              <div key={index} className="flex items-center justify-between gap-4 mb-2 text-sm">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold text-[#394059]">
                  {entry.value} hari
                </span>
              </div>
            )
          })}
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between">
            <span>Total Absensi:</span>
            <span className="text-[#394059] font-bold">{data.Total} hari</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalOmzet = psbData.reduce((acc, curr) => {
    if (curr.paket && curr.keterangan !== 'Promo') {
      const nominal = parseInt(curr.paket.replace(/\./g, ''), 10);
      return acc + (isNaN(nominal) ? 0 : nominal);
    }
    return acc;
  }, 0);

  const generateInsight = () => {
    if (psbData.length === 0) return "Sistem belum menerima data pemasangan baru bulan ini. Ayo tingkatkan penjualan!";
    let insight = `Bulan ini tercatat ${psbData.length} PSB baru. `;
    const paketStats = getPaketStats(psbData);
    if (paketStats.length > 0) {
      const topPaket = [...paketStats].sort((a, b) => b.value - a.value)[0];
      insight += `Minat tertinggi ada pada paket ${topPaket.name}. `;
    }
    const lemburStats = getLemburStats(lemburData);
    if (lemburStats.length > 0) {
      insight += `Perhatikan beban kerja ${lemburStats[0].name} yang memimpin jam lembur terbanyak.`;
    }
    return insight;
  };

  const renderChart = (chartId, isExpanded = false) => {
    const currentPsb = isExpanded ? applyFilter(psbData, 'tgl_aktivasi') : psbData;
    const currentLembur = isExpanded ? applyFilter(lemburData, 'tgl') : lemburData;
    const currentAbsen = isExpanded ? applyFilter(absenData, 'tgl') : absenData;

    const noDataView = <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-[#F4F7FC] rounded-lg border border-dashed border-slate-300">Belum ada data untuk filter ini</div>;

    switch(chartId) {
      case 'trend': {
        const data = getTrendPSB(currentPsb);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
              <RechartsTooltip cursor={{stroke: '#cbd5e1', strokeWidth: 2}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Line type="monotone" dataKey="Total" stroke="#01BFD7" strokeWidth={3} dot={{r: 4, fill: '#01BFD7'}} activeDot={{r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2}} />
            </LineChart>
          </ResponsiveContainer>
        );
      }
      case 'paket': {
        const data = getPaketStats(currentPsb);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={4} dataKey="value" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'promo': {
        const data = getPromoStats(currentPsb);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="0%" outerRadius="80%" dataKey="value" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />)}
              </Pie>
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'performa': {
        const data = getViaStats(currentPsb);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#394059', fontSize: 12, fontWeight: 600}} width={80} />
              <RechartsTooltip cursor={{fill: '#F4F7FC'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="Total" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#01BFD7' : '#8FE6F3'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'lembur': {
        const data = getLemburStats(currentLembur);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={12} data={data}>
              <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }} background clockWise dataKey="Total" />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      }
      // 👇 PERBAIKAN KODE MENGGAMBAR GRAFIK ABSEN (Dikembalikan)
      case 'absen': {
        const data = getAbsenStats(currentAbsen);
        if (data.length === 0) return noDataView;
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 30]} ticks={[0, 15, 30]} />
              <RechartsTooltip cursor={{fill: '#F4F7FC'}} content={<CustomAbsenTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '500' }} iconType="circle" />
              <Bar dataKey="Hadir" stackId="a" fill="#10B981" maxBarSize={60} />
              <Bar dataKey="Izin" stackId="a" fill="#01BFD7" maxBarSize={60} />
              <Bar dataKey="Sakit" stackId="a" fill="#A360DF" maxBarSize={60} />
              <Bar dataKey="Alpha" stackId="a" fill="#394059" maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      
      <div className={`grid grid-cols-1 md:grid-cols-2 ${currentRole !== 'user' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#01BFD7]/10 text-[#01BFD7] rounded-lg flex items-center justify-center"><Wifi className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Total PSB</p><h3 className="text-2xl font-bold text-[#394059]">{psbData.length}</h3></div>
        </div>

        {currentRole !== 'user' && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#10B981]/10 text-[#10B981] rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
            <div><p className="text-sm text-slate-500 font-medium">Est. Omzet Berbayar</p><h3 className="text-xl font-bold text-[#394059]">Rp {totalOmzet.toLocaleString('id-ID')}</h3></div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Total Lembur</p><h3 className="text-2xl font-bold text-[#394059]">{lemburData.length}</h3></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-lg flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Data Kehadiran</p><h3 className="text-2xl font-bold text-[#394059]">{absenData.length}</h3></div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#E2FAFD] to-white border border-[#01BFD7]/20 rounded-xl p-5 shadow-sm flex items-center gap-4 text-[#394059]">
        <div className="bg-[#01BFD7]/10 p-2.5 rounded-full flex-shrink-0 animate-pulse">
          <Lightbulb className="w-6 h-6 text-[#01BFD7]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">Insight Otomatis</h4>
          <p className="text-sm font-medium leading-relaxed">{generateInsight()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'trend', title: 'Trend Pemasangan Baru (PSB)', desc: 'Melihat pergerakan naik-turunnya jumlah pelanggan baru berdasarkan tanggal aktivasi.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Trend Pemasangan Baru (PSB)</h3>
          <div className="h-64">{renderChart('trend', false)}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'paket', title: 'Distribusi Paket Terlaris', desc: 'Menganalisis paket layanan mana yang paling diminati pelanggan.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Distribusi Paket Terlaris</h3>
          <div className="h-64">{renderChart('paket', false)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'promo', title: 'Rasio Promo vs Berbayar', desc: 'Membandingkan jumlah pendaftar harga normal (Berbayar) dengan pendaftar harga Promo.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Promo vs Berbayar</h3>
          <div className="h-60">{renderChart('promo', false)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'performa', title: 'Top Performa Referensi (Via)', desc: 'Mengevaluasi pihak/teknisi yang paling banyak mendatangkan pelanggan baru.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Top Performa (Via)</h3>
          <div className="h-60">{renderChart('performa', false)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'lembur', title: 'Beban Lembur Karyawan', desc: 'Memantau jam lembur tambahan untuk mencegah beban kerja yang tidak merata.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Beban Lembur Karyawan</h3>
          <div className="h-60">{renderChart('lembur', false)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 w-full">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({
            id: 'absen', title: 'Akumulasi Hari Kehadiran per Karyawan', desc: 'Memantau jumlah hari kehadiran (Hadir, Izin, Sakit, Alpha) untuk masing-masing karyawan.'
          })} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          
          <h3 className="text-base font-semibold text-[#394059] flex items-center gap-2 mb-6">
            <UserCheck className="w-5 h-5 text-[#01BFD7]" />
            Akumulasi Kehadiran Bulanan (Maks 30 Hari)
          </h3>
          <div className="h-80">{renderChart('absen', false)}</div>
        </div>
      </div>

      {expandedChart && (
        <div className="fixed inset-0 bg-[#394059]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-10">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-[#F4F7FC] flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#394059] flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-[#01BFD7]" /> {expandedChart.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1.5 lg:ml-7 leading-relaxed">
                    {expandedChart.desc}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 lg:self-start self-end">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-2 text-slate-400 hidden sm:block"><Filter className="w-4 h-4" /></div>
                    <select value={modalFilterDate} onChange={(e) => setModalFilterDate(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-1 border-r border-slate-200 cursor-pointer">
                      <option value="">Tgl</option>
                      {TANGGAL_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={modalFilterMonth} onChange={(e) => setModalFilterMonth(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-1 border-r border-slate-200 cursor-pointer">
                      <option value="">Bulan</option>
                      {BULAN_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={modalFilterYear} onChange={(e) => setModalFilterYear(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-1 cursor-pointer">
                      <option value="">Tahun</option>
                      {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <button onClick={closeModal} className="p-2 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 shadow-sm transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </div>

            <div className="flex-1 p-6 lg:p-10 min-h-0 bg-white flex flex-col items-center justify-center">
              {renderChart(expandedChart.id, true)}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}