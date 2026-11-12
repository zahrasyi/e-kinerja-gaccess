import React from 'react';
import logoKantor from '../assets/simbol.png'; 

export default function PrintTemplate({ children, title, periodeText }) {
  return (
    <div className="w-full relative">
      {/* SIHIR CSS UNTUK PRINT */}
      <style type="text/css" media="print">
        {`
          @page { 
            size: auto; 
            margin: 15mm 20mm; 
          }

          /* Sembunyikan elemen UI yang tidak perlu */
          aside, header, .no-print, nav, button { 
            display: none !important; 
          }
          
          /* 1. HAPUS MARGIN SIDEBAR & PADDING DASHBOARD */
          html, body, #root, main, 
          .ml-64, .md\\:ml-64, .lg\\:ml-64, .xl\\:ml-64, .flex-1,
          .p-4, .p-5, .p-6, .p-8 {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }

          /* 2. BUKA BATASAN SCROLL AGAR BISA MULTI-HALAMAN */
          .overflow-hidden, .overflow-auto, .overflow-x-auto, .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          
          /* 3. PENGATURAN UMUM TABEL & PAGE BREAK */
          table { 
            border-collapse: collapse !important; 
            width: 100% !important; 
            color: black !important;
            page-break-inside: auto !important; 
          }
          tr {
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          table, tr, td, th {
            background-color: transparent !important;
          }
          th, td { 
            border: 1px solid black !important; 
            padding: 8px 10px !important; 
            color: black !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
          }
          th {
            font-weight: bold !important;
            text-align: center !important;
          }
          th:first-child, td:first-child {
            width: 6% !important;
            text-align: center !important;
          }

          /* 4. PROPORSI SIMETRIS KHUSUS TABEL ABSEN & LEMBUR (4 KOLOM CETAK) */
          table:not(:has(th:nth-child(6))) {
            table-layout: fixed !important;
          }
          table:not(:has(th:nth-child(6))) th:nth-child(1),
          table:not(:has(th:nth-child(6))) td:nth-child(1) {
            width: 6% !important;
            text-align: center !important;
          }
          table:not(:has(th:nth-child(6))) th:nth-child(2),
          table:not(:has(th:nth-child(6))) td:nth-child(2) {
            width: 22% !important;
          }
          table:not(:has(th:nth-child(6))) th:nth-child(3),
          table:not(:has(th:nth-child(6))) td:nth-child(3) {
            width: 27% !important;
          }
          table:not(:has(th:nth-child(6))) th:nth-child(4),
          table:not(:has(th:nth-child(6))) td:nth-child(4) {
            width: 45% !important;
          }
        `}
      </style>

      {/* WATERMARK LOGO DI TENGAH KERTAS */}
      <div className="hidden print:flex fixed inset-0 items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        <img 
          src={logoKantor} 
          alt="Watermark" 
          className="w-[450px] h-auto object-contain" 
          style={{ opacity: 0.12 }} 
        />
      </div>

      {/* HEADER KOP SURAT RESMI */}
      <div className="hidden print:block w-full relative z-10 text-black font-sans print:bg-transparent">
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-0.5">
          <div className="w-28 shrink-0 flex items-center justify-center">
            <img src={logoKantor} alt="Logo" className="w-full h-auto object-contain" />
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-black uppercase text-black tracking-wide">
              PT. GAYATRI LINTAS NUSANTARA - POP PACITAN
            </h1>
            <h2 className="text-lg font-bold uppercase text-black mt-1">
              {title}
            </h2>
            <p className="text-xs text-black mt-1.5 leading-relaxed">
              Alamat: RT 01 RW 05, Dusun Krajan, Desa Kedungbendo, Kecamatan Arjosari, Kabupaten Pacitan<br/>
              Email: gayatripoppacitan@gmail.com
            </p>
            <p className="text-sm font-bold text-black mt-2">
              Periode: {periodeText}
            </p>
          </div>
          <div className="w-28 shrink-0"></div>
        </div>
        <div className="border-b border-black mb-6"></div>
      </div>

      {/* KONTEN UTAMA - TABEL */}
      <div className="w-full relative z-10 print:bg-transparent">
        {children}
      </div>

      {/* FOOTER TANDA TANGAN */}
      <div className="hidden print:flex mt-12 justify-end w-full break-inside-avoid relative z-10 print:bg-transparent">
        <div className="text-center w-64 text-black">
          <p className="mb-20 text-sm">Mengetahui,<br/>Kepala POP Pacitan</p>
          <p className="font-bold text-sm">
            <span className="inline-block border-b border-black pb-0.5 px-4">
              Superadmin
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}