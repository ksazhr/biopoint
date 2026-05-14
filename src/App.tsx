import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Map as MapIcon, 
  Settings, 
  Plus, 
  Navigation, 
  ShieldCheck, 
  LogOut,
  X,
  Layers,
  Search,
  Trash2,
  LocateFixed,
  AlertTriangle,
  MessageSquareShare
} from 'lucide-react';
import { BioporiPoint } from './types';

// Standard pointer icon for Leaflet (using CDN assets)
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Custom Green Icon for Biopori (Extra Small & Precise)
const GreenIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #064e3b; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const DEFAULT_CENTER: [number, number] = [-6.9744, 107.6366];

// Helper to handle map clicks for adding points
function MapEventsHandler({ onMapClick, isAdding }: { onMapClick: (lat: number, lng: number) => void, isAdding: boolean }) {
  useMapEvents({
    click(e) {
      if (isAdding) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function LocationMarker({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();
  
  if (!userLocation) return null;

  return (
    <>
      <Circle 
        center={userLocation}
        radius={1.5}
        pathOptions={{ 
          fillColor: '#3b82f6', 
          color: 'white', 
          weight: 1.5, 
          fillOpacity: 1 
        }}
      />
      <Circle 
        center={userLocation}
        radius={6}
        pathOptions={{ 
          fillColor: '#3b82f6', 
          color: 'transparent', 
          fillOpacity: 0.1 
        }}
      />
    </>
  );
}

// Separate component for the Locate Me button action
function LocateButton({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();
  
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (userLocation) {
          map.flyTo(userLocation, 19);
        } else {
          alert('Mencari lokasi Anda...');
        }
      }}
      className={`absolute bottom-6 right-6 z-[1000] p-4 rounded-2xl shadow-xl transition-all ${userLocation ? 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
      title="Pusatkan ke Lokasi Saya"
    >
      <LocateFixed size={24} />
      {userLocation && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full animate-ping"></div>}
    </button>
  );
}

function MapFlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 22, {
        duration: 2,
        easeLinearity: 0.25
      });
    }
  }, [target, map]);
  return null;
}

function MapPersist() {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const config = {
        center: [center.lat, center.lng],
        zoom: map.getZoom()
      };
      // Simpan ke localStorage saja, jangan simpan di state Reaktif App yang bikin re-render map
      localStorage.setItem('si_biopori_map_view', JSON.stringify(config));
    }
  });
  return null;
}

export default function App() {
  const [points, setPoints] = useState<BioporiPoint[]>([]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [isAdmin, setIsAdmin] = useState(() => {
    // Cek apakah sebelumnya sudah login di laptop ini
    return localStorage.getItem('si_biopori_admin') === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [initialConfig] = useState(() => {
    // Ambil posisi terakhir dari localStorage agar tidak reset
    const saved = localStorage.getItem('si_biopori_map_view');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { center: DEFAULT_CENTER, zoom: 18 };
      }
    }
    return { center: DEFAULT_CENTER, zoom: 18 };
  });

  const [newPointData, setNewPointData] = useState({ name: '', description: '', lat: 0, lng: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);

  const [mapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    fetchPoints();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchPoints = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/biopori');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPoints(data);
      } else {
        setPoints([]);
      }
    } catch (error) {
      console.error('Failed to fetch points:', error);
      setPoints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('si_biopori_admin', 'true'); // Simpan status admin
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Password salah!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('si_biopori_admin'); // Hapus status admin
    setIsAddingPoint(false);
  };

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPointData.lat === 0) {
      alert('Klik pada peta untuk menentukan lokasi!');
      return;
    }
    try {
      const response = await fetch('/api/biopori', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-secret-123'
        },
        body: JSON.stringify(newPointData)
      });
      if (response.ok) {
        setIsAddingPoint(false);
        setNewPointData({ name: '', description: '', lat: 0, lng: 0 });
        fetchPoints();
      }
    } catch (error) {
      console.error('Failed to add point:', error);
    }
  };

  const handleDeletePoint = async (id: string) => {
    console.log('Attempting to delete point:', id);
    if (!window.confirm('Apakah Anda yakin ingin menghapus titik biopori ini?')) return;
    
    try {
      const response = await fetch(`/api/biopori/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-secret-123'
        }
      });
      if (response.ok) {
        console.log('Successfully deleted point:', id);
        fetchPoints();
      } else {
        console.error('Delete failed:', response.statusText);
        alert('Gagal menghapus titik. Silakan cek koneksi atau status admin.');
      }
    } catch (error) {
      console.error('Failed to delete point:', error);
      alert('Terjadi kesalahan saat menghapus.');
    }
  };

  const mapClicked = (lat: number, lng: number) => {
    setNewPointData(prev => ({ ...prev, lat, lng }));
  };

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    return distance < 1000 
      ? `${Math.round(distance)} m` 
      : `${(distance/1000).toFixed(1)} km`;
  };

  return (
    <div className="h-screen w-full bg-emerald-50 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-emerald-100 px-6 sm:px-8 flex items-center justify-between shadow-sm shrink-0 z-[1001]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Droplets className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-emerald-900 tracking-tight leading-none">BioPoint</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Monitoring Lubang Biopori</p>
          </div>
        </div>
        
        

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setView('map')}
              className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Tampilan Peta"
            >
              <MapIcon size={18} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Daftar Titik"
            >
              <Layers size={18} />
            </button>
          </div>
          {!isAdmin ? (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Admin Panel</span>
              <Settings size={18} className="sm:hidden" />
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar */}
        <AnimatePresence>
          {(view === 'list') && (
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-full md:w-80 bg-white border-r border-emerald-50 p-6 flex flex-col shrink-0 z-30 overflow-hidden"
            >
              <div className="mb-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Statistik Lubang Biopori</h2>
                <div className="w-full p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                  <p className="text-3xl font-black text-emerald-700">{points.length}</p>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Lubang Aktif</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Lokasi</h2>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Cari titik..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    {points.map((point) => (
                      <div 
                        key={point.id}
                        className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 bg-slate-50 cursor-pointer transition-all group flex flex-col"
                      >
                      <div className="flex justify-between items-start">
                        <div onClick={() => {
                          setView('map');
                          setFlyToTarget([point.lat, point.lng]);
                        }} className="flex-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{point.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{point.description}</p>
                          {userLocation && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded-md">
                              <LocateFixed size={10} />
                              <span>{getDistance(userLocation[0], userLocation[1], point.lat, point.lng)} dari Anda</span>
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePoint(point.id);
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Titik"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>              </div>
              <div className="mt-6 p-4 bg-emerald-900 rounded-2xl text-white">
                <p className="text-xs font-bold uppercase tracking-tight mb-2">Informasi</p>
                <p className="text-[12px] leading-relaxed opacity-80">
                  Lubang resapan biopori adalah lubang silindris yang dibuat secara vertikal ke dalam tanah sebagai metode resapan air yang ditujukan untuk mengatasi genangan air dengan cara meningkatkan daya resap air pada tanah.
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map Area */}
        <section className="flex-1 bg-slate-200 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key="map-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full relative z-10"
            >
              <MapContainer 
                center={initialConfig.center} 
                zoom={initialConfig.zoom} 
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  maxZoom={22}
                  maxNativeZoom={20}
                  updateWhenZooming={false}
                  updateWhenIdle={true}
                  bounds={[[-7.2, 107.4], [-6.7, 107.9]]}
                />
                
                {points.map((point) => (
                  <Marker 
                    key={point.id} 
                    position={[point.lat, point.lng]} 
                    icon={GreenIcon}
                    onClick={() => setFlyToTarget([point.lat, point.lng])}
                    className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer relative active:scale-95"
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px]">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-emerald-900 text-sm m-0">{point.name}</h4>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeletePoint(point.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Hapus Titik"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 my-1">{point.description}</p>
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                <LocationMarker userLocation={userLocation} />
                <MapEventsHandler onMapClick={mapClicked} isAdding={isAdmin && isAddingPoint} />
                <MapFlyTo target={flyToTarget} />
                <LocateButton userLocation={userLocation} />
                <MapPersist />
              </MapContainer>

              {/* Map Overlays */}
              <div className="absolute bottom-5 left-6 hidden sm:block bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white shrink-0 z-[1000] w-52">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Keterangan Peta</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <span className="text-xs font-medium text-slate-600">Lubang Aktif</span>
                  </div>
                  <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-200 shadow-sm shadow-black-200"></div>
                    <span className="text-xs font-medium text-slate-600">Jalan</span>
                  </div>
                  <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-300 shadow-sm shadow-blue-200"></div>
                    <span className="text-xs font-medium text-slate-600">Sungai</span>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAddingPoint(!isAddingPoint)}
                    className={`w-full mt-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isAddingPoint ? 'bg-red-500 text-white shadow-red-200' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                  >
                    {isAddingPoint ? <X size={14} /> : <Plus size={14} />}
                    {isAddingPoint ? 'Batal Tambah' : 'Tambah Titik'}
                  </button>
                )}
              </div>

              {/* Add Point Form Overlay */}
              <AnimatePresence>
                {isAdmin && isAddingPoint && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-lg"
                  >
                    <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] shadow-2xl border border-emerald-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <Plus size={24} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 tracking-tight">Tambah Titik Baru</h3>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic">Klik di Peta untuk Koordinat</p>
                        </div>
                      </div>
                      
                      <form onSubmit={handleAddPoint} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input 
                            type="text" required placeholder="Nama Titik"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={newPointData.name}
                            onChange={e => setNewPointData(prev => ({ ...prev, name: e.target.value }))}
                          />
                          <input 
                            type="text" required placeholder="Keterangan"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={newPointData.description}
                            onChange={e => setNewPointData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-[11px] font-mono justify-center">
                          <span className="text-emerald-600 font-bold">LAT: {newPointData.lat.toFixed(6)}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-emerald-600 font-bold">LNG: {newPointData.lng.toFixed(6)}</span>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <ShieldCheck size={20} />
                          Simpan Lokasi
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-10 bg-emerald-900 text-emerald-300 px-8 flex items-center justify-between text-[11px] font-medium shrink-0 z-[1001]">
        <div className="flex items-center gap-4">
           <span className="hidden sm:inline">Koordinat: -6.979765, 107.632382</span>
           <span className="text-emerald-100/50">|</span>
           <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Map: OpenStreetMap</span>
        </div>
        <div className="flex gap-4 opacity-80 tracking-tight">
          <span>BioPoint © 2026</span>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-xs rounded-[3rem] shadow-2xl p-10 border border-emerald-100 relative"
            >
              <button onClick={() => setShowAdminLogin(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
              
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Admin Login</h3>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input 
                  type="password" autoFocus placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Masuk
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Loading Indicator */}
      {isLoading && (
        <div className="fixed top-20 right-6 z-[3000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-100 flex items-center gap-3">
           <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-emerald-900 font-bold tracking-tight text-[10px] uppercase">Sinkronisasi Data...</p>
        </div>
      )}
    </div>
  );
}
