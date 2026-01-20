import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Users, FileText, GripVertical, Save, 
  X, LayoutDashboard, Menu, ChevronRight, ChevronDown, 
  Search, ArrowUpDown, Filter, Check, 
  ShieldCheck, Pencil, AlertTriangle, Info, Activity, CheckCircle2, List, FolderOpen, ArrowDownAZ, Printer, Briefcase, PieChart
} from 'lucide-react';

// --- Constants ---

const APP_NAME = "PKP APP";
const APP_SUBTITLE = "Tools Pembagian Prosedur dan Penyusunan PKP";
const DEVELOPER_NAME = "Tim DAC BPK Bali"; 
const YEAR = "2026";

// Role Pemeriksa (Disederhanakan)
const EXAMINER_ROLES = [
    { key: 'KST', label: 'Ketua Subtim', color: 'bg-red-100 text-red-900 border-red-200' },
    { key: 'AT', label: 'Anggota Tim', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { key: 'DKR', label: 'Dukungan Pemeriksaan', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const PKP_STATUSES = [
  { id: 'draft', label: 'Draft Pembagian', color: 'bg-slate-100 text-slate-700' },
  { id: 'review', label: 'Reviu Ketua Tim', color: 'bg-orange-100 text-orange-700' },
  { id: 'final', label: 'Final / Siap Jalan', color: 'bg-red-100 text-red-900' },
];

// --- Helpers ---

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatTimestampForFile = () => {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-');
};

// --- Sub-Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 text-sm";
  const variants = {
    primary: "bg-red-900 text-white hover:bg-red-950 shadow-red-900/20", // Dark Red Theme
    secondary: "bg-white text-red-900 border border-red-900 hover:bg-red-50",
    danger: "bg-white text-rose-600 hover:bg-rose-50 border border-rose-200",
    ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100",
    outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    icon_light: "text-slate-400 hover:text-white hover:bg-slate-700/50 p-1.5 rounded cursor-pointer"
  };
  return (
    <button type="button" onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
    <input 
      className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800/20 placeholder-slate-400 text-sm shadow-sm transition-all"
      {...props}
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
    <div className="mb-3">
      {label && <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>}
      <textarea 
        className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800/20 placeholder-slate-400 text-sm shadow-sm transition-all"
        rows={3}
        {...props}
      />
    </div>
  );

// --- Modals ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full shrink-0 bg-red-100 text-red-600">
             <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-red-700 hover:bg-red-800">Hapus</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm">Batal</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function PKPApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('distribution'); 
  
  // Data State
  const [examiners, setExaminers] = useState([]); // Anggota Tim
  const [procedures, setProcedures] = useState([]); // Daftar Prosedur
  const [assignments, setAssignments] = useState({}); // { examinerId: [procedureId, procedureId] }
  
  // UI State
  const [projectTitle, setProjectTitle] = useState('Pemeriksaan LKPD 2025');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('draft');
  const [lastSaved, setLastSaved] = useState(null);
  
  // Modal States
  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState(null);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Drag and Drop Refs
  const dragItem = useRef(null); // { type: 'procedure', id: procId }
  const backupInputRef = useRef(null);

  // --- Persistence ---
  useEffect(() => {
    const savedEx = localStorage.getItem('pkp_examiners');
    const savedProc = localStorage.getItem('pkp_procedures');
    const savedAssign = localStorage.getItem('pkp_assignments');
    const savedMeta = localStorage.getItem('pkp_meta');
    
    if (savedEx) setExaminers(JSON.parse(savedEx));
    if (savedProc) setProcedures(JSON.parse(savedProc));
    if (savedAssign) setAssignments(JSON.parse(savedAssign));
    if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        setProjectTitle(meta.title || 'Untitled Project');
        setCurrentStatus(meta.status || 'draft');
        setLastSaved(meta.lastSaved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pkp_examiners', JSON.stringify(examiners));
    localStorage.setItem('pkp_procedures', JSON.stringify(procedures));
    localStorage.setItem('pkp_assignments', JSON.stringify(assignments));
    localStorage.setItem('pkp_meta', JSON.stringify({ title: projectTitle, status: currentStatus, lastSaved }));
  }, [examiners, procedures, assignments, projectTitle, currentStatus, lastSaved]);

  // --- Logic Implementations ---

  const handleSaveExaminer = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newEx = {
        id: editingExaminer ? editingExaminer.id : `ex${Date.now()}`,
        name: fd.get('name'),
        role: fd.get('role'),
        // NIP dihapus sesuai instruksi
        initials: getInitials(fd.get('name'))
    };
    if (editingExaminer) {
        setExaminers(prev => prev.map(ex => ex.id === editingExaminer.id ? newEx : ex));
    } else {
        setExaminers(prev => [...prev, newEx]);
    }
    setShowExaminerModal(false);
  };

  const handleDeleteExaminer = (id) => {
    setConfirmState({
        isOpen: true,
        title: "Hapus Pemeriksa?",
        message: "Prosedur yang ditugaskan ke pemeriksa ini akan kembali ke bank prosedur (unassigned).",
        onConfirm: () => {
            setExaminers(prev => prev.filter(ex => ex.id !== id));
            setAssignments(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    });
  };

  const handleSaveProcedure = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newProc = {
        id: editingProcedure ? editingProcedure.id : `pr${Date.now()}`,
        code: fd.get('code'),
        name: fd.get('name'),
        category: fd.get('category')
    };
    if (editingProcedure) {
        setProcedures(prev => prev.map(p => p.id === editingProcedure.id ? newProc : p));
    } else {
        setProcedures(prev => [...prev, newProc]);
    }
    setShowProcedureModal(false);
  };

  const handleDeleteProcedure = (id) => {
    setConfirmState({
        isOpen: true,
        title: "Hapus Prosedur?",
        message: "Prosedur akan dihapus permanen dari semua penugasan.",
        onConfirm: () => {
            setProcedures(prev => prev.filter(p => p.id !== id));
            // Cleanup assignments
            setAssignments(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(exId => {
                    next[exId] = next[exId].filter(pid => pid !== id);
                });
                return next;
            });
        }
    });
  };

  // DnD Logic
  const handleDragStart = (e, procId, sourceExId) => {
    dragItem.current = { id: procId, source: sourceExId };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetExId) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { id: procId, source: sourceExId } = dragItem.current;

    if (sourceExId === targetExId) return;

    setAssignments(prev => {
        const next = { ...prev };
        
        // Remove from source
        if (sourceExId !== 'bank' && next[sourceExId]) {
            next[sourceExId] = next[sourceExId].filter(pid => pid !== procId);
        }

        // Add to target
        if (targetExId !== 'bank') {
            if (!next[targetExId]) next[targetExId] = [];
            if (!next[targetExId].includes(procId)) {
                next[targetExId].push(procId);
            }
        }
        
        return next;
    });
    setLastSaved(new Date().toISOString());
    dragItem.current = null;
  };

  const getUnassignedProcedures = () => {
    const assignedIds = new Set();
    Object.values(assignments).forEach(list => list.forEach(pid => assignedIds.add(pid)));
    return procedures.filter(p => !assignedIds.has(p.id));
  };

  // Import/Export
  const performBackup = () => {
    const data = { examiners, procedures, assignments, meta: { title: projectTitle, status: currentStatus, lastSaved: new Date().toISOString() } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PKP_BACKUP_${formatTimestampForFile()}.json`;
    document.body.appendChild(link);
    link.click();
  };

  const handleLoadBackup = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const json = JSON.parse(evt.target.result);
            if(json.examiners && json.procedures) {
                setExaminers(json.examiners);
                setProcedures(json.procedures);
                setAssignments(json.assignments || {});
                if(json.meta) {
                    setProjectTitle(json.meta.title);
                    setCurrentStatus(json.meta.status);
                    setLastSaved(json.meta.lastSaved);
                }
                alert("Backup berhasil dimuat!");
            }
        } catch(err) { alert("File corrupt atau bukan format PKP APP"); }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Views ---

  // Component khusus untuk tampilan cetak
  const PrintTemplate = () => (
    <div className="hidden print:block p-8 bg-white text-black max-w-[210mm] mx-auto font-serif">
        <div className="text-center mb-8 border-b-4 border-double border-black pb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider">PROGRAM KERJA PERORANGAN (PKP)</h1>
            <h2 className="text-lg font-bold mt-1">{projectTitle}</h2>
            <p className="text-sm mt-1 uppercase">Status: {currentStatus}</p>
        </div>

        {examiners.map((ex, idx) => {
            const myTasks = assignments[ex.id] || [];
            if (myTasks.length === 0) return null;

            return (
                <div key={ex.id} className="mb-8 break-inside-avoid">
                    <div className="flex justify-between items-end border-b border-black mb-2 pb-1">
                        <div className="font-bold text-sm">
                             Nama: {ex.name}
                        </div>
                        <div className="text-sm font-bold bg-slate-100 px-2 border border-slate-300">
                             {EXAMINER_ROLES.find(r => r.key === ex.role)?.label}
                        </div>
                    </div>
                    <table className="w-full text-xs border-collapse border border-black">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="border border-black p-2 w-10 text-center">No</th>
                                <th className="border border-black p-2 w-24">Kode</th>
                                <th className="border border-black p-2">Prosedur / Langkah Kerja</th>
                                <th className="border border-black p-2 w-24 text-center">Paraf</th>
                                <th className="border border-black p-2 w-32 text-center">Realisasi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTasks.map((pid, i) => {
                                const proc = procedures.find(p => p.id === pid);
                                return (
                                    <tr key={pid}>
                                        <td className="border border-black p-2 text-center">{i + 1}</td>
                                        <td className="border border-black p-2 font-mono">{proc ? proc.code : '?'}</td>
                                        <td className="border border-black p-2">{proc ? proc.name : 'Unknown'}</td>
                                        <td className="border border-black p-2"></td>
                                        <td className="border border-black p-2"></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        })}

        {getUnassignedProcedures().length > 0 && (
            <div className="mt-8 border-t-2 border-dashed border-red-800 pt-4 break-inside-avoid">
                <h3 className="font-bold text-red-900 mb-2">BELUM DITUGASKAN (UNASSIGNED)</h3>
                <table className="w-full text-xs border-collapse border border-red-900 text-slate-800">
                     <tbody>
                        {getUnassignedProcedures().map((p, i) => (
                            <tr key={p.id}>
                                <td className="border border-red-900 p-1 w-10 text-center">{i+1}</td>
                                <td className="border border-red-900 p-1 w-24 font-mono">{p.code}</td>
                                <td className="border border-red-900 p-1">{p.name}</td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        )}

        <div className="mt-12 flex justify-end text-sm break-inside-avoid">
            <div className="text-center w-64">
                <p>Denpasar, {new Date().toLocaleDateString('id-ID', {year:'numeric', month:'long', day:'numeric'})}</p>
                <p className="mt-1">Mengetahui,</p>
                <p>Ketua Tim</p>
                <br/><br/><br/>
                <p className="font-bold border-b border-black inline-block min-w-[150px]"></p>
                <p className="mt-1">NIP.</p>
            </div>
        </div>
    </div>
  );

  const renderDashboard = () => {
    const totalProc = procedures.length;
    const totalAssigned = Object.values(assignments).reduce((acc, curr) => acc + curr.length, 0);
    const progress = totalProc === 0 ? 0 : Math.round((totalAssigned / totalProc) * 100);
    
    // Workload Chart Data
    const workload = examiners.map(ex => ({
        name: ex.name,
        count: assignments[ex.id] ? assignments[ex.id].length : 0
    })).sort((a,b) => b.count - a.count);

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Pemeriksaan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-red-100 font-medium">Progress Distribusi</p>
                            <h3 className="text-4xl font-bold mt-2">{progress}%</h3>
                            <p className="text-sm text-red-100 mt-1">{totalAssigned} dari {totalProc} prosedur terbagi</p>
                        </div>
                        <PieChart className="w-10 h-10 opacity-50" />
                    </div>
                    <div className="mt-4 bg-black/20 rounded-full h-2 w-full overflow-hidden">
                        <div className="bg-white/90 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-medium">Total Personil</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{examiners.length}</h3>
                        </div>
                        <Users className="w-10 h-10 text-red-700 bg-red-50 p-2 rounded-lg" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        {EXAMINER_ROLES.map(r => {
                            const count = examiners.filter(e => e.role === r.key).length;
                            return (
                                <div key={r.key} className={`px-2 py-1 rounded text-xs font-bold border ${r.color}`}>
                                    {r.key}: {count}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-medium">Status Dokumen</p>
                            <h3 className="text-xl font-bold text-slate-800 mt-2 capitalize">{currentStatus}</h3>
                            <p className="text-xs text-slate-400 mt-1">Last Saved: {lastSaved ? formatDate(lastSaved) : 'Never'}</p>
                        </div>
                        <FileText className="w-10 h-10 text-orange-600 bg-orange-50 p-2 rounded-lg" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        {PKP_STATUSES.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setCurrentStatus(s.id)} 
                                className={`w-3 h-3 rounded-full transition-all ${currentStatus === s.id ? 'bg-red-800 scale-125 ring-2 ring-red-200' : 'bg-slate-200 hover:bg-slate-300'}`}
                                title={s.label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-800" /> Beban Kerja Tim
                    </h3>
                    <div className="space-y-4">
                        {workload.map((w, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700">{w.name}</span>
                                    <span className="text-slate-500 font-mono">{w.count} Prosedur</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                        className="bg-red-700 h-2 rounded-full" 
                                        style={{ width: `${totalProc > 0 ? (w.count / totalProc * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {workload.length === 0 && <p className="text-slate-400 italic text-sm">Belum ada data tim.</p>}
                    </div>
                 </div>

                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Siap untuk Distribusi?</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs">Gunakan menu Manajemen Distribusi untuk membagi prosedur secara visual.</p>
                    <Button onClick={() => setActiveMenu('distribution')}>Mulai Distribusi <ChevronRight className="w-4 h-4" /></Button>
                 </div>
            </div>
        </div>
    );
  };

  const renderConfiguration = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                    {activeMenu === 'config_examiners' ? 'Manajemen Pemeriksa' : 'Bank Prosedur'}
                </h2>
                {activeMenu === 'config_examiners' ? (
                     <Button variant="secondary" onClick={() => { setEditingExaminer(null); setShowExaminerModal(true); }}>
                        <Plus className="w-4 h-4" /> Tambah Pemeriksa
                     </Button>
                ) : (
                    <Button variant="secondary" onClick={() => { setEditingProcedure(null); setShowProcedureModal(true); }}>
                        <Plus className="w-4 h-4" /> Tambah Prosedur
                    </Button>
                )}
             </div>

             {activeMenu === 'config_examiners' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Nama Lengkap</th>
                                <th className="px-6 py-3">Peran dalam Tim</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {examiners.map(ex => (
                                <tr key={ex.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-900 flex items-center justify-center text-xs font-bold border border-red-200">
                                            {ex.initials}
                                        </div>
                                        {ex.name}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${EXAMINER_ROLES.find(r => r.key === ex.role)?.color}`}>
                                            {EXAMINER_ROLES.find(r => r.key === ex.role)?.label || ex.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => { setEditingExaminer(ex); setShowExaminerModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded mr-1"><Pencil className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteExaminer(ex.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                            {examiners.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">Belum ada data pemeriksa.</td></tr>}
                        </tbody>
                    </table>
                </div>
             )}

             {activeMenu === 'config_procedures' && (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-32">Kode</th>
                                <th className="px-6 py-3">Langkah Kerja / Prosedur</th>
                                <th className="px-6 py-3 w-48">Kategori</th>
                                <th className="px-6 py-3 text-right w-32">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {procedures.map(proc => (
                                <tr key={proc.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono font-bold text-slate-600">{proc.code}</td>
                                    <td className="px-6 py-3 text-slate-800">{proc.name}</td>
                                    <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{proc.category}</span></td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => { setEditingProcedure(proc); setShowProcedureModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded mr-1"><Pencil className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteProcedure(proc.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                            {procedures.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">Belum ada prosedur.</td></tr>}
                        </tbody>
                    </table>
                </div>
             )}
        </div>
    );
  };

  const renderDistributionWorkspace = () => {
    const unassigned = getUnassignedProcedures();
    
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800">Workspace Distribusi</h2>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                        {isEditingTitle ? (
                            <input 
                                autoFocus 
                                className="border border-red-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={projectTitle} 
                                onChange={(e) => setProjectTitle(e.target.value)} 
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                            />
                        ) : (
                            <>
                                <span className="font-semibold text-slate-700">{projectTitle}</span>
                                <Pencil className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => backupInputRef.current.click()}><FolderOpen className="w-4 h-4"/> Load</Button>
                    <input type="file" ref={backupInputRef} onChange={handleLoadBackup} className="hidden" accept=".json" />
                    <Button variant="outline" onClick={performBackup}><Save className="w-4 h-4 text-blue-600"/> Save</Button>
                    <Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4"/> Cetak Laporan</Button>
                </div>
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                
                {/* Left: Bank Prosedur (Unassigned) */}
                <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Bank Prosedur</h3>
                        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">{unassigned.length}</span>
                    </div>
                    <div 
                        className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'bank')}
                    >
                        {unassigned.map(proc => (
                            <div 
                                key={proc.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, proc.id, 'bank')}
                                className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-red-400 hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">{proc.code}</span>
                                    <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-red-400" />
                                </div>
                                <p className="text-xs text-slate-700 line-clamp-2">{proc.name}</p>
                            </div>
                        ))}
                        {unassigned.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-xs italic">
                                Semua prosedur telah dibagikan! <CheckCircle2 className="w-8 h-8 mx-auto mt-2 text-green-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Examiners Cards */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                        {examiners.map(ex => {
                            const myProcs = assignments[ex.id] || [];
                            return (
                                <div 
                                    key={ex.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, ex.id)}
                                >
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white rounded-t-xl sticky top-0 z-10">
                                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-900 flex items-center justify-center font-bold text-sm shadow-inner">
                                            {ex.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate">{ex.name}</h4>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={`px-1.5 py-0.5 rounded font-semibold border ${EXAMINER_ROLES.find(r=>r.key===ex.role)?.color}`}>{EXAMINER_ROLES.find(r=>r.key===ex.role)?.label}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500">{myProcs.length} Tugas</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drop Zone List */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
                                        {myProcs.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-lg">
                                                <ArrowDownAZ className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-xs font-medium">Drop prosedur disini</span>
                                            </div>
                                        ) : (
                                            myProcs.map((pid, idx) => {
                                                const proc = procedures.find(p => p.id === pid);
                                                if (!proc) return null;
                                                return (
                                                    <div 
                                                        key={pid}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, pid, ex.id)}
                                                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-red-400 transition-all flex gap-2 group"
                                                    >
                                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 w-4">{idx+1}.</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1 rounded">{proc.code}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-700 leading-snug">{proc.name}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                // Return to bank logic manually
                                                                setAssignments(prev => {
                                                                    const next = {...prev};
                                                                    next[ex.id] = next[ex.id].filter(id => id !== pid);
                                                                    return next;
                                                                });
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 self-start text-slate-300 hover:text-rose-500 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderSidebar = () => (
    <div className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 h-screen sticky top-0 print:hidden`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 bg-gradient-to-tr from-red-800 to-rose-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-red-900/40">
                    P
                </div>
                {sidebarOpen && (
                    <div className="animate-in fade-in duration-300">
                        <h1 className="font-bold text-white tracking-tight leading-none">{APP_NAME}</h1>
                        <p className="text-[10px] text-slate-500 leading-none mt-1">Tools Pemeriksaan</p>
                    </div>
                )}
            </div>
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            <MenuButton 
                active={activeMenu === 'dashboard'} 
                onClick={() => setActiveMenu('dashboard')} 
                icon={<LayoutDashboard size={20} />} 
                label="Dashboard" 
                expanded={sidebarOpen}
            />
            
            <div className={`mt-6 mb-2 px-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${!sidebarOpen && 'hidden'}`}>
                Konfigurasi
            </div>
            <MenuButton 
                active={activeMenu === 'config_examiners'} 
                onClick={() => setActiveMenu('config_examiners')} 
                icon={<Users size={20} />} 
                label="Pemeriksa" 
                expanded={sidebarOpen}
            />
            <MenuButton 
                active={activeMenu === 'config_procedures'} 
                onClick={() => setActiveMenu('config_procedures')} 
                icon={<List size={20} />} 
                label="Prosedur" 
                expanded={sidebarOpen}
            />

            <div className={`mt-6 mb-2 px-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${!sidebarOpen && 'hidden'}`}>
                Manajemen
            </div>
            <MenuButton 
                active={activeMenu === 'distribution'} 
                onClick={() => setActiveMenu('distribution')} 
                icon={<Briefcase size={20} />} 
                label="Distribusi" 
                expanded={sidebarOpen}
            />
        </div>

        {/* Footer Toggle */}
        <div className="p-4 border-t border-slate-800">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            >
                {sidebarOpen ? <ChevronDown className="rotate-90" /> : <Menu />}
            </button>
        </div>
    </div>
  );

  return (
    <>
      {/* CSS for Print */}
      <style>{`
        @media print {
            .print-hidden { display: none !important; }
            @page { size: A4; margin: 1cm; }
        }
      `}</style>

      {/* Main Container */}
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white print:block">
          
          {/* Main Content (Hidden on Print) */}
          <div className="flex flex-1 print:hidden">
            {renderSidebar()}
            
            <main className="flex-1 p-8 overflow-hidden">
                {activeMenu === 'dashboard' && renderDashboard()}
                {(activeMenu === 'config_examiners' || activeMenu === 'config_procedures') && renderConfiguration()}
                {activeMenu === 'distribution' && renderDistributionWorkspace()}
            </main>
          </div>

          {/* Print Template (Visible only on Print) */}
          <PrintTemplate />

          {/* Modals (Hidden on Print implicitly) */}
          <div className="print:hidden">
              <Modal isOpen={showExaminerModal} onClose={() => setShowExaminerModal(false)} title={editingExaminer ? 'Edit Pemeriksa' : 'Tambah Pemeriksa'}>
                  <form onSubmit={handleSaveExaminer}>
                      <Input name="name" label="Nama Lengkap" defaultValue={editingExaminer?.name} required placeholder="Contoh: Budi Santoso" />
                      {/* Field NIP dihapus */}
                      <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Peran Tim</label>
                          <select name="role" defaultValue={editingExaminer?.role || 'AT'} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-800">
                              {EXAMINER_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                          <Button type="submit">Simpan</Button>
                          <Button variant="ghost" onClick={() => setShowExaminerModal(false)}>Batal</Button>
                      </div>
                  </form>
              </Modal>

              <Modal isOpen={showProcedureModal} onClose={() => setShowProcedureModal(false)} title={editingProcedure ? 'Edit Prosedur' : 'Tambah Prosedur'}>
                  <form onSubmit={handleSaveProcedure}>
                      <Input name="code" label="Kode Prosedur" defaultValue={editingProcedure?.code} required placeholder="Contoh: KAS-01" />
                      <Input name="category" label="Kategori Akun" defaultValue={editingProcedure?.category} placeholder="Contoh: Kas dan Setara Kas" />
                      <TextArea name="name" label="Langkah Kerja" defaultValue={editingProcedure?.name} required placeholder="Deskripsi lengkap prosedur..." />
                      <div className="flex justify-end gap-2 mt-6">
                          <Button type="submit">Simpan</Button>
                          <Button variant="ghost" onClick={() => setShowProcedureModal(false)}>Batal</Button>
                      </div>
                  </form>
              </Modal>

              <ConfirmModal 
                  isOpen={confirmState.isOpen} 
                  onClose={() => setConfirmState({...confirmState, isOpen: false})} 
                  title={confirmState.title} 
                  message={confirmState.message} 
                  onConfirm={confirmState.onConfirm} 
              />
          </div>
      </div>
    </>
  );
}

const MenuButton = ({ active, onClick, icon, label, expanded }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
            active 
            ? 'bg-red-800 text-white shadow-lg shadow-red-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title={!expanded ? label : ''}
    >
        <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</div>
        {expanded && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
        {!expanded && active && <div className="absolute right-0 top-2 w-1.5 h-1.5 rounded-full bg-white"></div>}
    </button>
);