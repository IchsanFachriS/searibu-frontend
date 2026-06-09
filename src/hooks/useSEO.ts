/**
 * useSEO.ts — Dynamic page title & meta description per route.
 *
 * Dipanggil di setiap komponen halaman agar Google menerima
 * judul dan deskripsi yang unik per URL (penting untuk SPA/React).
 */

import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  /** og:image override — default ke /og-image.jpg */
  ogImage?: string;
}

const BASE_TITLE = "Searibu";
const SITE_URL   = "https://searibu.vercel.app";

export function useSEO({ title, description, canonical, ogImage }: SEOConfig) {
  useEffect(() => {
    /* ── <title> ── */
    document.title = `${title} — ${BASE_TITLE}`;

    /* ── Meta description ── */
    setMeta("name", "description", description);

    /* ── Canonical ── */
    const canon = canonical ?? SITE_URL;
    let canonEl = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonEl) {
      canonEl = document.createElement("link");
      canonEl.rel = "canonical";
      document.head.appendChild(canonEl);
    }
    canonEl.href = canon;

    /* ── Open Graph ── */
    setMeta("property", "og:title",       `${title} — ${BASE_TITLE}`);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url",         canon);
    if (ogImage) setMeta("property", "og:image", ogImage);

    /* ── Twitter ── */
    setMeta("name", "twitter:title",       `${title} — ${BASE_TITLE}`);
    setMeta("name", "twitter:description", description);

    /* Cleanup: restore to defaults saat unmount */
    return () => {
      document.title = `${BASE_TITLE} — Sistem Informasi Kelautan Kepulauan Seribu`;
    };
  }, [title, description, canonical, ogImage]);
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/* ── Per-page SEO configs ── */
export const PAGE_SEO = {
  home: {
    en: {
      title:       "Ocean Weather Information System",
      description: "Science-backed tidal prediction and real-time ocean conditions for safe maritime recreation across 110+ islands in Kepulauan Seribu, Jakarta. TPXO10 model, IHO S-104 standard.",
      canonical:   `${SITE_URL}/`,
    },
    id: {
      title:       "Sistem Informasi Cuaca Kelautan",
      description: "Prediksi pasut berbasis ilmiah dan kondisi laut real-time untuk wisata bahari yang aman di 110+ pulau Kepulauan Seribu, Jakarta. Model TPXO10, standar IHO S-104.",
      canonical:   `${SITE_URL}/`,
    },
  },
  webgis: {
    en: {
      title:       "WebGIS — Interactive Tidal & Marine Map",
      description: "Interactive WebGIS map of Kepulauan Seribu with hourly tidal predictions (TPXO10), real-time wave height, wind speed, and ocean current data. Click any location for marine information.",
      canonical:   `${SITE_URL}/webgis`,
    },
    id: {
      title:       "WebGIS — Peta Pasut & Kelautan Interaktif",
      description: "Peta WebGIS interaktif Kepulauan Seribu dengan prediksi pasut per jam (TPXO10), tinggi gelombang real-time, kecepatan angin, dan arus laut. Klik lokasi mana saja untuk informasi kelautan.",
      canonical:   `${SITE_URL}/webgis`,
    },
  },
  about: {
    en: {
      title:       "About — ITB Capstone Project",
      description: "Searibu is a capstone design project by Geodesy and Geomatics Engineering students at Institut Teknologi Bandung (ITB), Faculty of Earth Sciences and Technology, 2026.",
      canonical:   `${SITE_URL}/about`,
    },
    id: {
      title:       "Tentang — Proyek Capstone ITB",
      description: "Searibu adalah proyek capstone mahasiswa Teknik Geodesi dan Geomatika ITB, Fakultas Ilmu dan Teknologi Kebumian, 2026. Platform informasi kelautan untuk wisata bahari Kepulauan Seribu.",
      canonical:   `${SITE_URL}/about`,
    },
  },
  guide: {
    en: {
      title:       "User Guide — How to Use Searibu",
      description: "Complete guide to using Searibu: reading tidal charts, WebGIS map navigation, activity safety check, date navigation, and exporting IHO S-104 HDF5 files.",
      canonical:   `${SITE_URL}/guide`,
    },
    id: {
      title:       "Panduan Pengguna — Cara Menggunakan Searibu",
      description: "Panduan lengkap menggunakan Searibu: membaca grafik pasut, navigasi peta WebGIS, cek keamanan aktivitas bahari, navigasi tanggal, dan ekspor file IHO S-104 HDF5.",
      canonical:   `${SITE_URL}/guide`,
    },
  },
} as const;