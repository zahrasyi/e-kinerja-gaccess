import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Filter, ArrowDown, ArrowUp } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

const PAKET_OPTIONS = ['112.000', '125.000', '165.000', '224.000'];
const TANGGAL_OPTIONS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const BULAN_OPTIONS = [
  { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' }, { value: '8', label: 'Agu' }, { value: '9', label: 'Sep' },
  { value: '10', label: 'Okt' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Des' }
];
const TAHUN_OPTIONS = ['2024', '2025', '2026', '2027'];

export default function Psb({ currentRole }) {
  const [psbData, setPsbData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ action: 'add', id: null });
  const [formData, setFormData] = useState({});
  const [deleteModalConfig, setDeleteModalConfig] = useState({ isOpen: false, id: null });
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const { data } = await supabase.from('psb').select('*'); if (data) setPsbData(data); };
  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

  const processedData = psbData.filter(row => {
      if (!row.tgl_aktivasi) return false;
      const dateObj = new Date(row.tgl_aktivasi);
      const dateMatch = filterDate === '' || dateObj.getDate().toString() === filterDate;
      const monthMatch = filterMonth === '' || (dateObj.getMonth() + 1).toString() === filterMonth;
      const yearMatch = filterYear === '' || dateObj.getFullYear().toString() === filterYear;
      return dateMatch && monthMatch && yearMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.tgl_aktivasi).getTime() || 0;
      const dateB = new Date(b.tgl_aktivasi).getTime() || 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const openModal = (action, data = null) => {
    setModalConfig({ action, id: data ? data.id : null });
    if (action === 'edit' && data) {
      let prepData = { ...data };
      if (data.paket && !PAKET_OPTIONS.includes(data.paket)) prepData.isPaketLainnya = true;
      if (prepData.tgl_aktivasi) {
        const d = new Date(prepData.tgl_aktivasi);
        if (!isNaN(d.getTime())) prepData.tgl_aktivasi = d.toISOString().slice(0, 16);
      }
      setFormData(prepData);
    } else { setFormData({}); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setFormData({}); };
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalData = { ...formData }; delete finalData.isPaketLainnya; 
    try {
      if (modalConfig.action === 'add') await supabase.from('psb').insert([finalData]);
      else await supabase.from('psb').update(finalData).eq('id', modalConfig.id);
      fetchData(); closeModal();
    } catch (error) { alert("Terjadi kesalahan sistem/jaringan!"); }
  };

  const confirmDelete = async () => {
    try { await supabase.from('psb').delete().eq('id', deleteModalConfig.id); fetchData(); setDeleteModalConfig({ isOpen: false, id: null }); } 
    catch (error) { alert("Gagal menghapus data!"); }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-[#394059]">{date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span className="text-[10px] font-medium text-slate-500 bg-[#F4F7FC] px-1.5 py-0.5 rounded border border-slate-200">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden w-full">
      
      {/* FILTER RESPONSIVE */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 className="font-semibold text-[#394059] flex-shrink-0">Data Pemasangan (PSB)</h3>
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
          <button onClick={() => openModal('add')} className="bg-[#01BFD7] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>
      
      {/* TABEL RESPONSIVE (min-w ditambahkan agar bisa di-scroll horizontal, tidak gepeng) */}
      <div className="overflow-x-auto w-full pb-2">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#F4F7FC] text-[#394059] text-sm border-b border-slate-200">
              <th className="p-4 font-medium w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none group whitespace-nowrap" onClick={toggleSort}>
                <div className="flex items-center gap-2">Tgl Aktivasi <div className="p-1 rounded bg-[#01BFD7]/10 text-[#01BFD7]">{sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}</div></div>
              </th>
              <th className="p-4 font-medium whitespace-nowrap">Pelanggan (NIK/Kontak)</th>
              <th className="p-4 font-medium whitespace-nowrap">IP & Via</th>
              <th className="p-4 font-medium whitespace-nowrap">Paket</th>
              <th className="p-4 font-medium whitespace-nowrap">Keterangan</th>
              <th className="p-4 font-medium text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {processedData.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">Data tidak ditemukan</td></tr>}
            {processedData.map((row) => (
              <tr key={row.id} className="hover:bg-[#F4F7FC]/50 transition-colors">
                <td className="p-4 whitespace-nowrap">{formatDateTime(row.tgl_aktivasi)}</td>
                <td className="p-4">
                  <p className="font-semibold text-[#394059]">{row.nama}</p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{row.alamat} • {row.no_hp}</p>
                  <p className="text-slate-400 text-xs mt-0.5">NIK: {row.nik || '-'}</p>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <p className="text-[#394059] font-mono text-xs mb-1">IP: {row.ip}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#394059]/10 text-[#394059]">Via: {row.via}</span>
                </td>
                <td className="p-4 whitespace-nowrap"><span className="px-2 py-1 bg-[#01BFD7]/10 text-[#01BFD7] rounded-full text-xs font-bold">Rp {row.paket}</span></td>
                <td className="p-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${row.keterangan === 'Promo' ? 'bg-[#46FF23]/20 text-[#394059]' : 'bg-[#01BFD7]/10 text-[#01BFD7]'}`}>{row.keterangan || 'Berbayar'}</span></td>
                <td className="p-4 whitespace-nowrap">
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

      {/* MODAL FORM RESPONSIVE (grid-cols-1 di HP, grid-cols-2 di Tablet+) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-t-4 border-t-[#01BFD7]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-[#394059]">{modalConfig.action === 'add' ? 'Tambah Data PSB' : 'Edit Data PSB'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* INI KUNCINYA: sm:grid-cols-2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Tgl & Jam Aktivasi</label>
                    <input required type="datetime-local" name="tgl_aktivasi" value={formData.tgl_aktivasi || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] focus:border-[#01BFD7] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Via (Referensi)</label>
                    <input required type="text" name="via" placeholder="Cth: Teknisi Zaki" value={formData.via || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1">Nama Pelanggan</label>
                  <input required type="text" name="nama" value={formData.nama || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1">Alamat Pemasangan</label>
                  <textarea required name="alamat" value={formData.alamat || ''} onChange={handleInputChange} rows="2" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Nomor HP / WA</label>
                    <input required type="text" name="no_hp" value={formData.no_hp || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">IP Address</label>
                    <input required type="text" name="ip" value={formData.ip || ''} placeholder="192.168.x.x" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                  </div>
                </div>
                <div className="p-3 bg-[#F4F7FC] border border-slate-200 rounded-lg">
                  <label className="block text-xs font-medium text-[#394059] mb-1">NIK KTP (Registrasi)</label>
                  <input required type="text" name="nik" value={formData.nik || ''} onChange={handleInputChange} maxLength="16" placeholder="16 Digit NIK" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Pilihan Paket</label>
                    <select required={!formData.isPaketLainnya} value={formData.isPaketLainnya ? 'Lainnya' : (PAKET_OPTIONS.includes(formData.paket) ? formData.paket : (formData.paket ? 'Lainnya' : ''))} 
                      onChange={(e) => {
                        if (e.target.value === 'Lainnya') setFormData(prev => ({ ...prev, isPaketLainnya: true, paket: '' }));
                        else setFormData(prev => ({ ...prev, isPaketLainnya: false, paket: e.target.value }));
                      }} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]">
                      <option value="">Pilih Paket...</option>
                      {PAKET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      <option value="Lainnya">Lainnya...</option>
                    </select>
                    {(formData.isPaketLainnya || (formData.paket && !PAKET_OPTIONS.includes(formData.paket))) && (
                      <input required type="text" name="paket" value={formData.paket || ''} onChange={handleInputChange} placeholder="Nominal lainnya..." className="mt-2 w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#01BFD7]" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Keterangan</label>
                    <select required name="keterangan" value={formData.keterangan || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7]">
                      <option value="">Pilih...</option><option value="Promo">Promo</option><option value="Berbayar">Berbayar</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                  <button type="button" onClick={closeModal} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-[#394059] hover:bg-slate-100 border border-slate-200 rounded-lg">Batal</button>
                  <button type="submit" className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-[#01BFD7] hover:opacity-90 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-[#01BFD7]/20"><Save className="w-4 h-4" /> Simpan Data</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
  );
}