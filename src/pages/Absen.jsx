import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Filter, ArrowDown, ArrowUp, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

// 👇 Panggil file cetak yang baru saja kita buat
import PrintTemplate from '../components/PrintTemplates';

// Sesuaikan nama-nama ini dengan daftar karyawan di kantormu
const DAFTAR_KARYAWAN = [
  { nama: 'Madi', role: 'Teknisi' }, { nama: 'Zaki', role: 'Teknisi' },
  { nama: 'Pauji', role: 'Teknisi' }, { nama: 'Slamet', role: 'Teknisi' },
  { nama: 'Nur', role: 'Teknisi' }, { nama: 'Irul', role: 'CS' }, { nama: 'Anas', role: 'CS' }, 
  { nama: 'Nur', role: 'CS' }, { nama: 'Alif', role: 'CS' }, { nama: 'Yona', role: 'Admin' }
];

const TANGGAL_OPTIONS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const BULAN_OPTIONS = [
  { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' }, { value: '8', label: 'Agu' }, { value: '9', label: 'Sep' },
  { value: '10', label: 'Okt' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Des' }
];
const TAHUN_OPTIONS = ['2024', '2025', '2026', '2027'];

export default function Absen({ currentRole }) {
  const [absenData, setAbsenData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ action: 'add', id: null });
  const [formData, setFormData] = useState({});
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, id: null });
  
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => { 
    const { data, error } = await supabase.from('absen').select('*'); 
    if (error) alert("Error tarik data: " + error.message);
    if (data) setAbsenData(data); 
  };
  
  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  const handlePrint = () => { window.print(); };

  const processedData = absenData.filter(row => {
      if (!row.tgl) return (filterDate === '' && filterMonth === '' && filterYear === '');
      const dateObj = new Date(row.tgl);
      const dateMatch = filterDate === '' || dateObj.getDate().toString() === filterDate;
      const monthMatch = filterMonth === '' || (dateObj.getMonth() + 1).toString() === filterMonth;
      const yearMatch = filterYear === '' || dateObj.getFullYear().toString() === filterYear;
      return dateMatch && monthMatch && yearMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.tgl).getTime() || 0;
      const dateB = new Date(b.tgl).getTime() || 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const openModal = (action, data = null) => {
    setModalConfig({ action, id: data ? data.id : null });
    let prepData = action === 'edit' && data ? { ...data } : {};
    if (prepData.tgl) {
      const d = new Date(prepData.tgl);
      if (!isNaN(d.getTime())) prepData.tgl = d.toISOString().slice(0, 16);
    }
    setFormData(prepData);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...formData }; 
  
    try {
      let sbError = null;
      if (modalConfig.action === 'add') {
        const maxNo = absenData.reduce((max, row) => {
          const currentNo = parseInt(row.no) || 0;
          return currentNo > max ? currentNo : max;
        }, 0);
        finalData.no = maxNo + 1; 
  
        const { error } = await supabase.from('absen').insert([finalData]); 
        sbError = error;
      } else {
        const { error } = await supabase.from('absen').update(finalData).eq('id', modalConfig.id);
        sbError = error;
      }
      
      if (sbError) {
        alert("GAGAL SIMPAN!\nPesan Error: " + sbError.message);
        return;
      }
      fetchData();
      closeModal();
    } catch (error) {
      alert("Terjadi kesalahan sistem!");
    }
  };

  const confirmDelete = async () => {
    try { 
      await supabase.from('absen').delete().eq('id', deleteModalConfig.id); 
      fetchData(); 
      setDeleteModalConfig({ isOpen: false, id: null }); 
    } catch (error) { 
      alert("Gagal menghapus data!"); 
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-[#394059]">{date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span className="text-[10px] font-medium text-slate-500 bg-[#F4F7FC] print:bg-transparent px-1.5 py-0.5 rounded border print:border-none border-slate-200">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
      </div>
    );
  };

  // 👇 TEKS PERIODE DINAMIS UNTUK DIKIRIM KE KOP SURAT
  const teksPeriode = `${filterDate ? filterDate : ''} ${filterMonth ? BULAN_OPTIONS.find(m => m.value === filterMonth)?.label : 'Semua Bulan'} ${filterYear || 'Semua Tahun'}`;

  return (
    // 👇 BUNGKUS DENGAN COMPONENT CETAK KITA
    <PrintTemplate title="Laporan Kehadiran Karyawan" periodeText={teksPeriode}>
      
      <div className="bg-white rounded-xl shadow-sm print:shadow-none border border-slate-100 print:border-none overflow-hidden w-full">
        
        {/* AREA FILTER - Diberi class "no-print" agar otomatis hilang saat dicetak */}
        <div className="no-print p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="font-semibold text-[#394059] flex-shrink-0">Data Absensi</h3>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-wrap items-center bg-[#F4F7FC] border border-slate-200 rounded-lg overflow-hidden w-full sm:w-auto">
              <div className="px-2 text-slate-400 py-1.5 hidden sm:block"><Filter className="w-4 h-4" /></div>
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="flex-1 bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-2 border-r border-slate-200 cursor-pointer">
                <option value="">Tgl</option>{TANGGAL_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-2 border-r border-slate-200 cursor-pointer">
                <option value="">Bulan</option>{BULAN_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="flex-1 bg-transparent text-sm text-[#394059] focus:outline-none py-2 px-2 cursor-pointer">
                <option value="">Tahun</option>{TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handlePrint} className="bg-slate-100 hover:bg-slate-200 text-[#394059] px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors flex-1 sm:flex-none border border-slate-200">
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button onClick={() => openModal('add')} className="bg-[#01BFD7] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity flex-1 sm:flex-none">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>
          </div>
        </div>
        
        {/* AREA TABEL */}
        <div className="overflow-x-auto print:overflow-visible w-full pb-2">
          <table className="w-full text-left border-collapse min-w-[700px] print:min-w-full">
            <thead>
              <tr className="bg-[#F4F7FC] print:bg-slate-100 text-[#394059] text-sm border-b border-slate-200 print:border-slate-400">
                <th className="p-4 font-bold w-12 whitespace-nowrap print:border print:border-slate-300 print:text-center print:p-2 text-center">No</th>
                <th className="p-4 font-bold w-48 cursor-pointer hover:bg-slate-100 transition-colors select-none group whitespace-nowrap print:border print:border-slate-300 print:p-2" onClick={toggleSort}>
                  <div className="flex items-center gap-2">Tgl & Jam Absen <div className="no-print p-1 rounded bg-[#01BFD7]/10 text-[#01BFD7]">{sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}</div></div>
                </th>
                <th className="p-4 font-bold whitespace-nowrap print:border print:border-slate-300 print:p-2">Nama Karyawan</th>
                <th className="p-4 font-bold whitespace-nowrap print:border print:border-slate-300 print:p-2">Keterangan</th>
                <th className="p-4 font-bold text-center whitespace-nowrap no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 print:divide-slate-300">
              {processedData.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 print:border print:border-slate-300">Data tidak ditemukan</td></tr>}
              {processedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#F4F7FC]/50 transition-colors print:break-inside-avoid">
                  <td className="p-4 print:p-2 print:border print:border-slate-300 text-center font-bold text-[#394059]">{row.no || '-'}</td>
                  <td className="p-4 print:p-2 print:border print:border-slate-300 whitespace-nowrap">{formatDateTime(row.tgl)}</td>
                  <td className="p-4 print:p-2 print:border print:border-slate-300">
                    <p className="font-semibold text-[#394059]">{row.nama}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{row.divisi || '-'}</p>
                  </td>
                  <td className="p-4 print:p-2 print:border print:border-slate-300 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold print:bg-transparent print:border print:text-[#394059] print:border-slate-400
                      ${row.ket === 'Hadir' ? 'bg-green-100 text-green-700' : 
                        row.ket === 'Izin' ? 'bg-blue-100 text-blue-700' : 
                        row.ket === 'Sakit' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {row.ket}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap no-print">
                    <div className="flex justify-center gap-2">
                      {currentRole !== 'user' ? (
                        <>
                          <button onClick={() => openModal('edit', row)} className="text-[#01BFD7] hover:bg-[#01BFD7]/10 p-2 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteModalConfig({ isOpen: true, id: row.id })} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : <span className="text-xs text-slate-400 italic">No Access</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Tambah/Edit (.no-print) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border-t-4 border-t-[#01BFD7]">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-[#394059]">{modalConfig.action === 'add' ? 'Isi Absensi' : 'Edit Absensi'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1">Tgl & Jam Absen</label>
                  <input required type="datetime-local" name="tgl" value={formData.tgl || ''} onChange={e => setFormData({...formData, tgl: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] focus:border-[#01BFD7] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1">Nama Karyawan</label>
                  <select required name="nama" value={formData.nama || ''} 
                    onChange={(e) => {
                      const employee = DAFTAR_KARYAWAN.find(k => k.nama === e.target.value);
                      if (employee) setFormData({...formData, nama: employee.nama, divisi: employee.role});
                      else setFormData({...formData, nama: '', divisi: ''});
                    }} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] focus:border-[#01BFD7]">
                    <option value="">Pilih Karyawan...</option>
                    {DAFTAR_KARYAWAN.map(k => <option key={k.nama} value={k.nama}>{k.nama} - {k.role}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1">Keterangan Kehadiran</label>
                  <select required name="ket" value={formData.ket || ''} onChange={e => setFormData({...formData, ket: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] focus:border-[#01BFD7]">
                    <option value="">Pilih Keterangan...</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpha">Alpha</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-[#394059] hover:bg-slate-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#01BFD7] hover:opacity-90 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Hapus (.no-print) */}
        {deleteModalConfig.isOpen && (
          <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border-t-4 border-t-red-500">
              <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#394059] mb-2">Hapus Data?</h3>
              <div className="flex justify-center gap-3 mt-6 flex-col sm:flex-row">
                <button onClick={() => setDeleteModalConfig({ isOpen: false, id: null })} className="px-5 py-2.5 text-sm font-medium text-[#394059] bg-slate-100 hover:bg-slate-200 rounded-xl w-full">Batal</button>
                <button onClick={confirmDelete} className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl w-full">Ya, Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrintTemplate>
  );
}