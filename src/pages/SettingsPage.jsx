import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit, Trash2, Plus, Save, X, Server, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Settings({ currentRole }) {
  const [profiles, setProfiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ action: 'add', id: null });
  const [formData, setFormData] = useState({ nama: '', email: '', role: 'user' });

  // Ambil data profil karyawan
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: true });
    if (data) setProfiles(data);
  };

  // Fungsi Modal
  const openModal = (action, data = null) => {
    setModalConfig({ action, id: data ? data.id : null });
    setFormData(data ? { ...data } : { nama: '', email: '', role: 'user' });
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Simpan Data Profil
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalConfig.action === 'add') {
        await supabase.from('profiles').insert([formData]);
      } else {
        await supabase.from('profiles').update(formData).eq('id', modalConfig.id);
      }
      fetchProfiles();
      closeModal();
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan data profil.");
    }
  };

  // Hapus Profil
  const handleDelete = async (id, nama) => {
    if(window.confirm(`Yakin ingin mencabut akses untuk ${nama}?`)){
      await supabase.from('profiles').delete().eq('id', id);
      fetchProfiles();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#394059] to-[#4b5475] rounded-xl p-6 shadow-md flex items-center justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#01BFD7] rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Pusat Kendali Superadmin</h2>
          <p className="text-slate-300 text-sm">Kelola hak akses karyawan dan preferensi sistem aplikasi.</p>
        </div>
        <Shield className="w-12 h-12 text-[#01BFD7] opacity-80 relative z-10 hidden sm:block" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Manajemen Akun */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#F4F7FC]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#01BFD7]/10 text-[#01BFD7] rounded-lg"><Users className="w-5 h-5" /></div>
                <h3 className="font-bold text-[#394059]">Buku Induk & Hak Akses</h3>
              </div>
              <button onClick={() => openModal('add')} className="bg-[#01BFD7] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-[#01BFD7]/20">
                <Plus className="w-4 h-4" /> Tambah Profil
              </button>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[#394059] text-sm border-b border-slate-200">
                    <th className="p-4 font-medium">Nama Karyawan</th>
                    <th className="p-4 font-medium">Email Terdaftar</th>
                    <th className="p-4 font-medium">Role Akses</th>
                    <th className="p-4 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {profiles.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F4F7FC]/50 transition-colors">
                      <td className="p-4 font-semibold text-[#394059]">{row.nama}</td>
                      <td className="p-4 text-slate-500">{row.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                          ${row.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
                            row.role === 'admin' ? 'bg-[#01BFD7]/10 text-[#01BFD7]' : 
                            'bg-slate-100 text-slate-600'}`}>
                          {row.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openModal('edit', row)} className="text-[#01BFD7] hover:bg-[#01BFD7]/10 p-2 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          {row.role !== 'superadmin' && (
                            <button onClick={() => handleDelete(row.id, row.nama)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {profiles.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">Belum ada data profil.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Status Sistem */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-[#394059] mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-400" /> Informasi Server
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#F4F7FC] rounded-lg">
                <span className="text-sm text-slate-500">Status Database</span>
                <span className="text-xs font-bold text-[#46FF23] bg-[#46FF23]/10 px-2 py-1 rounded-md flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#46FF23] rounded-full animate-pulse"></div> Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#F4F7FC] rounded-lg">
                <span className="text-sm text-slate-500">Versi Aplikasi</span>
                <span className="text-xs font-bold text-[#394059]">v2.1.0 Enterprise</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#F4F7FC] rounded-lg">
                <span className="text-sm text-slate-500">Provider Auth</span>
                <span className="text-xs font-bold text-[#01BFD7]">Supabase</span>
              </div>
            </div>
            
            <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Catatan Keamanan:</strong> Menambahkan profil di sini akan memberi mereka role di aplikasi. Pastikan Anda juga sudah mendaftarkan email dan password mereka di dashboard Supabase Authentication.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Form Tambah/Edit Profil */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border-t-4 border-t-[#01BFD7] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#F4F7FC]/50">
              <h2 className="text-lg font-bold text-[#394059]">
                {modalConfig.action === 'add' ? 'Tambah Profil Baru' : 'Edit Profil & Akses'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1.5">Nama Lengkap</label>
                  <input required type="text" name="nama" value={formData.nama} onChange={handleInputChange} placeholder="Contoh: Zaki" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1.5">Alamat Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="zaki@pop.com" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#394059] mb-1.5">Hak Akses (Role)</label>
                  <select required name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm">
                    <option value="user">User (Hanya bisa input data)</option>
                    <option value="admin">Admin (Bisa edit/hapus data & lihat omzet)</option>
                    <option value="superadmin">Superadmin (Akses penuh + Pengaturan)</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-5 mt-2">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-[#394059] hover:bg-slate-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-[#01BFD7] hover:opacity-90 rounded-lg shadow-md shadow-[#01BFD7]/20 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Simpan Profil
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}