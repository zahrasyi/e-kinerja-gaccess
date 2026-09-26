import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Cek email dan password ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw new Error('Email atau password salah!');

      // 2. Jika sukses login, cari role & nama di tabel profiles berdasarkan email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        throw new Error('Data profil tidak ditemukan di database. Hubungi Superadmin.');
      }

      // 3. Kirim data user ke App.jsx untuk membuka kunci aplikasi
      onLoginSuccess({
        email: profileData.email,
        nama: profileData.nama,
        role: profileData.role
      });

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header Login */}
        <div className="bg-[#394059] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#01BFD7]/10 transform -skew-y-6 -translate-y-10"></div>
          <img src="src/assets/logo1.png" alt="Logo" className="w-full h-auto object-contain drop-shadow-md" />
          <p className="text-slate-300 text-sm mt-5 relative z-10">Sistem Informasi Manajemen G Access POP. Pacitan</p>
        </div>

        {/* Form Login */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-[#394059] mb-6 text-center">Masuk ke Akun</h2>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#394059] mb-1.5">Email Karyawan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01BFD7] focus:bg-white transition-all text-[#394059]"
                  placeholder="contoh@kantor.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#394059] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01BFD7] focus:bg-white transition-all text-[#394059]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#01BFD7] to-[#00A5BA] hover:from-[#00A5BA] hover:to-[#018F9F] text-white font-bold rounded-xl shadow-lg shadow-[#01BFD7]/30 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}