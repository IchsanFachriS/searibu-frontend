/**
 * S104ComplianceBadge.tsx
 * Komponen UI untuk menampilkan badge kepatuhan IHO S-100/S-104
 * dan tombol export file HDF5 di InfoPanel.
 *
 * Standar: IHO S-104 Ed.2.0.0 (Water Level Information for Surface Navigation)
 * Referensi: Amanda et al. (2023) ITB Capstone — S-100 Process Design
 */

import React, { useState, useCallback } from 'react';
import { Download, CheckCircle, ExternalLink, Info, FileDown, Loader2 } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const SANS     = '"Inter", "DM Sans", system-ui, sans-serif';

interface S104BadgeProps {
  coordinates: { lat: number; lon: number };
  selectedDate: string;
  language: 'en' | 'id';
}

// ── Terjemahan ────────────────────────────────────────────────────────────
const LABELS = {
  en: {
    badgeTitle:    'IHO S-100 / S-104 Ed. 2.0',
    badgeSub:      'Water Level Standard',
    exportTpxo:    'Export S-104 (TPXO)',
    exportLuwes:   'Export S-104 (Luwes)',
    downloading:   'Preparing...',
    tooltipTitle:  'IHO S-104 Ed. 2.0.0 Compliance',
    tooltipBody:   'This data complies with the IHO S-100 Universal Hydrographic Data Model and S-104 Water Level Product Specification (adopted December 2024). Files are exportable in HDF5 format compatible with ECDIS systems.',
    tpxoLabel:     'TPXO Prediction',
    tpxoType:      'dataDynamicity = 1 (astronomicalPrediction)',
    luwesLabel:    'Luwes Observation',
    luwesType:     'dataDynamicity = 3 (observed)',
    crsLabel:      'Horizontal CRS',
    datumLabel:    'Vertical Datum',
    learnMore:     'IHO S-100 Resources',
    errorTitle:    'Export failed',
  },
  id: {
    badgeTitle:    'IHO S-100 / S-104 Ed. 2.0',
    badgeSub:      'Standar Muka Air',
    exportTpxo:    'Ekspor S-104 (TPXO)',
    exportLuwes:   'Ekspor S-104 (Luwes)',
    downloading:   'Menyiapkan...',
    tooltipTitle:  'Kepatuhan IHO S-104 Ed. 2.0.0',
    tooltipBody:   'Data ini memenuhi standar IHO S-100 Universal Hydrographic Data Model dan S-104 Water Level Product Specification (diadopsi Desember 2024). File dapat diekspor dalam format HDF5 yang kompatibel dengan sistem ECDIS.',
    tpxoLabel:     'Prediksi TPXO',
    tpxoType:      'dataDynamicity = 1 (astronomicalPrediction)',
    luwesLabel:    'Observasi Luwes',
    luwesType:     'dataDynamicity = 3 (observed)',
    crsLabel:      'CRS Horizontal',
    datumLabel:    'Datum Vertikal',
    learnMore:     'Sumber IHO S-100',
    errorTitle:    'Ekspor gagal',
  },
};

// ── Helper: trigger browser download ──────────────────────────────────────
async function triggerDownload(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((data as any).error ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── InfoRow: baris key-value kecil ─────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label, value, mono = false
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
    <span style={{ fontFamily: SANS, fontSize: 11, color: '#94a3b8' }}>{label}</span>
    <span style={{
      fontFamily: mono ? '"Courier New", monospace' : SANS,
      fontSize: 11, color: '#475569', fontWeight: mono ? 400 : 500,
      textAlign: 'right',
    }}>{value}</span>
  </div>
);

// ── ExportButton ────────────────────────────────────────────────────────────
const ExportButton: React.FC<{
  label: string;
  loadingLabel: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  accent?: string;
}> = ({ label, loadingLabel, onClick, loading, disabled, accent = '#0284c7' }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: '100%', padding: '9px 14px', borderRadius: 8,
      border: `1.5px solid ${accent}22`,
      background: loading ? '#f1f5f9' : `${accent}10`,
      color: loading ? '#94a3b8' : accent,
      fontFamily: SANS, fontSize: 12, fontWeight: 600,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.18s',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={e => {
      if (!loading && !disabled) {
        e.currentTarget.style.background = `${accent}20`;
        e.currentTarget.style.borderColor = `${accent}55`;
      }
    }}
    onMouseLeave={e => {
      if (!loading && !disabled) {
        e.currentTarget.style.background = `${accent}10`;
        e.currentTarget.style.borderColor = `${accent}22`;
      }
    }}
  >
    {loading
      ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
      : <FileDown size={13} />
    }
    {loading ? loadingLabel : label}
  </button>
);

