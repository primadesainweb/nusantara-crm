# Nusantara CRM — Project Brief

## Overview

Sistem CRM berbasis web untuk travel Umroh/Haji. Mengelola data jamaah, paket perjalanan, pembayaran/cicilan, dokumen, dan komunikasi.

## Tech Stack

Vanilla JS + Tailwind CSS + Vite + JSON Server (mock)

## Modul

| ID | Modul | Deskripsi |
|---|---|---|
| M1 | Manajemen Jamaah | CRUD data jamaah, status pendaftaran, catatan |
| M2 | Paket Perjalanan | Manajemen paket Umroh/Haji, kuota, itinerary |
| M3 | Keuangan & Cicilan | Tracking pembayaran, cicilan, laporan |
| M4 | Dokumen & Visa | Upload dokumen, checklist, tracking visa |
| M5 | Dashboard & Laporan | Overview bisnis, grafik, export laporan |
| M6 | Komunikasi | Template WA, pengingat cicilan, notifikasi |

## Task Breakdown

### Phase 1 — Setup & Foundation (Must Have)
- T-01: Vite + Tailwind CSS setup ✅
- T-02: Folder structure & architecture ✅
- T-03: Layout: sidebar + header + main ✅
- T-04: SPA hash router ✅
- T-05: JSON Server + seed data ✅
- T-06: API client + utility functions ✅

### Phase 2 — Modul Jamaah / CRUD Core (Must Have)
- T-07: Halaman daftar jamaah (tabel + filter + search)
- T-08: Form tambah jamaah (multi-step wizard)
- T-09: Halaman detail jamaah (profile view)
- T-10: Form edit data jamaah (partial update)
- T-11: Hapus jamaah dengan konfirmasi modal
- T-12: Pagination client-side
- T-13: Import massal via CSV
- T-14: Export ke CSV/Excel
- T-15: Cetak kartu jamaah (ID Card)
- T-16: Komponen reusable: Badge, Avatar, Empty state, Skeleton

### Phase 3 — Paket & Pembayaran (Must Have)
- T-17: Halaman daftar paket
- T-18: Form CRUD paket
- T-19: Manajemen kuota
- T-20: Form input pembayaran
- T-21: Riwayat transaksi per jamaah
- T-22: Manajemen jadwal cicilan
- T-23: Laporan keuangan per paket
- T-24: Cetak kuitansi

### Phase 4 — Dokumen, Dashboard & Komunikasi (Must Have)
- T-29: Upload & manajemen dokumen
- T-30: Checklist kelengkapan dokumen
- T-31: Tracking status visa
- T-32: Dashboard overview utama
- T-33: Integrasi Chart.js
- T-34: Widget kalender keberangkatan
- T-35: Template pesan WhatsApp
- T-36: Pengingat cicilan jatuh tempo
- T-37: Log aktivitas per jamaah
- T-38: Laporan manifest PDF
- T-39: In-app notification center
- T-40: Halaman laporan komprehensif

### Phase 5 — Auth, Polish & Deployment (Must Have)
- T-41: Sistem login (JWT)
- T-42: Role-based access: Admin vs Staff
- T-43: Halaman pengaturan
- T-44: Responsif mobile
- T-45: Dark mode
- T-46: Testing end-to-end
- T-47: Build production + deploy (Nginx)

## Total: 47 Task

---
*Generated: June 2024*
