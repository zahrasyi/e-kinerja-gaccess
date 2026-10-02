import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Filter, ArrowDown, ArrowUp, Printer, Camera, ImageIcon, Loader2 } from 'lucide-react';
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
  
  // State untuk Upload Foto
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => { 
    const { data, error } = await supabase.from('psb').select('*'); 
    if (error) {
      alert("Error tarik data Supabase: " + error.message);
      console.error(error);
    }
    if (data) setPsbData(data); 
  };
  
  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  const handlePrint = () => { window.print(); };

  const processedData = psbData.filter(row => {
      if (!row.tgl_aktivasi) return (filterDate === '' && filterMonth === '' && filterYear === '');
      
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
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    
    let prepData = {};
    if (action === 'edit' && data) {
      prepData = { ...data };
      if (data.paket && !PAKET_OPTIONS.includes(data.paket)) prepData.isPaketLainnya = true;
      if (prepData.tgl_aktivasi) {
        const d = new Date(prepData.tgl_aktivasi);
        if (!isNaN(d.getTime())) prepData.tgl_aktivasi = d.toISOString().slice(0, 16);
      }
      if (data.foto_bukti) setPreviewUrl(data.foto_bukti); // Tampilkan foto lama jika ada
    }
    setFormData(prepData);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Fungsi saat memilih/memfoto gambar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Batas 5MB
        alert("Ukuran gambar terlalu besar! Maksimal 5MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Buat preview sementara
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true); // Nyalakan efek loading
    let finalData = { ...formData }; 
    delete finalData.isPaketLainnya; 
  
    try {
      // 1. PROSES UPLOAD GAMBAR (Jika ada gambar baru yang dipilih)
      let fotoUrl = finalData.foto_bukti || null;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `psb_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('psb_images')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        // Ambil link URL publik dari gambar yang baru diupload
        const { data: publicUrlData } = supabase.storage.from('psb_images').getPublicUrl(filePath);
        fotoUrl = publicUrlData.publicUrl;
      }
      
      finalData.foto_bukti = fotoUrl; // Masukkan link URL ke dalam data yang akan disimpan ke tabel

      // 2. PROSES SIMPAN KE TABEL
      let sbError = null;
      if (modalConfig.action === 'add') {
        const maxNo = psbData.reduce((max, row) => {
          const currentNo = parseInt(row.no) || 0;
          return currentNo > max ? currentNo : max;
        }, 0);
        
        finalData.no = maxNo + 1; 
  
        const { error } = await supabase.from('psb').insert([finalData]); 
        sbError = error;
      } else {
        const { error } = await supabase.from('psb').update(finalData).eq('id', modalConfig.id);
        sbError = error;
      }
      
      if (sbError) {
        alert("GAGAL SIMPAN! Pesan Error Database:\n" + sbError.message);
        console.error(sbError);
        setIsUploading(false);
        return; 
      }

      fetchData();
      closeModal();
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menyimpan/upload: " + error.message);
      setIsUploading(false);
    }
  };

  const confirmDelete = async () => {
    try { 
      const { error } = await supabase.from('psb').delete().eq('id', deleteModalConfig.id); 
      if (error) alert("Gagal Hapus: " + error.message);
      
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

  return (
    <div className="bg-white rounded-xl shadow-sm print:shadow-none border border-slate-100 print:border-none overflow-hidden w-full">
      
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-4 mt-4">
        <h1 className="text-2xl font-bold text-[#394059] uppercase tracking-wide">Laporan Pemasangan Baru (PSB)</h1>
        <p className="text-slate-600 mt-1 font-medium">Sistem Informasi Manajemen POP. Pacitan</p>
        {(filterMonth || filterYear) && (
          <p className="text-sm text-slate-500 mt-2">
            Periode: {filterMonth ? BULAN_OPTIONS.find(m => m.value === filterMonth)?.label : 'Semua Bulan'} {filterYear || 'Semua Tahun'}
          </p>
        )}
      </div>

      <div className="p-4 border-b border-slate-100 print:hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
      
      <div className="overflow-x-auto print:overflow-visible w-full pb-2">
        {/* Lebar dinaikkan jadi 1250px agar ada ruang untuk kolom foto */}
        <table className="w-full text-left border-collapse min-w-[1250px] print:min-w-full">
          <thead>
            <tr className="bg-[#F4F7FC] print:bg-slate-100 text-[#394059] text-sm border-b border-slate-200 print:border-slate-800">
              <th className="p-4 font-bold w-12 whitespace-nowrap print:p-2 text-center">No</th>
              <th className="p-4 font-bold w-36 cursor-pointer hover:bg-slate-100 transition-colors select-none group whitespace-nowrap print:p-2" onClick={toggleSort}>
                <div className="flex items-center gap-2">Tgl Aktivasi <div className="print:hidden p-1 rounded bg-[#01BFD7]/10 text-[#01BFD7]">{sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}</div></div>
              </th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2">Pelanggan (NIK/Kontak)</th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2">IP & Via</th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2">Paket & Info</th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2">Pembayaran</th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2">Catatan</th>
              <th className="p-4 font-bold whitespace-nowrap print:p-2 text-center">Foto</th>
              <th className="p-4 font-bold text-center whitespace-nowrap print:hidden">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 print:divide-slate-300">
            {processedData.length === 0 && <tr><td colSpan="9" className="p-8 text-center text-slate-500">Data tidak ditemukan</td></tr>}
            {processedData.map((row) => (
              <tr key={row.id} className="hover:bg-[#F4F7FC]/50 transition-colors">
                <td className="p-4 print:p-2 text-center font-bold text-[#394059]">{row.no || '-'}</td>
                <td className="p-4 print:p-2 whitespace-nowrap">{formatDateTime(row.tgl_aktivasi)}</td>
                <td className="p-4 print:p-2">
                  <p className="font-semibold text-[#394059]">{row.nama}</p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2 print:line-clamp-none">{row.alamat} • {row.no_hp}</p>
                  <p className="text-slate-400 text-xs mt-0.5">NIK: {row.nik || '-'}</p>
                </td>
                <td className="p-4 print:p-2 whitespace-nowrap">
                  <p className="text-[#394059] font-mono text-xs mb-1">IP: {row.ip}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#394059]/10 print:bg-transparent print:border print:border-slate-300 text-[#394059]">Via: {row.via}</span>
                </td>
                <td className="p-4 print:p-2 whitespace-nowrap">
                  <span className="px-2 py-1 bg-[#01BFD7]/10 print:bg-transparent print:border print:border-slate-300 text-[#01BFD7] print:text-[#394059] rounded-full text-xs font-bold block w-max mb-1">Rp {row.paket}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium print:bg-transparent print:border print:border-slate-300 print:text-[#394059] inline-block ${row.keterangan === 'Promo' ? 'bg-[#46FF23]/20 text-[#394059]' : 'bg-slate-100 text-slate-600'}`}>{row.keterangan || 'Berbayar'}</span>
                </td>
                <td className="p-4 print:p-2 whitespace-nowrap"><span className="text-[#394059] font-medium">{row.pembayaran || '-'}</span></td>
                <td className="p-4 print:p-2 min-w-[150px]"><p className="text-slate-500 text-xs line-clamp-2 print:line-clamp-none">{row.additional_note || '-'}</p></td>
                
                {/* Kolom Penampil Thumbnail Foto */}
                <td className="p-4 print:p-2 text-center">
                  {row.foto_bukti ? (
                    <a href={row.foto_bukti} target="_blank" rel="noreferrer" className="inline-block hover:opacity-80 transition-opacity">
                      <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-slate-50">
                        <img src={row.foto_bukti} alt="Bukti" className="w-full h-full object-cover" />
                      </div>
                    </a>
                  ) : (
                    <span className="text-slate-300 flex justify-center"><ImageIcon className="w-6 h-6" /></span>
                  )}
                </td>

                <td className="p-4 whitespace-nowrap print:hidden">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-t-4 border-t-[#01BFD7]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-[#394059]">{modalConfig.action === 'add' ? 'Tambah Data PSB' : 'Edit Data PSB'}</h2>
              <button onClick={closeModal} disabled={isUploading} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Tgl & Jam Aktivasi</label>
                    <input required type="datetime-local" name="tgl_aktivasi" value={formData.tgl_aktivasi || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Pembayaran</label>
                    <input required type="text" name="pembayaran" value={formData.pembayaran || ''} onChange={handleInputChange} placeholder="Cth: Lunas (Transfer)" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#394059] mb-1">Additional Note <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input type="text" name="additional_note" value={formData.additional_note || ''} onChange={handleInputChange} placeholder="Catatan tambahan..." className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm" />
                  </div>
                </div>

                {/* FORM UPLOAD FOTO / KAMERA REALTIME */}
                <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg mt-2">
                  <label className="block text-sm font-medium text-[#394059] mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#01BFD7]" /> Foto Bukti Pemasangan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" // INI KUNCINYA AGAR OTOMATIS BUKA KAMERA DI HP
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#01BFD7]/10 file:text-[#01BFD7] hover:file:bg-[#01BFD7]/20 cursor-pointer"
                    />
                    {previewUrl && (
                      <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-white shadow-sm">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                  <button type="button" onClick={closeModal} disabled={isUploading} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-[#394059] hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={isUploading} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-[#01BFD7] hover:opacity-90 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-[#01BFD7]/20 disabled:opacity-70">
                    {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Data</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
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