// ── Main Component ──────────────────────────────────────────────────────────
export const S104ComplianceBadge: React.FC<S104BadgeProps> = ({
  coordinates, selectedDate, language,
}) => {
  const L = LABELS[language];
  const [showTooltip, setShowTooltip]   = useState(false);
  const [loadingTpxo, setLoadingTpxo]   = useState(false);
  const [loadingLuwes, setLoadingLuwes] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleExportTpxo = useCallback(async () => {
    setLoadingTpxo(true);
    setError(null);
    try {
      const url      = `${API_BASE}/api/s104/export?lon=${coordinates.lon}&lat=${coordinates.lat}&date=${selectedDate}`;
      const filename = `searibu_s104_tpxo_${selectedDate}_${Math.abs(coordinates.lat).toFixed(3)}_${coordinates.lon.toFixed(3)}.h5`;
      await triggerDownload(url, filename);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTpxo(false);
    }
  }, [coordinates, selectedDate]);

  const handleExportLuwes = useCallback(async () => {
    setLoadingLuwes(true);
    setError(null);
    try {
      const url      = `${API_BASE}/api/s104/export/luwes?date=${selectedDate}`;
      const filename = `searibu_s104_luwes_${selectedDate}.h5`;
      await triggerDownload(url, filename);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingLuwes(false);
    }
  }, [selectedDate]);

  return (
    <div style={{ margin: '12px 0 0' }}>
      {/* ── Badge Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
          border: '1px solid #bae6fd', borderRadius: 10,
          cursor: 'pointer',
        }}
        onClick={() => setShowTooltip(p => !p)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: '#0284c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckCircle size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: '#0284c7', margin: 0, letterSpacing: '0.02em' }}>
              {L.badgeTitle}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 10, color: '#0369a1', margin: 0, opacity: 0.8 }}>
              {L.badgeSub}
            </p>
          </div>
        </div>
        <Info size={14} style={{ color: '#0284c7', opacity: 0.6, flexShrink: 0 }} />
      </div>

      {/* ── Tooltip / Detail Panel ── */}
      {showTooltip && (
        <div style={{
          marginTop: 6, padding: '12px 14px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10,
        }}>
          <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
            {L.tooltipTitle}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 11, color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>
            {L.tooltipBody}
          </p>

          {/* Metadata grid */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginBottom: 8 }}>
            <InfoRow label={L.crsLabel}   value="EPSG:4326 (WGS 84)" mono />
            <InfoRow label={L.datumLabel} value="MSL (IHO code 12)"  mono />
            <InfoRow label={L.tpxoLabel}  value={L.tpxoType}         mono />
            <InfoRow label={L.luwesLabel} value={L.luwesType}        mono />
            <InfoRow label="TOL correction" value="-2.156 m (Luwes → MSL)" mono />
            <InfoRow label="Edition"      value="S-104 Ed.2.0.0 (Dec 2024)" mono />
          </div>

          {/* Learn more link */}
          <a
            href="https://iho.int/en/s-100-based-product-specifications"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: SANS, fontSize: 11, color: '#0284c7',
              textDecoration: 'none', marginBottom: 10,
            }}
          >
            {L.learnMore} <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* ── Export Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <ExportButton
          label        = {L.exportTpxo}
          loadingLabel = {L.downloading}
          onClick      = {handleExportTpxo}
          loading      = {loadingTpxo}
          accent       = "#0284c7"
        />
        <ExportButton
          label        = {L.exportLuwes}
          loadingLabel = {L.downloading}
          onClick      = {handleExportLuwes}
          loading      = {loadingLuwes}
          accent       = "#f97316"
        />
      </div>

      {/* ── Error message ── */}
      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ color: '#dc2626', fontSize: 11, fontFamily: SANS, flex: 1 }}>
            <strong>{L.errorTitle}:</strong> {error}
          </span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0, fontSize: 14, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default S104ComplianceBadge;