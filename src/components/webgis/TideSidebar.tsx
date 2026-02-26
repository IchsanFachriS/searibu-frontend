import React, { useEffect, useState, useRef } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// ── Sesuaikan dengan response aktual dari backend ─────────────────────────────
// GET /api/tide/prediction?lon=...&lat=...&start_date=...&end_date=...&interval_hours=1
interface BackendPrediction {
  time: string;   // ISO8601 UTC, e.g. "2026-02-26T00:00:00Z"
  height: number; // meter
}

interface TideData {
  request: {
    lon: number;
    lat: number;
    start_time: string;
    end_time: string;
    interval_hours: number;
  };
  grid: {
    id: number;
    lon: number;
    lat: number;
    distance_km: number;
  };
  predictions: BackendPrediction[];
  statistics: {
    max: number;
    min: number;
    mean: number;
    range: number;
  };
  metadata: {
    model: string;
    method: string;
    datum: string;
    timezone: string;
    constituents: string[];
    n_constituents: number;
  };
}
// ─────────────────────────────────────────────────────────────────────────────

interface TideSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: { lat: number; lon: number } | null;
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL ?? '';

export const TideSidebar: React.FC<TideSidebarProps> = ({
  isOpen,
  onClose,
  coordinates,
}) => {
  const { language } = useLanguage();
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (isOpen && coordinates) {
      fetchTideData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, coordinates]);

  useEffect(() => {
    if (tideData && chartRef.current) {
      renderChart();
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tideData, selectedDate]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTideData = async () => {
    if (!coordinates) return;
    setLoading(true);
    setError(null);

    try {
      // Ambil 7 hari mulai hari ini
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const url =
        `${API_BASE_URL}/api/tide/prediction` +
        `?lon=${coordinates.lon}` +
        `&lat=${coordinates.lat}` +
        `&start_date=${startDate}` +
        `&end_date=${endDate}` +
        `&interval_hours=1`;

      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data: TideData = await response.json();
      setTideData(data);
      setSelectedDate(today);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ── Chart ──────────────────────────────────────────────────────────────────
  const renderChart = async () => {
    if (!chartRef.current || !tideData) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayData = tideData.predictions.filter(p => p.time.startsWith(selectedDateStr));
    if (dayData.length === 0) return;

    const labels = dayData.map(p => {
      const d = new Date(p.time);
      return d.getUTCHours().toString().padStart(2, '0') + ':00';
    });
    const heights = dayData.map(p => p.height);

    try {
      const { default: Chart } = await import('chart.js/auto');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: language === 'en' ? 'Tide Level (m)' : 'Tinggi Pasut (m)',
              data: heights,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#2563eb',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: 12,
              callbacks: {
                label: ctx =>
                  `${language === 'en' ? 'Height' : 'Tinggi'}: ${(ctx.parsed.y ?? 0).toFixed(3)}m`,
              },
            },
          },
          scales: {
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                callback: v => (typeof v === 'number' ? v.toFixed(2) : v) + 'm',
                font: { size: 11 },
              },
              title: {
                display: true,
                text: language === 'en' ? 'Height (m)' : 'Tinggi (m)',
                font: { size: 12, weight: 'bold' },
              },
            },
            x: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { font: { size: 11 } },
              title: {
                display: true,
                text: 'UTC',
                font: { size: 12, weight: 'bold' },
              },
            },
          },
        },
      });
    } catch (err) {
      console.error('Error rendering chart:', err);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getDateOptions = (): Date[] => {
    const opts: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      opts.push(d);
    }
    return opts;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const getHighLowTides = () => {
    if (!tideData) return { high: [] as BackendPrediction[], low: [] as BackendPrediction[] };
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayData = tideData.predictions.filter(p => p.time.startsWith(selectedDateStr));
    const high: BackendPrediction[] = [];
    const low: BackendPrediction[] = [];
    for (let i = 1; i < dayData.length - 1; i++) {
      const prev = dayData[i - 1].height;
      const curr = dayData[i].height;
      const next = dayData[i + 1].height;
      if (curr > prev && curr > next) high.push(dayData[i]);
      else if (curr < prev && curr < next) low.push(dayData[i]);
    }
    return { high, low };
  };

  if (!isOpen) return null;

  const { high, low } = getHighLowTides();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-[998] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-screen w-full md:w-[520px] bg-white shadow-2xl z-[999] overflow-y-auto transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🌊</span>
              {language === 'en' ? 'Tide Prediction' : 'Prediksi Pasut'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {coordinates && (
            <div className="text-sm opacity-90 space-y-1">
              <p className="flex items-center gap-2">
                <span>📍</span>
                <span className="font-mono">
                  {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                </span>
              </p>
              {tideData && (
                <p className="text-xs">
                  {language === 'en' ? 'Nearest grid' : 'Grid terdekat'}:{' '}
                  <span className="font-mono">
                    {tideData.grid.lat.toFixed(4)}°, {tideData.grid.lon.toFixed(4)}°
                  </span>
                  <span className="ml-1">({tideData.grid.distance_km.toFixed(2)} km)</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 text-center">
                {language === 'en' ? 'Loading tide data...' : 'Memuat data pasut...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {language === 'en'
                  ? 'This may take a few seconds'
                  : 'Ini mungkin memakan waktu beberapa detik'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800 mb-1">
                    {language === 'en' ? 'Error Loading Data' : 'Kesalahan Memuat Data'}
                  </p>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchTideData}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {language === 'en' ? 'Retry' : 'Coba Lagi'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data */}
          {tideData && !loading && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {language === 'en' ? 'Highest' : 'Tertinggi'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {tideData.statistics.max.toFixed(3)}m
                  </p>
                  {high.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {high.length} {language === 'en' ? 'high tides today' : 'pasang tinggi hari ini'}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {language === 'en' ? 'Lowest' : 'Terendah'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {tideData.statistics.min.toFixed(3)}m
                  </p>
                  {low.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {low.length} {language === 'en' ? 'low tides today' : 'surut rendah hari ini'}
                    </p>
                  )}
                </div>
              </div>

              {/* High/Low Tides Summary */}
              {(high.length > 0 || low.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {language === 'en' ? "Today's High & Low Tides" : 'Pasang Surut Hari Ini'}
                  </h4>
                  <div className="space-y-2">
                    {high.slice(0, 2).map((tide, idx) => (
                      <div key={`high-${idx}`} className="flex justify-between items-center text-sm">
                        <span className="text-blue-600 font-medium">
                          ↑{' '}
                          {new Date(tide.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'UTC',
                          })}{' '}
                          UTC
                        </span>
                        <span className="font-semibold text-blue-900">
                          {tide.height.toFixed(3)}m
                        </span>
                      </div>
                    ))}
                    {low.slice(0, 2).map((tide, idx) => (
                      <div key={`low-${idx}`} className="flex justify-between items-center text-sm">
                        <span className="text-amber-600 font-medium">
                          ↓{' '}
                          {new Date(tide.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'UTC',
                          })}{' '}
                          UTC
                        </span>
                        <span className="font-semibold text-amber-900">
                          {tide.height.toFixed(3)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Selector */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4" />
                  {language === 'en' ? 'Select Date' : 'Pilih Tanggal'}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {getDateOptions().map((date, index) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`p-2 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : isToday
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-[10px] opacity-75">
                          {date.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                            weekday: 'short',
                          })}
                        </div>
                        <div className="font-bold">{date.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  {language === 'en' ? 'Tide Levels — ' : 'Tinggi Pasut — '}
                  {formatDate(selectedDate)}
                </h3>
                <div className="h-64">
                  <canvas ref={chartRef} />
                </div>
              </div>

              {/* Tide Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span>📋</span>
                    {language === 'en' ? 'Hourly Tide Data' : 'Data Pasut Per Jam'}
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          {language === 'en' ? 'Time (UTC)' : 'Waktu (UTC)'}
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                          {language === 'en' ? 'Height' : 'Tinggi'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tideData.predictions
                        .filter(p =>
                          p.time.startsWith(selectedDate.toISOString().split('T')[0]),
                        )
                        .map((prediction, index) => {
                          const date = new Date(prediction.time);
                          const isMax =
                            Math.abs(prediction.height - tideData.statistics.max) < 0.001;
                          const isMin =
                            Math.abs(prediction.height - tideData.statistics.min) < 0.001;

                          return (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                isMax ? 'bg-blue-50' : isMin ? 'bg-amber-50' : ''
                              }`}
                            >
                              <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                                {date.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'UTC',
                                })}
                                {isMax && <span className="ml-2 text-blue-600">↑</span>}
                                {isMin && <span className="ml-2 text-amber-600">↓</span>}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-semibold font-mono ${
                                  isMax
                                    ? 'text-blue-700'
                                    : isMin
                                    ? 'text-amber-700'
                                    : 'text-gray-900'
                                }`}
                              >
                                {prediction.height > 0 ? '+' : ''}
                                {prediction.height.toFixed(3)}m
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1 border border-gray-200">
                <p>
                  <strong>Model:</strong> {tideData.metadata.model}
                </p>
                <p>
                  <strong>Datum:</strong> {tideData.metadata.datum}
                </p>
                <p>
                  <strong>{language === 'en' ? 'Timezone' : 'Zona Waktu'}:</strong>{' '}
                  {tideData.metadata.timezone}
                </p>
                <p>
                  <strong>{language === 'en' ? 'Constituents' : 'Konstituen'}:</strong>{' '}
                  {tideData.metadata.constituents.map(c => c.toUpperCase()).join(', ')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};