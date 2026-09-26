import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

const DAFTAR_KARYAWAN = [
  { nama: 'ZAKI', role: 'Teknisi' }, { nama: 'SLAMET', role: 'Teknisi' }, 
  { nama: 'PAUJI', role: 'Teknisi' }, { nama: 'MADI', role: 'Teknisi' }, 
  { nama: 'NUR', role: 'Teknisi' }, { nama: 'ANAS', role: 'CS' }, 
  { nama: 'IRUL', role: 'CS' }, { nama: 'ALIEF', role: 'CS' }, 
  { nama: 'NUR CS', role: 'CS' }, { nama: 'YONA', role: 'Admin' }
];

const TANGGAL_OPTIONS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const BULAN_OPTIONS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
];
const TAHUN_OPTIONS = ['2024', '2025', '2026', '2027'];

export default function Lembur({ currentRole }) {
  const [lemburData, setLemburData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ action: 'add', id: null });
  const [formData, setFormData] = useState({});
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, id: null });

  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('lembur').select('*');
    if (data) setLemburData(data);
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const processedData = lemburData
    .filter(row => {
      if (!row.tgl) return false;
      const dateObj = new Date(row.tgl);
      const dateMatch = filterDate === '' || dateObj.getDate().toString() === filterDate;
      const monthMatch = filterMonth === '' || (dateObj.getMonth() + 1).toString() === filterMonth;
      const yearMatch = filterYear === '' || dateObj.getFullYear().toString() === filterYear;
      return dateMatch && monthMatch && yearMatch;
    })
    .sort((a, b) => {
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
    try {
      if (modalConfig.action === 'add') {
        await supabase.from('lembur').insert([formData]);
      } else {
        await supabase.from('lembur').update(formData).eq('id', modalConfig.id);
      }
      fetchData();
      closeModal();
    } catch (error) {
      alert("Gagal menyimpan data!");
    }
  };

  const confirmDelete = async () => {
    try {
      await supabase.from('lembur').delete().eq('id', deleteModalConfig.id);
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
    const d = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const t = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-[#394059]">{d}</span>
        <span className="text-[10px] font-medium text-slate-500 bg-[#F4F7FC] px-1.5 py-0.5 rounded border border-slate-200">{t} WIB</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="font-semibold text-[#394059]">Laporan Lembur</h3>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-[#F4F7FC] border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2 text-slate-400"><Filter className="w-4 h-4" /></div>
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-1.5 pr-2 border-r border-slate-200 cursor-pointer">
              <option value="">Semua Tgl</option>
              {TANGGAL_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-1.5 pr-2 border-r border-slate-200 cursor-pointer">
              <option value="">Semua Bulan</option>
              {BULAN_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-transparent text-sm text-[#394059] focus:outline-none py-1.5 px-2 cursor-pointer">
              <option value="">Semua Tahun</option>
              {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => openModal('add')} className="bg-[#01BFD7] hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity ml-auto md:ml-0">
            <Plus className="w-4 h-4" /> Tambah Lembur
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#F4F7FC] text-[#394059] text-sm border-b border-slate-200">
              <th 
                className="p-4 font-medium w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                onClick={toggleSort}
                title="Klik untuk mengurutkan tanggal"
              >
                <div className="flex items-center gap-2">
                  Tanggal
                  <div className="p-1 rounded bg-[#01BFD7]/10 text-[#01BFD7] group-hover:bg-[#01BFD7]/20 transition-colors">
                    {sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </th>
              <th className="p-4 font-medium">Nama & Divisi</th>
              <th className="p-4 font-medium">Progress Pekerjaan</th>
              <th className="p-4 font-medium text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {processedData.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-500">Data tidak ditemukan</td></tr>}
            {processedData.map((row) => (
              <tr key={row.id} className="hover:bg-[#F4F7FC]/50 transition-colors">
                <td className="p-4">{formatDateTime(row.tgl)}</td>
                <td className="p-4">
                  <p className="font-semibold text-[#394059]">{row.nama}</p>
                  <p className="text-xs text-slate-500">{row.divisi}</p>
                </td>
                <td className="p-4 text-[#394059]">{row.progress}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {currentRole !== 'user' ? (
                      <>
                        <button onClick={() => openModal('edit', row)} className="text-[#01BFD7] hover:bg-[#01BFD7]/10 p-1.5 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteModalConfig({ isOpen: true, id: row.id })} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
                    ) : <span className="text-xs text-slate-400 italic">No Access</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border-t-4 border-t-[#01BFD7]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#394059]">{modalConfig.action === 'add' ? 'Tambah Lembur' : 'Edit Lembur'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#394059] mb-1">Tgl & Jam Lembur</label>
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
                <label className="block text-sm font-medium text-[#394059] mb-1">Progress Pekerjaan</label>
                <textarea required name="progress" value={formData.progress || ''} onChange={e => setFormData({...formData, progress: e.target.value})} rows="4" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] focus:border-[#01BFD7]"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-[#394059] hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#01BFD7] hover:opacity-90 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border-t-4 border-t-red-500">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#394059] mb-2">Hapus Data?</h3>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setDeleteModalConfig({ isOpen: false, id: null })} className="px-5 py-2.5 text-sm font-medium text-[#394059] bg-slate-100 hover:bg-slate-200 rounded-xl w-full">Batal</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl w-full">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}