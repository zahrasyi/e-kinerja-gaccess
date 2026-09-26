import React, { useState, useEffect } from 'react';
import { Wifi, Activity, Users, DollarSign, Maximize2, X, Lightbulb, Filter } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar 
} from 'recharts';
import { supabase } from '../supabaseClient'; 

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
  const [modalFilterYear, setModalFilterYear] = useState(''); // State Baru untuk Tahun

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

  // --- FUNGSI FILTER KHUSUS MODAL EXPAND ---
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
    setModalFilterYear(''); // Reset filter tahun saat tutup
  };

  // --- FUNGSI KALKULASI DATA GRAFIK ---
  const getTrendPSB = (data) => {
    const raw = data.reduce((acc, curr) => {
      if (!curr.tgl_aktivasi) return acc;
      const d = new Date(curr.tgl_aktivasi);
      const dateLabel = isNaN(d.getTime()) ? curr.tgl_aktivasi : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      acc[dateLabel] = (acc[dateLabel] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(raw).map(date => ({ name: date, Total: raw[date] }));
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

  const getAbsenStats = (data) => {
    return [
      { name: 'Hadir', value: data.filter(a => a.ket === 'Hadir').length },
      { name: 'Sakit', value: data.filter(a => a.ket === 'Sakit').length },
      { name: 'Izin', value: data.filter(a => a.ket === 'Izin').length },
      { name: 'Alpha', value: data.filter(a => a.ket === 'Alpha').length },
    ].filter(s => s.value > 0);
  };

  // --- RINGKASAN DASHBOARD UTAMA ---
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

  // --- RENDER GRAFIK ---
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
      case 'absen': {
        const data = getAbsenStats(currentAbsen);
        if (data.length === 0) return noDataView;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" paddingAngle={2} dataKey="value" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
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
            <div><p className="text-sm text-slate-500 font-medium">Omzet Berbayar</p><h3 className="text-xl font-bold text-[#394059]">Rp {totalOmzet.toLocaleString('id-ID')}</h3></div>
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
          <Lightbulb className="w-6 h-6 text-[#d3d701]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#394059] uppercase tracking-wider mb-1">Insight</h4>
          <p className="text-sm font-medium leading-relaxed">{generateInsight()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm lg:col-span-2 relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({id: 'trend', title: 'Trend Pemasangan Baru (PSB)'})} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Trend Pemasangan Baru (PSB)</h3>
          <div className="h-64">{renderChart('trend', false)}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({id: 'paket', title: 'Distribusi Paket Terlaris'})} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Distribusi Paket Terlaris</h3>
          <div className="h-64">{renderChart('paket', false)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({id: 'promo', title: 'Rasio Promo vs Berbayar'})} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Promo vs Berbayar</h3>
          <div className="h-60">{renderChart('promo', false)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({id: 'performa', title: 'Top Performa Referensi (Via)'})} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Top Performa (Via)</h3>
          <div className="h-60">{renderChart('performa', false)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-[#01BFD7]/30 transition-colors">
          <button onClick={() => setExpandedChart({id: 'lembur', title: 'Beban Lembur Karyawan'})} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#01BFD7] hover:bg-[#01BFD7]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Maximize2 className="w-4 h-4" /></button>
          <h3 className="text-base font-semibold text-[#394059] mb-4">Beban Lembur Karyawan</h3>
          <div className="h-60">{renderChart('lembur', false)}</div>
        </div>
      </div>

      {/* MODAL PERBESAR GRAFIK DENGAN FITUR FILTER */}
      {expandedChart && (
        <div className="fixed inset-0 bg-[#394059]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-10">
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#F4F7FC] flex-wrap gap-4">
              <h2 className="text-xl font-bold text-[#394059] flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-[#01BFD7]" /> {expandedChart.title}
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Opsi Filter Tgl, Bulan, & Tahun */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-2 text-slate-400"><Filter className="w-4 h-4" /></div>
                  <select value={modalFilterDate} onChange={(e) => setModalFilterDate(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 pr-2 border-r border-slate-200 cursor-pointer">
                    <option value="">Semua Tgl</option>
                    {TANGGAL_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={modalFilterMonth} onChange={(e) => setModalFilterMonth(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 pr-2 border-r border-slate-200 cursor-pointer">
                    <option value="">Semua Bulan</option>
                    {BULAN_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={modalFilterYear} onChange={(e) => setModalFilterYear(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-2 cursor-pointer">
                    <option value="">Semua Tahun</option>
                    {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <button onClick={closeModal} className="p-2 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-200 shadow-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 lg:p-10 min-h-0 bg-white">
              {renderChart(expandedChart.id, true)}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}