import React from 'react';
import logoKantor from '../assets/logo.png'; 

export default function PrintTemplate({ children, title, periodeText }) {
  return (
    <div className="w-full">
      {/* SIHIR CSS UNTUK PRINT */}
      <style type="text/css" media="print">
        {`
          aside, header, .no-print { 
            display: none !important; 
          }
          
          /* 1. Paksa semua container ambil lebar 100% dan hapus scroll */
          html, body, #root, main, .overflow-hidden, .overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
            background-color: white !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* 2. INI OBATNYA: Matikan max-width 1280px bawaan App.jsx agar browser tidak zoom-out! */
          .max-w-7xl {
            max-width: 100% !important;
            margin: 0 !important;
          }

          /* 3. Mantra wajib untuk warna background Kop Surat */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 4. Margin kertas standar */
          @page { 
            margin: 10mm; 
          }
        `}
      </style>

      {/* KOP SURAT BERWARNA (Versi Full Width) */}
      <div className="hidden print:block w-full mb-6 break-inside-avoid">
        <div className="bg-[#394059] flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-b-8 border-[#01BFD7] gap-4">
          
          {/* KIRI: Logo */}
          <div className="bg-white/10 p-2 rounded-lg shrink-0 flex items-center justify-center">
            <img src={logoKantor} alt="Logo" className="h-10 sm:h-12 w-auto max-w-[120px] object-contain" />
          </div>
          
          {/* TENGAH: Nama Perusahaan */}
          <div className="flex-1 text-left min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-widest truncate">POP. PACITAN</h1>
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate mt-0.5">Sistem Informasi Manajemen Layanan Internet</p>
          </div>
          
          {/* KANAN: Judul & Periode */}
          <div className="shrink-0 text-right flex flex-col items-end">
            <h2 className="text-sm sm:text-base font-bold text-white uppercase max-w-[250px] text-right">{title}</h2>
            <div className="mt-1.5 inline-block bg-white border border-slate-200 px-3 py-1 rounded shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 text-left leading-none">Periode Data:</span>
              <span className="text-xs text-[#394059] font-bold block leading-none">{periodeText}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Area Konten Utama Halaman (Tabel dll) */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}