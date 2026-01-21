import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Plus, Trash2, Users, FileText, GripVertical, Save, 
  X, LayoutDashboard, Menu, ChevronRight, ChevronDown, 
  Search, ArrowUpDown, Filter, Check, 
  ShieldCheck, Pencil, AlertTriangle, Info, Activity, CheckCircle2, List, FolderOpen, ArrowDownAZ, Printer, Briefcase, PieChart,
  Cloud, RefreshCw, ArrowUp, ArrowDown, Square, CheckSquare, Power, Settings, LogOut
} from 'lucide-react';

// --- Constants ---

const APP_NAME = "PKP APP";
const APP_SUBTITLE = "Tool Distribusi Prosedur Pemeriksaan dan Penyusunan PKP";
const DEVELOPER_NAME = "Tim DAC BPK Bali"; 
const YEAR = "2026";
const DEFAULT_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSR6Rs07aIVrcXR6D5h6S1YZLQ4GciEZLmh_TanvZQMUNxA5xHdR1R-U4C6h7lAGxyRpV9J_40cFqj7/pub?gid=0&single=true&output=csv";
// Google Sheet untuk validasi user login (NIP & Email BPK)
const USER_VALIDATION_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqy2RlO-gEG-j-JMYsGR-VB_pLsnca-NYvuv2zSoBvvTPPDxKg2hQboiiGNYG2eAtI7fERFH5LgZB7/pub?gid=0&single=true&output=csv";

// Role Pemeriksa (Disederhanakan)
const EXAMINER_ROLES = [
    { key: 'KT', label: 'Ketua Tim', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
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
  return parts.slice(0, 3).map(p => p[0]).join('').toUpperCase();
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
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    )}
    <input
      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      {...props}
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="mb-3">
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    )}
    <textarea
      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      rows={4}
      {...props}
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'Konfirmasi', confirmType = 'primary' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-6">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Batal</Button>
            <Button variant={confirmType} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;
  const icons = {
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-green-600" />,
    error: <AlertTriangle className="w-6 h-6 text-red-600" />
  };
  const colors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200'
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md m-4 border-2 ${colors[type]}`}>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {icons[type]}
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <p className="text-slate-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>OK</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExaminerFormFields = ({ editingExaminer, examiners }) => {
  const [selectedRole, setSelectedRole] = useState(editingExaminer?.role || 'AT');
  
  return (
    <>
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <select 
          name="role" 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        >
          {EXAMINER_ROLES.map(role => (
            <option key={role.key} value={role.key}>{role.label}</option>
          ))}
        </select>
      </div>
      
      {selectedRole === 'AT' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ketua Subtim</label>
          <select 
            name="kstId" 
            defaultValue={editingExaminer?.kstId || ''}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tidak ada</option>
            {examiners.filter(ex => ex.role === 'KST').map(kst => (
              <option key={kst.id} value={kst.id}>{kst.name}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
};

export default function App() {
  // --- State Declarations ---
  // Fix: Initialize these first to avoid ReferenceError
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [bankTab, setBankTab] = useState('LRA');
  const [showBankModal, setShowBankModal] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [examinerExpandedKeys, setExaminerExpandedKeys] = useState(new Set());
  
  const [examiners, setExaminers] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [activeMenu, setActiveMenu] = useState('distribution');
  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState(null);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [currentStatus, setCurrentStatus] = useState('draft');
  const [lastSaved, setLastSaved] = useState(null);
  const [selectedBankProcs, setSelectedBankProcs] = useState(new Set());
  const [selectedExaminerProcs, setSelectedExaminerProcs] = useState(new Set());
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(DEFAULT_CSV_URL);
  const [syncLoading, setSyncLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Konfirmasi', confirmType: 'primary' });
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [procFilters, setProcFilters] = useState({});
  const [procSort, setProcSort] = useState({ key: null, direction: 'asc' });
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  const [showPrintTahapanModal, setShowPrintTahapanModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginNip, setLoginNip] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // --- Examiner Modal Logic (Searchable Dropdown) ---
  const [userList, setUserList] = useState([]);
  const [examinerNameSearch, setExaminerNameSearch] = useState('');
  const [isExaminerDropdownOpen, setIsExaminerDropdownOpen] = useState(false);
  const [examinerNipValue, setExaminerNipValue] = useState('');

  const backupInputRef = useRef(null);

  // 1. Fetch User List (NIP/Nama) from Google Sheet on Mount
  useEffect(() => {
    const fetchUserList = async () => {
        try {
            const response = await fetch(USER_VALIDATION_SHEET_URL);
            const csvText = await response.text();
            
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const nipCol = headers.findIndex(h => h.includes('nip'));
            const namaCol = headers.findIndex(h => h.includes('nama'));
            
            const users = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length > 1) {
                    users.push({
                        nip: cols[nipCol] || '',
                        nama: cols[namaCol] || '' // Simpan nama as-is dari CSV
                    });
                }
            }
            setUserList(users);
        } catch (error) {
            console.error("Failed to fetch user list for dropdown", error);
        }
    };
    fetchUserList();
  }, []);

  // 2. Sync Local State when Examiner Modal Opens/Changes
  useEffect(() => {
      if (showExaminerModal) {
          if (editingExaminer) {
              setExaminerNameSearch(editingExaminer.name);
              setExaminerNipValue(editingExaminer.nip);
          } else {
              setExaminerNameSearch('');
              setExaminerNipValue('');
          }
      }
  }, [showExaminerModal, editingExaminer]);
  const dragItem = useRef(null);

  const showAlert = (title, message, type = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('pkp_currentUser');
    setLoginNip('');
    setLoginEmail('');
    showAlert('Sukses', 'Anda telah logout', 'success');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      // Fetch CSV dari Google Sheet
      const response = await fetch(USER_VALIDATION_SHEET_URL);
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find column indices dengan flexible matching
      const nipCol = headers.findIndex(h => h.includes('nip'));
      const emailCol = headers.findIndex(h => h.includes('email'));
      const namaCol = headers.findIndex(h => h.includes('nama'));
      
      // Cari user berdasarkan NIP dan Email
      let foundUser = null;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const userNip = cols[nipCol] || '';
        const userEmail = cols[emailCol] || '';
        const userNama = cols[namaCol] || '';
        
        // Asumsi input user hanya username (without @bpk.go.id), kita tambahkan suffix
        const inputUsername = loginEmail.trim();
        // Handle jika user tidak sengaja mengetik @bpk.go.id, kita hapus dulu atau biarkan logic username saja
        // Sesuai request: input hanya nama, jadi kita append manual.
        const fullLoginEmail = inputUsername + '@bpk.go.id';

        if (userNip === loginNip.trim() && userEmail.toLowerCase() === fullLoginEmail.toLowerCase()) {
          foundUser = {
            nip: userNip,
            email: userEmail,
            nama: userNama
          };
          break;
        }
      }

      if (foundUser) {
        // Login berhasil
        setCurrentUser(foundUser);
        setIsLoggedIn(true);
        localStorage.setItem('pkp_currentUser', JSON.stringify(foundUser));
        showAlert('Sukses', `Selamat datang, ${foundUser.nama}!`, 'success');
      } else {
        // Login gagal
        showAlert('Error', 'NIP atau Email tidak ditemukan dalam daftar karyawan BPK.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Error', 'Gagal memvalidasi login. Periksa koneksi internet Anda.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  // Check if user already logged in (on mount)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pkp_currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }, []);

  // --- Logic Implementations ---

  const handleSaveExaminer = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newEx = {
        id: editingExaminer ? editingExaminer.id : `ex${Date.now()}`,
        name: fd.get('name'),
        nip: fd.get('nip'),
        role: fd.get('role'),
        kstId: fd.get('kstId') || null,
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
        category: fd.get('nama_akun_1'), // Fallback category for charts/groups
        jenis_laporan: fd.get('jenis_laporan'),
        kode_akun_1: fd.get('kode_akun_1'),
        nama_akun_1: fd.get('nama_akun_1'),
        kode_akun_2: fd.get('kode_akun_2'),
        nama_akun_2: fd.get('nama_akun_2'),
        kode_akun_3: fd.get('kode_akun_3'),
        nama_akun_3: fd.get('nama_akun_3'),
        level: fd.get('level'),
        isheader: fd.get('isheader'),
        tahapan: fd.get('tahapan') || 'Terinci'
    };
    if (editingProcedure) {
        setProcedures(prev => prev.map(p => p.id === editingProcedure.id ? { ...newProc, isActive: p.isActive } : p));
    } else {
        setProcedures(prev => [...prev, { ...newProc, isActive: true }]);
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

  const handleGroupDragStart = (e, procIds, sourceExId = 'bank') => {
    const ids = Array.isArray(procIds) ? procIds : Array.from(procIds);
    if (ids.length === 0) {
        e.preventDefault();
        return;
    }

    const type = sourceExId === 'bank' ? 'bulk_bank' : 'bulk_examiner';
    dragItem.current = { type, ids: ids, source: sourceExId };
    
    // Custom Ghost Image
    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost-image';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.background = '#ef4444'; // red-500
    ghost.style.color = 'white';
    ghost.style.padding = '8px 16px';
    ghost.style.borderRadius = '20px';
    ghost.style.fontWeight = 'bold';
    ghost.style.fontSize = '14px';
    ghost.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    ghost.style.zIndex = '9999';
    ghost.innerText = `${ids.length} Prosedur`;
    document.body.appendChild(ghost);
    
    e.dataTransfer.setDragImage(ghost, 0, 0);
    e.dataTransfer.effectAllowed = 'copyMove';
    
    setTimeout(() => {
        const g = document.getElementById('drag-ghost-image');
        if(g) document.body.removeChild(g);
    }, 0);

    if (sourceExId === 'bank') {
         setTimeout(() => setShowBankModal(false), 50);
    }
  };

  // DnD Logic
  const handleDragStart = (e, procId, sourceExId) => {
    // Check if dragging a selected item in examiner list
    if (sourceExId !== 'bank' && selectedExaminerProcs.has(procId)) {
         // Filter selection to only those owned by sourceExId
         const mySelectedInfos = Array.from(selectedExaminerProcs).filter(id => {
             const ownerList = assignments[sourceExId] || [];
             return ownerList.includes(id);
         });
         
         if (mySelectedInfos.length > 1 && mySelectedInfos.includes(procId)) {
             dragItem.current = { type: 'bulk_examiner', ids: mySelectedInfos, source: sourceExId };
             
             // Custom Ghost Image
             const ghost = document.createElement('div');
             ghost.id = 'drag-ghost-image';
             ghost.style.position = 'absolute';
             ghost.style.top = '-1000px';
             ghost.style.background = '#0ea5e9'; // sky-500
             ghost.style.color = 'white';
             ghost.style.padding = '8px 16px';
             ghost.style.borderRadius = '20px';
             ghost.style.fontWeight = 'bold';
             ghost.style.fontSize = '14px';
             ghost.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
             ghost.style.zIndex = '9999';
             ghost.innerText = `${mySelectedInfos.length} Prosedur`;
             document.body.appendChild(ghost);
             
             e.dataTransfer.setDragImage(ghost, 0, 0);
             e.dataTransfer.effectAllowed = 'move';
             
             setTimeout(() => {
                 const g = document.getElementById('drag-ghost-image');
                 if(g) document.body.removeChild(g);
             }, 0);
             return;
         }
    }

    // Bulk Drag Logic for Bank
    if (sourceExId === 'bank' && selectedBankProcs.has(procId) && selectedBankProcs.size > 1) {
         dragItem.current = { type: 'bulk_bank', ids: Array.from(selectedBankProcs), source: 'bank' };
         
         // Custom Ghost Image for Bulk Drag
         const ghost = document.createElement('div');
         ghost.id = 'drag-ghost-image';
         ghost.style.position = 'absolute';
         ghost.style.top = '-1000px';
         ghost.style.background = '#ef4444'; // red-500
         ghost.style.color = 'white';
         ghost.style.padding = '8px 16px';
         ghost.style.borderRadius = '20px'; // pill shape
         ghost.style.fontWeight = 'bold';
         ghost.style.fontSize = '14px';
         ghost.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
         ghost.style.zIndex = '9999';
         ghost.innerText = `${selectedBankProcs.size} Prosedur`;
         document.body.appendChild(ghost);
         
         e.dataTransfer.setDragImage(ghost, 0, 0);
         e.dataTransfer.effectAllowed = 'copyMove';
         
         // Cleanup ghost after a short delay
         setTimeout(() => {
             const g = document.getElementById('drag-ghost-image');
             if(g) document.body.removeChild(g);
         }, 0);
    } else {
         dragItem.current = { id: procId, source: sourceExId, type: 'single' };
         e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDrop = (e, targetExId) => {
    e.preventDefault();
    if (!dragItem.current) return;
    
    // KST and KT cannot be assigned procedures
    const targetEx = examiners.find(ex => ex.id === targetExId);
    if (targetEx && (targetEx.role === 'KST' || targetEx.role === 'KT') && targetExId !== 'bank') {
        showAlert("Akses Ditolak", "Ketua Tim (KT) dan Ketua Subtim (KST) tidak dapat diberikan prosedur secara langsung.", "warning");
        return;
    }

    // Handle Bulk Drop
    if (dragItem.current.type === 'bulk_bank' || dragItem.current.type === 'bulk_examiner') {
        const { ids, source } = dragItem.current;
        setAssignments(prev => {
            const next = { ...prev };
            
            // Remove from source if distinct from target and source is not bank
            if (source !== 'bank' && source !== targetExId && next[source]) {
                 next[source] = next[source].filter(id => !ids.includes(id));
            }

            // Add to target
            if (targetExId !== 'bank') {
                if (!next[targetExId]) next[targetExId] = [];
                ids.forEach(id => {
                    if (!next[targetExId].includes(id)) next[targetExId].push(id);
                });
            }
            return next;
        });
        
        if (source === 'bank') {
            setSelectedBankProcs(new Set()); 
        } else {
            // Clear examiner selection if move successful could be done here, 
            // but we need to know WHICH examiner selection to clear.
            // For now, let's clear the specific selection used.
             setSelectedExaminerProcs(prev => {
                 const next = new Set(prev);
                 ids.forEach(id => next.delete(id));
                 return next;
             });
        }
        
        setLastSaved(new Date().toISOString());
        dragItem.current = null;
        return;
    }

    // Single Item Drop
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

  const parseCSV = (text) => {
    // Robust CSV Parsing
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    // Normalize line endings
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote ("") -> becomes single quote (")
                currentCell += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of cell
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            // End of row
            currentRow.push(currentCell.trim());
            // Only add non-empty rows
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            // Regular character
            currentCell += char;
        }
    }
    
    // Add last row if exists
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
        }
    }

    // Skip header (row 0) and map to objects
    // Mapping sesuai spec:
    // A=Jenis Laporan, B-C=Akun1, D-E=Akun2, F-G=Akun3, H-I=Prosedur, J=Level, K=Header
    return rows.slice(1).map((row, idx) => {
        return {
            id: `pr_cloud_${Date.now()}_${idx}`,
            jenis_laporan: row[0] || '',           // Kolom A
            kode_akun_1: row[1] || '',             // Kolom B
            nama_akun_1: row[2] || '',             // Kolom C
            kode_akun_2: row[3] || '',             // Kolom D
            nama_akun_2: row[4] || '',             // Kolom E
            kode_akun_3: row[5] || '',             // Kolom F
            nama_akun_3: row[6] || '',             // Kolom G
            code: row[7] || '?',                   // Kolom H - Kode Prosedur
            name: row[8] || 'Untitled Procedure',  // Kolom I - Uraian Prosedur
            level: row[9] || '',                   // Kolom J - Level
            isheader: row[10] || '0',              // Kolom K - Header
            category: row[2] || 'General',
            isActive: true,                        // Default Active
            tahapan: 'Terinci'                     // Default Tahapan
        };
    });
  };

  const toggleProcedureStatus = (procId) => {
    // Check if we are turning it OFF
    const proc = procedures.find(p => p.id === procId);
    const isActive = proc ? proc.isActive !== false : true;
    
    if (isActive) {
        // Turning OFF -> Remove from assignments
        setAssignments(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(exId => {
                next[exId] = next[exId].filter(pid => pid !== procId);
            });
            return next;
        });
    }

    setProcedures(prev => prev.map(p => {
        if (p.id === procId) {
            // Toggle logic: if active (true/undef) -> false. If false -> true.
            return { ...p, isActive: p.isActive === false ? true : false };
        }
        return p;
    }));
  };

  const toggleProcedureTahapan = (procId) => {
    setProcedures(prev => prev.map(p => {
        if (p.id === procId) {
            return { ...p, tahapan: p.tahapan === 'Interim' ? 'Terinci' : 'Interim' };
        }
        return p;
    }));
  };

  const toggleAllVisibleStatus = (targetStatus) => {
      // targetStatus: boolean (true = active, false = inactive)
      const visibleIds = new Set(getFilteredProcedures().map(p => p.id));
      
      setProcedures(prev => prev.map(p => {
          if (visibleIds.has(p.id)) {
              return { ...p, isActive: targetStatus };
          }
          return p;
      }));

      // Cleanup assignments if turning OFF
      if (targetStatus === false) {
          setAssignments(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(exId => {
                    next[exId] = next[exId].filter(pid => !visibleIds.has(pid));
                });
                return next;
            });
      }
  };

  const toggleAllVisibleTahapan = (targetTahapan) => {
      const visibleIds = new Set(getFilteredProcedures().map(p => p.id));
      setProcedures(prev => prev.map(p => {
          if (visibleIds.has(p.id)) {
              return { ...p, tahapan: targetTahapan };
          }
          return p;
      }));
  };

  // Export Procedures to Excel
  const handleExportProcedures = async () => {
    try {
        // Create Excel-compatible HTML table
        const headers = [
            'Jenis Laporan',
            'Kode Akun 1',
            'Nama Akun 1',
            'Kode Akun 2',
            'Nama Akun 2',
            'Kode Akun 3',
            'Nama Akun 3',
            'Kode Prosedur',
            'Uraian Prosedur',
            'Level',
            'Header'
        ];
        
        let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 5px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
    </style>
</head>
<body>
<table>
    <thead>
        <tr>
${headers.map(h => `            <th>${h}</th>`).join('\n')}
        </tr>
    </thead>
    <tbody>
`;

        procedures.forEach(proc => {
            const isHeader = (proc.isheader === '1' || proc.isheader === 1 || proc.isheader === 'TRUE') ? 'Ya' : 'Tidak';
            htmlContent += `        <tr>
            <td>${proc.jenis_laporan || ''}</td>
            <td>${proc.kode_akun_1 || ''}</td>
            <td>${proc.nama_akun_1 || ''}</td>
            <td>${proc.kode_akun_2 || ''}</td>
            <td>${proc.nama_akun_2 || ''}</td>
            <td>${proc.kode_akun_3 || ''}</td>
            <td>${proc.nama_akun_3 || ''}</td>
            <td>${proc.code || ''}</td>
            <td>${(proc.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td>${proc.level || ''}</td>
            <td>${isHeader}</td>
        </tr>
`;
        });

        htmlContent += `    </tbody>
</table>
</body>
</html>`;

        // Use File System Access API to save
        const fileName = `List Prosedur.xls`;
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
                description: 'Excel Spreadsheet',
                accept: { 'application/vnd.ms-excel': ['.xls'] }
            }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(htmlContent);
        await writable.close();

        showAlert('Sukses', `File "${fileName}" berhasil diekspor!`, 'success');
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Export error:', error);
            showAlert('Error', 'Gagal mengekspor file: ' + error.message, 'error');
        }
    }
  };

  const handleSyncProcedures = async () => {
    setSyncLoading(true);
    try {
        const response = await fetch(cloudUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();
        const newProcedures = parseCSV(text);
        
        if (newProcedures.length > 0) {
            setProcedures(newProcedures);
            setAssignments({}); // Reset assignments as IDs might change
            showAlert("Sukses", `Berhasil sinkronisasi! ${newProcedures.length} prosedur dimuat.`, "success");
            setShowCloudModal(false);
        } else {
            showAlert("Peringatan", "Tidak ada data prosedur ditemukan dalam file CSV.", "warning");
        }
    } catch (error) {
        console.error("Sync Error:", error);
        showAlert("Gagal Sinkronisasi", "Gagal melakukan sinkronisasi. Pastikan link publik CSV benar dan dapat diakses.", "error");
    } finally {
        setSyncLoading(false);
    }
  };

  // Import/Export
  const performBackup = async () => {
    const data = { examiners, procedures, assignments, meta: { title: projectTitle, status: currentStatus, lastSaved: new Date().toISOString() } };
    const content = JSON.stringify(data, null, 2);
    
    // Generate Filename: PKP_[nama proyek]_[tahun]-[bulan]-[tanggal]_[jam][menit][detik]
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    const safeTitle = projectTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    const filename = `PKP_${safeTitle}_${year}-${month}-${day}_${hour}${minute}${second}.pkp`;

    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'PKP Project File',
                    accept: { 'application/json': ['.pkp', '.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            showAlert("Sukses", "File backup berhasil disimpan.", "success");
        } else {
            // Fallback for browsers not supporting File System Access API
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showAlert("Sukses", "File backup diunduh.", "success");
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            showAlert("Gagal", "Gagal menyimpan file backup.", "error");
        }
    }
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
                showAlert("Sukses", "Backup berhasil dimuat!", "success");
            }
        } catch(err) { showAlert("Error", "File corrupt atau bukan format PKP APP", "error"); }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    setShowPrintTahapanModal(true);
  };

    const handlePrintPKP = async (tahapan) => {
        setShowPrintTahapanModal(false);
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const margin = 40;
            const pageWidth = doc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - margin * 2;

            const colFractions = [0.08, 0.10, 0.10, 0.10, 0.35, 0.12, 0.08, 0.07];
            const colWidths = colFractions.map(f => Math.round(f * contentWidth));

            const ketuaTim = examiners.find(ex => ex.role === 'KT');
            const ketuaSubtim = examiners.find(ex => ex.role === 'KST');

            const examinerData = examiners
                .filter(ex => ex.role !== 'KT')
                .map(examiner => {
                    const procIds = assignments[examiner.id] || [];
                    const procs = procIds
                        .map(id => procedures.find(p => p.id === id))
                        .filter(p => p && p.tahapan === tahapan);
                    return { examiner, procs };
                })
                .filter(item => item.procs.length > 0);

            examinerData.forEach((item, index) => {
                if (index > 0) doc.addPage();

                const { examiner, procs } = item;
                const roleLabel = EXAMINER_ROLES.find(r => r.key === examiner.role)?.label || examiner.role;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`PROGRAM KERJA PERORANGAN - PEMERIKSAAN ${tahapan.toUpperCase()}`, pageWidth / 2, margin, { align: 'center' });
                doc.setFontSize(12);
                doc.text(`${roleLabel} - ${examiner.name}`, pageWidth / 2, margin + 20, { align: 'center' });
                doc.text(`PEMERIKSAAN ${projectTitle}`, pageWidth / 2, margin + 40, { align: 'center' });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text(`Total Prosedur: ${procs.length}`, margin, margin + 65);

                const head = [[
                    'Jenis Laporan', 'Akun 1', 'Akun 2', 'Akun 3', 'Prosedur', 'Waktu Pemeriksaan', 'Indeks KKP No.', 'Catatan KT'
                ]];

                const body = procs.map(p => [
                    p.jenis_laporan || '',
                    [(p.kode_akun_1 || ''), (p.nama_akun_1 || '')].join('\n'),
                    [(p.kode_akun_2 || ''), (p.nama_akun_2 || '')].join('\n'),
                    [(p.kode_akun_3 || ''), (p.nama_akun_3 || '')].join('\n'),
                    [(p.code || ''), (p.name || '')].join('\n'),
                    ['Rencana:', 'Realisasi:'].join('\n'),
                    '',
                    ''
                ]);

                autoTable(doc, {
                    head,
                    body,
                    startY: margin + 80,
                    styles: { fontSize: 8, cellPadding: 4, valign: 'top', overflow: 'linebreak' },
                    headStyles: { fillColor: [230, 230, 230], halign: 'center', fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: colWidths[0], halign: 'left' },
                        1: { cellWidth: colWidths[1] },
                        2: { cellWidth: colWidths[2] },
                        3: { cellWidth: colWidths[3] },
                        4: { cellWidth: colWidths[4], halign: 'left' },
                        5: { cellWidth: colWidths[5] },
                        6: { cellWidth: colWidths[6] },
                        7: { cellWidth: colWidths[7] }
                    }
                });

                let y = doc.lastAutoTable.finalY + 25;

                const colW = (contentWidth - 20) / 3;
                const x1 = margin;
                const x2 = margin + colW + 10;
                const x3 = margin + 2 * (colW + 10);
                const boldItalic = () => doc.setFont('helvetica', 'bolditalic');
                const normal = () => doc.setFont('helvetica', 'normal');

                if (examiner.role === 'AT' || examiner.role === 'DKR') {
                    doc.text('Disusun oleh', x1, y);
                    boldItalic(); doc.text('ttd', x1, y + 18); normal();
                    doc.text(examiner.name, x1, y + 36);

                    if (ketuaSubtim) {
                        doc.text('Direviu oleh', x2, y);
                        boldItalic(); doc.text('ttd', x2, y + 18); normal();
                        doc.text(ketuaSubtim.name, x2, y + 36);

                        doc.text('Disetujui oleh', x3, y);
                        boldItalic(); doc.text('ttd', x3, y + 18); normal();
                        doc.text(ketuaTim?.name || '', x3, y + 36);
                    } else {
                        doc.text('Direviu dan disetujui oleh', x2, y);
                        boldItalic(); doc.text('ttd', x2, y + 18); normal();
                        doc.text(ketuaTim?.name || '', x2, y + 36);
                    }
                } else if (examiner.role === 'KST') {
                    doc.text('Disusun oleh', x1, y);
                    boldItalic(); doc.text('ttd', x1, y + 18); normal();
                    doc.text(examiner.name, x1, y + 36);

                    doc.text('Disetujui oleh', x3, y);
                    boldItalic(); doc.text('ttd', x3, y + 18); normal();
                    doc.text(ketuaTim?.name || '', x3, y + 36);
                }
            });

            const fileName = `PKP ${projectTitle}.pdf`;
            const pdfBytes = doc.output('arraybuffer');
            if (window.showSaveFilePicker) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }]
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(new Blob([pdfBytes], { type: 'application/pdf' }));
                    await writable.close();
                    showAlert('Sukses', 'PDF berhasil disimpan.', 'success');
                    return;
                } catch (e) {
                    if (e.name === 'AbortError') return;
                }
            }
            doc.save(fileName);
        } catch (error) {
            console.error('Print error:', error);
            showAlert('Error', 'Gagal mencetak PKP: ' + error.message, 'error');
        }
    };

  const handleBulkAssign = (examinerId) => {
    if (!examinerId || selectedBankProcs.size === 0) return;

    setAssignments(prev => {
        const next = { ...prev };
        if (!next[examinerId]) next[examinerId] = [];
        
        // Add selected IDs to assignment, ensuring uniqueness
        const currentAssigned = new Set(next[examinerId]);
        selectedBankProcs.forEach(id => currentAssigned.add(id));
        
        next[examinerId] = Array.from(currentAssigned);
        return next;
    });

    // Clear selection
    setSelectedBankProcs(new Set());
  };

  // --- Filtering & Sorting Logic ---
  
  const getProcedureValue = (proc, key) => {
      switch(key) {
        case 'akun_1': return `${proc.kode_akun_1} ${proc.nama_akun_1}`.trim();
        case 'akun_2': return `${proc.kode_akun_2} ${proc.nama_akun_2}`.trim();
        case 'akun_3': return `${proc.kode_akun_3} ${proc.nama_akun_3}`.trim();
        case 'prosedur': return `${proc.code} ${proc.name}`.trim();
        case 'isheader': return (proc.isheader === '1' || proc.isheader === 1 || proc.isheader === 'TRUE') ? 'Ya' : 'Tidak';
        case 'status': return proc.isActive !== false ? 'Aktif' : 'Nonaktif';
        case 'tahapan': return proc.tahapan || 'Terinci';
        default: return proc[key] ? String(proc[key]) : '';
      }
  };

  const getFilteredProcedures = () => {
      return procedures.filter(proc => {
          return Object.entries(procFilters).every(([key, allowedValues]) => {
              if (!allowedValues || allowedValues.size === 0) return true;
              const val = getProcedureValue(proc, key);
              return allowedValues.has(val);
          });
      }).sort((a, b) => {
          if (!procSort.key) return 0;
          const valA = getProcedureValue(a, procSort.key).toLowerCase();
          const valB = getProcedureValue(b, procSort.key).toLowerCase();
          
          if (valA < valB) return procSort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return procSort.direction === 'asc' ? 1 : -1;
          return 0;
      });
  };

  const getFilterOptions = (columnKey) => {
    // Interconnected filtering: Options shown based on OTHER active filters
    const otherFilters = { ...procFilters };
    delete otherFilters[columnKey];

    const relevantProcedures = procedures.filter(proc => {
        return Object.entries(otherFilters).every(([key, allowedValues]) => {
            if (!allowedValues || allowedValues.size === 0) return true;
            const val = getProcedureValue(proc, key);
            return allowedValues.has(val);
        });
    });

    const values = new Set();
    relevantProcedures.forEach(proc => {
        values.add(getProcedureValue(proc, columnKey));
    });
    return Array.from(values).sort();
  };

  const toggleFilter = (columnKey, value) => {
      setProcFilters(prev => {
          const next = { ...prev };
          if (!next[columnKey]) next[columnKey] = new Set(getFilterOptions(columnKey)); // Initialize with all logic if needed, but here we assume "all selected" means undefined or set matches all.
          // Wait, logic: "Select All" checked = fileter undefined/null.
          // User uncheck one item -> filter becomes "All except one".
          
          // Better logic: 
          // If filter exists, toggle value.
          // If filter doesn't exist (showing all), initialize it with ALL options minus the one being toggled off.
          
          const titleMap = new Set(next[columnKey] || getFilterOptions(columnKey));
          
          if (titleMap.has(value)) {
              titleMap.delete(value);
          } else {
              titleMap.add(value);
          }
          
          // If all options selected, clear filter
          const allOptions = getFilterOptions(columnKey);
          if (titleMap.size === allOptions.length) {
              delete next[columnKey];
          } else {
              next[columnKey] = titleMap;
          }
          
          return next;
      });
  };

  const toggleSelectAll = (columnKey, allOptions) => {
      setProcFilters(prev => {
          const next = { ...prev };
          if (!next[columnKey]) {
            // Currently all selected -> Deselect all
            next[columnKey] = new Set();
          } else {
             // Currently filtered -> Select all (clear filter)
             delete next[columnKey];
          }
          return next;
      });
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



  const renderConfiguration = () => {
    const filteredData = getFilteredProcedures();
    
    // Summary Stats - Calculated for Display in Bank Prosedur (Config Procedures)
    const totalProc = procedures.length;
    const activeProcs = procedures.filter(p => p.isActive !== false);
    const countActive = activeProcs.length;
    const inactiveProcsLength = procedures.filter(p => p.isActive === false).length;
    const interimProcsLength = activeProcs.filter(p => p.tahapan === 'Interim').length;
    const terinciProcsLength = activeProcs.filter(p => p.tahapan !== 'Interim').length;
    // const pctActive = totalProc > 0 ? Math.round((countActive / totalProc) * 100) : 0; // Unused variable in UI currently

    const TableHeader = ({ label, columnKey, width }) => {
        const isSorted = procSort.key === columnKey;
        const isFiltered = procFilters[columnKey];
        const options = getFilterOptions(columnKey);
        const [searchTerm, setSearchTerm] = useState('');
        const [tempSelection, setTempSelection] = useState(null); // Temporary selection before apply

        // Initialize temp selection when dropdown opens
        React.useEffect(() => {
            if (activeFilterDropdown === columnKey) {
                setTempSelection(procFilters[columnKey] ? new Set(procFilters[columnKey]) : null);
                setSearchTerm('');
            }
        }, [activeFilterDropdown]);

        // Filter options logic
        const displayedOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Check state - use temp selection if exists
        const currentSelection = tempSelection !== null ? tempSelection : procFilters[columnKey];
        const isAllSelected = !currentSelection;
        
        const isSelected = (val) => !currentSelection || currentSelection.has(val);

        const toggleTempFilter = (value) => {
            setTempSelection(prev => {
                const current = prev || new Set(options);
                const next = new Set(current);
                
                if (next.has(value)) {
                    next.delete(value);
                } else {
                    next.add(value);
                }
                
                return next;
            });
        };

        const toggleTempSelectAll = () => {
            setTempSelection(prev => {
                // If prev is null, it means 'All Selected' (conceptually options set)
                const current = prev || new Set(options);
                const next = new Set(current);
                
                // If search is active, we only toggle the VISIBLE items
                const targets = displayedOptions;
                
                // Check if all TARGET items are currently selected
                const allTargetsSelected = targets.every(t => next.has(t));

                if (allTargetsSelected) {
                    // Deselect visible items
                    targets.forEach(t => next.delete(t));
                } else {
                    // Select visible items
                    targets.forEach(t => next.add(t));
                }

                return next;
            });
        };

        const applyFilter = () => {
            setProcFilters(prev => {
                const next = { ...prev };
                if (!tempSelection || tempSelection.size === options.length) {
                    delete next[columnKey];
                } else if (tempSelection.size === 0) {
                    next[columnKey] = new Set();
                } else {
                    next[columnKey] = tempSelection;
                }
                return next;
            });
            setActiveFilterDropdown(null);
        };

        const cancelFilter = () => {
            setActiveFilterDropdown(null);
        };

        return (
            <th className={`px-3 py-2.5 font-semibold text-slate-700 bg-slate-50 border-b border-r border-slate-200 select-none text-xs ${width}`}>
                <div className="flex items-center justify-between gap-2">
                    <span 
                        className="cursor-pointer hover:text-red-700 flex items-center gap-1"
                        onClick={() => setProcSort({ key: columnKey, direction: procSort.key === columnKey && procSort.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                        {label}
                        <div className="flex flex-col">
                            {(!isSorted || procSort.direction === 'asc') && <ArrowUp className={`w-2 h-2 ${isSorted ? 'text-red-600' : 'text-slate-300'}`} />}
                            {(!isSorted || procSort.direction === 'desc') && <ArrowDown className={`w-2 h-2 ${isSorted ? 'text-red-600' : 'text-slate-300'}`} />}
                        </div>
                    </span>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (activeFilterDropdown === columnKey) {
                                    setActiveFilterDropdown(null);
                                } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setFilterDropdownPos({
                                        top: Math.min(window.innerHeight - 450, rect.bottom + 8),
                                        left: Math.max(20, Math.min(window.innerWidth - 310, rect.right - 288))
                                    });
                                    setActiveFilterDropdown(columnKey); 
                                }
                            }}
                            className={`p-1 rounded hover:bg-slate-200 ${isFiltered ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}
                        >
                            <Filter className="w-3 h-3" />
                        </button>

                        {activeFilterDropdown === columnKey && filterDropdownPos && (
                            <div className="fixed bg-white rounded-lg shadow-xl border border-slate-200 z-[100] flex flex-col w-72 animate-in fade-in zoom-in-95" 
                                 style={{ 
                                     top: `${filterDropdownPos.top}px`,
                                     left: `${filterDropdownPos.left}px`
                                 }}
                                 onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-3">
                                    <div className="relative group">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-red-500 transition-colors" />
                                        <input 
                                            autoFocus
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-slate-700" 
                                            placeholder="Cari..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div 
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm transition-colors"
                                        onClick={toggleTempSelectAll}
                                    >
                                        <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-red-600 border-red-600' : 'bg-white border-slate-500'}`}>
                                            {isAllSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="font-bold text-slate-800">Pilih Semua</span>
                                    </div>
                                    <div className="h-px bg-slate-100 mx-3 my-1"></div>
                                    {displayedOptions.map((opt, idx) => {
                                        const selected = isSelected(opt);
                                        return (
                                            <div 
                                                key={idx} 
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm transition-colors"
                                                onClick={() => toggleTempFilter(opt)}
                                            >
                                                <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${selected ? 'bg-red-600 border-red-600' : 'bg-white border-slate-500'}`}>
                                                    {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </div>
                                                <span className="truncate text-slate-600">{opt || '(Kosong)'}</span>
                                            </div>
                                        );
                                    })}
                                    {displayedOptions.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">Tidak ada hasil</div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-slate-100 mt-1 flex justify-between items-center bg-white rounded-b-lg">
                                    <button 
                                        onClick={applyFilter}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm shadow-sm transition-colors"
                                    >
                                        Terapkan
                                    </button>
                                    <button 
                                        onClick={cancelFilter}
                                        className="text-slate-500 hover:text-slate-800 font-medium text-sm px-2 py-2 transition-colors"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </th>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in" onClick={() => setActiveFilterDropdown(null)}>
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                    {activeMenu === 'config_examiners' ? 'Manajemen Pemeriksa' : 'Bank Prosedur'}
                </h2>
                {activeMenu === 'config_examiners' ? (
                     <Button variant="secondary" onClick={() => { setEditingExaminer(null); setShowExaminerModal(true); }}>
                        <Plus className="w-4 h-4" /> Tambah Pemeriksa
                     </Button>
                ) : (
                    <div className="flex gap-2">
                        {Object.keys(procFilters).length > 0 && (
                            <Button variant="outline" onClick={() => setProcFilters({})} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                <Filter className="w-4 h-4 mr-2" /> Hapus Seluruh Filter
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleExportProcedures} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                            <Save className="w-4 h-4" /> Ekspor Seluruh Prosedur (.xls)
                        </Button>
                        <Button variant="outline" onClick={() => setShowCloudModal(true)}>
                            <Cloud className="w-4 h-4" /> Sinkronisasi
                        </Button>
                        <Button variant="secondary" onClick={() => { setEditingProcedure(null); setShowProcedureModal(true); }}>
                            <Plus className="w-4 h-4" /> Tambah Prosedur
                        </Button>
                    </div>
                )}
             </div>
             
             {activeMenu === 'config_procedures' && (
                 <div className="grid grid-cols-4 gap-4 mb-2">
                     <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-500 font-semibold uppercase">Total Prosedur</div>
                         <div className="text-2xl font-bold text-slate-800">{totalProc}</div>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                         <div className="text-xs text-slate-500 font-semibold uppercase">Prosedur Aktif</div>
                         <div className="text-2xl font-bold text-green-600">{countActive}</div>
                         <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                             <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 font-bold">Interim: {interimProcsLength}</span>
                             <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">Terinci: {terinciProcsLength}</span>
                         </div>
                     </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-500 font-semibold uppercase">Prosedur Non-Aktif</div>
                         <div className="text-2xl font-bold text-slate-400">{inactiveProcsLength}</div>
                     </div>
                 </div>
             )}

             {activeMenu === 'config_examiners' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-40">NIP BPK</th>
                                <th className="px-6 py-3">Nama</th>
                                <th className="px-6 py-3">Peran</th>
                                <th className="px-6 py-3">Subtim</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {examiners.map((ex, index) => (
                                <tr 
                                    key={ex.id} 
                                    className="hover:bg-slate-50 group transition-colors"
                                    draggable
                                    onDragStart={(e) => {
                                        dragItem.current = { type: 'examiner_sort', index };
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.target.style.opacity = '0.5';
                                    }}
                                    onDragEnd={(e) => {
                                        e.target.style.opacity = '1';
                                        dragItem.current = null;
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if(!dragItem.current || dragItem.current.type !== 'examiner_sort') return;
                                        const sourceIndex = dragItem.current.index;
                                        const targetIndex = index;
                                        if(sourceIndex === targetIndex) return;
                                        
                                        setExaminers(prev => {
                                            const newArr = [...prev];
                                            const [removed] = newArr.splice(sourceIndex, 1);
                                            newArr.splice(targetIndex, 0, removed);
                                            return newArr;
                                        });
                                    }}
                                >
                                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                                        {ex.nip || '-'}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                {ex.nip ? (
                                                    <img 
                                                        src={`https://sisdm.bpk.go.id/photo/${ex.nip}/md.jpg`} 
                                                        alt={ex.initials}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div className="w-full h-full bg-red-100 text-red-900 flex items-center justify-center text-xs font-bold" style={{ display: ex.nip ? 'none' : 'flex' }}>
                                                    {ex.initials}
                                                </div>
                                            </div>
                                            <span>{ex.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${EXAMINER_ROLES.find(r => r.key === ex.role)?.color}`}>
                                            {EXAMINER_ROLES.find(r => r.key === ex.role)?.label || ex.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 text-sm">
                                        {ex.kstId ? examiners.find(e => e.id === ex.kstId)?.name || '-' : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => { setEditingExaminer(ex); setShowExaminerModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded mr-1"><Pencil className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteExaminer(ex.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                            {examiners.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Belum ada data pemeriksa.</td></tr>}
                        </tbody>
                    </table>
                </div>
             )}

             {activeMenu === 'config_procedures' && (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-auto h-[calc(100vh-10rem)]">
                    <table className="w-full text-sm text-left relative">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                            <tr>
                                <TableHeader label="Status" columnKey="status" width="w-24" />
                                <TableHeader label="Tahapan" columnKey="tahapan" width="w-24" />
                                <TableHeader label="Jenis Laporan" columnKey="jenis_laporan" width="w-24" />
                                <TableHeader label="Akun 1" columnKey="akun_1" width="w-32" />
                                <TableHeader label="Akun 2" columnKey="akun_2" width="w-32" />
                                <TableHeader label="Akun 3" columnKey="akun_3" width="w-32" />
                                <TableHeader label="Prosedur" columnKey="prosedur" width="" />
                                <TableHeader label="Level" columnKey="level" width="w-16" />
                                <TableHeader label="Header" columnKey="isheader" width="w-16" />
                                <th className="px-3 py-2.5 text-right w-20 text-xs">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-left">
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <td colSpan="10" className="px-3 py-2 text-xs">
                                    <div className="flex gap-4">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs font-semibold text-slate-500">Set Status:</span>
                                            <button onClick={() => toggleAllVisibleStatus(true)} className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-200 transition-colors">
                                                <Power className="w-3 h-3"/> Aktifkan Prosedur Terfilter
                                            </button>
                                            <button onClick={() => toggleAllVisibleStatus(false)} className="flex items-center gap-1.5 px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 border border-slate-300 transition-colors">
                                                <Power className="w-3 h-3"/> Nonaktifkan Prosedur Terfilter
                                            </button>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200"></div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-xs font-semibold text-slate-500">Set Tahapan:</span>
                                            <button onClick={() => toggleAllVisibleTahapan('Interim')} className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-200 transition-colors">
                                                <CheckSquare className="w-3 h-3"/> Plot Prosedur Terfilter ke Interim
                                            </button>
                                            <button onClick={() => toggleAllVisibleTahapan('Terinci')} className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-200 transition-colors">
                                                <List className="w-3 h-3"/> Plot Prosedur Terfilter ke Terinci
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            {filteredData.map(proc => (
                                <tr key={proc.id} className={`hover:bg-slate-50 align-top group ${proc.isActive === false ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                    <td className="px-3 py-2.5 text-center align-middle border-r border-slate-200">
                                        <button 
                                            onClick={() => toggleProcedureStatus(proc.id)}
                                            className={`p-1 rounded-full border transition-all ${proc.isActive !== false 
                                                ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                                                : 'bg-slate-100 border-slate-300 text-slate-400 hover:bg-slate-200'}`}
                                            title={proc.isActive !== false ? "Aktif (Tampil di Distribusi)" : "Nonaktif (Disembunyikan)"}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                    <td className="px-3 py-2.5 text-center align-middle border-r border-slate-200">
                                        <button 
                                            onClick={() => toggleProcedureTahapan(proc.id)}
                                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all w-16 ${proc.tahapan === 'Interim' 
                                                ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' 
                                                : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'}`}
                                            title="Klik untuk ubah tahapan"
                                        >
                                            {proc.tahapan || 'Terinci'}
                                        </button>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600 align-middle border-r border-slate-200">
                                        <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{proc.jenis_laporan}</span>
                                    </td>
                                    <td className="px-3 py-2.5 align-middle border-r border-slate-200">
                                        <span className="inline-block font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mb-1">{proc.kode_akun_1}</span>
                                        <div className="text-slate-800 text-[11px] leading-tight">{proc.nama_akun_1}</div>
                                    </td>
                                    <td className="px-3 py-2.5 align-middle border-r border-slate-200">
                                        <span className="inline-block font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mb-1">{proc.kode_akun_2}</span>
                                        <div className="text-slate-800 text-[11px] leading-tight">{proc.nama_akun_2}</div>
                                    </td>
                                    <td className="px-3 py-2.5 align-middle border-r border-slate-200">
                                        <span className="inline-block font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mb-1">{proc.kode_akun_3}</span>
                                        <div className="text-slate-800 text-[11px] leading-tight">{proc.nama_akun_3}</div>
                                    </td>
                                    <td className="px-3 py-2.5 border-r border-slate-200">
                                        <div className="flex gap-1.5 mb-1">
                                            <span className="font-mono font-bold text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{proc.code}</span>
                                            {proc.isheader === '1' && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded font-bold border border-yellow-200">HEADER</span>}
                                        </div>
                                        <div className="text-slate-800 text-[13px] leading-snug">{proc.name}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center align-middle border-r border-slate-200">
                                        <span className="font-mono font-semibold text-slate-600 text-[11px]">{proc.level}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center align-middle border-r border-slate-200">
                                        {proc.isheader === '1' || proc.isheader === 1 || proc.isheader === 'TRUE' ? 
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : 
                                            <span className="text-slate-300 text-xs">-</span>
                                        }
                                    </td>
                                    <td className="px-3 py-2.5 text-right whitespace-nowrap align-middle">
                                        <button onClick={() => { setEditingProcedure(proc); setShowProcedureModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded mr-1 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                                        <button onClick={() => handleDeleteProcedure(proc.id)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Filter className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="font-medium">Tidak ada data yang sesuai filter</p>
                                            <button onClick={() => setProcFilters({})} className="mt-2 text-blue-600 text-sm hover:underline">Reset Filter</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             )}
        </div>
    );
  };

  const renderDistributionWorkspace = () => {
    // Only show ACTIVE procedures in distribution
    const unassigned = getUnassignedProcedures().filter(p => p.isActive !== false);
    
    // --- STATISTICS CALCULATION ---
    const activeProcs = procedures.filter(p => p.isActive !== false);
    const countActive = activeProcs.length;
    const interimProcsLength = activeProcs.filter(p => p.tahapan === 'Interim').length;
    const terinciProcsLength = activeProcs.filter(p => !p.tahapan || p.tahapan === 'Terinci').length;
    
    const totalAssigned = Object.values(assignments).flat().length;
    const progress = countActive === 0 ? 0 : Math.round((totalAssigned / countActive) * 100);
    // ----------------------------
    
    // Calculate counts for each tab
    const tabCounts = {
        LRA: unassigned.filter(p => p.jenis_laporan?.toUpperCase() === 'LRA').length,
        Neraca: unassigned.filter(p => p.jenis_laporan?.toUpperCase() === 'NERACA').length,
        LO: unassigned.filter(p => p.jenis_laporan?.toUpperCase() === 'LO').length
    };

    const unassignedFiltered = unassigned.filter(p => {
        const matchesSearch = p.code.toLowerCase().includes(bankSearchTerm.toLowerCase()) || 
                              p.name.toLowerCase().includes(bankSearchTerm.toLowerCase());
        const matchesTab = p.jenis_laporan?.toUpperCase() === bankTab.toUpperCase();
        return matchesSearch && matchesTab;
    });
    
    // Bank Prosedur Render Content
    const renderBankContent = () => (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl space-y-3">
                <div className="flex flex-col">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4"/> Bank Prosedur</h3>
                    <div className="flex items-center gap-2">
                        {unassigned.length > 0 ? (
                            <span className="bg-rose-100 text-rose-700 text-lg font-bold px-3 py-1 rounded-full">{unassigned.length}</span>
                        ) : (
                             <span className="bg-green-100 text-green-700 text-lg font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-5 h-5" /> Selesai
                            </span>
                        )}
                        <span className="text-sm font-medium text-slate-600 leading-tight">
                            {unassigned.length === 0 ? "Seluruh prosedur telah terdistribusi." : "prosedur belum terdistribusi."}
                        </span>
                    </div>
                </div>
                
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400"/>
                    <input 
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-red-500" 
                        placeholder="Cari prosedur... (Kode/Nama)" 
                        value={bankSearchTerm}
                        onChange={(e) => setBankSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-slate-200/50 rounded-lg gap-1">
                    {['LRA', 'Neraca', 'LO'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setBankTab(tab)}
                            className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all ${
                                bankTab === tab 
                                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {tab} ({tabCounts[tab] || 0})
                        </button>
                    ))}
                </div>

                {selectedBankProcs.size > 0 && (
                        <div 
                            draggable
                            onDragStart={(e) => handleGroupDragStart(e, selectedBankProcs)}
                            className="bg-blue-50 p-2 rounded border border-blue-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                            <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1">
                                <GripVertical className="w-3 h-3" />
                                {selectedBankProcs.size} item siap ditarik (Drag & Drop)
                            </span>
                            <button onClick={() => setSelectedBankProcs(new Set())} className="text-[10px] text-blue-600 hover:underline">Batal</button>
                        </div>
                )}
                
                <div className="flex items-center gap-2 px-1">
                    <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                        checked={unassignedFiltered.length > 0 && selectedBankProcs.size === unassignedFiltered.length}
                        onChange={(e) => {
                            if(e.target.checked) {
                                setSelectedBankProcs(new Set(unassignedFiltered.map(p => p.id)));
                            } else {
                                setSelectedBankProcs(new Set());
                            }
                        }}
                    />
                    <span className="text-xs text-slate-500">Pilih Semua ({unassignedFiltered.length})</span>
                </div>
            </div>
            
            <div 
                className="flex-1 overflow-y-auto p-2 bg-slate-50/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'bank')}
            >
                {(() => {
                    // Use Akun 3 as Level 3. If null/empty, group under "Prosedur"
                    const hierarchy = {};
                    unassignedFiltered.forEach(proc => {
                        const l1 = proc.nama_akun_1 || 'Lainnya';
                        const l2 = proc.nama_akun_2 || 'Lainnya';
                        const l3 = proc.nama_akun_3 || 'Rincian Prosedur';
                        
                        if(!hierarchy[l1]) hierarchy[l1] = {};
                        if(!hierarchy[l1][l2]) hierarchy[l1][l2] = {};
                        if(!hierarchy[l1][l2][l3]) hierarchy[l1][l2][l3] = [];
                        
                        hierarchy[l1][l2][l3].push(proc);
                    });

                    // Utility to find the earliest code in a group of procedures
                    const getMinCode = (procs) => {
                        if (!procs || procs.length === 0) return '';
                        return procs.reduce((min, p) => {
                            if (!min) return p.code;
                            return p.code.localeCompare(min, undefined, { numeric: true }) < 0 ? p.code : min;
                        }, null);
                    };

                    // Function to flatten object to get all procedures recursively
                    const getAllProcsInL1 = (l2Obj) => {
                         return Object.values(l2Obj).flatMap(l3Obj => Object.values(l3Obj).flat());
                    };

                    const getAllProcsInL2 = (l3Obj) => {
                         return Object.values(l3Obj).flat();
                    };

                    // Sort L1 Keys (Akun 1)
                    const l1Keys = Object.keys(hierarchy).sort((a, b) => {
                        const procsA = getAllProcsInL1(hierarchy[a]);
                        const codeA = getMinCode(procsA);
                        const procsB = getAllProcsInL1(hierarchy[b]);
                        const codeB = getMinCode(procsB);
                        return codeA.localeCompare(codeB, undefined, { numeric: true });
                    });

                    return l1Keys.map(k1 => {
                        const l2Obj = hierarchy[k1];
                        
                        // Sort L2 Keys (Akun 2)
                        const l2Keys = Object.keys(l2Obj).sort((a, b) => {
                             const procsA = getAllProcsInL2(l2Obj[a]);
                             const procsB = getAllProcsInL2(l2Obj[b]);
                             const codeA = getMinCode(procsA);
                             const codeB = getMinCode(procsB);
                             return codeA.localeCompare(codeB, undefined, { numeric: true });
                        });

                        const allProcsInL1 = getAllProcsInL1(l2Obj);
                        const isL1Selected = allProcsInL1.every(p => selectedBankProcs.has(p.id));
                        const isL1Partial = !isL1Selected && allProcsInL1.some(p => selectedBankProcs.has(p.id));
                        const isL1Expanded = expandedKeys.has(k1);

                        return (
                            <div key={k1} className="mb-2">
                                <div 
                                    draggable
                                    onDragStart={(e) => handleGroupDragStart(e, allProcsInL1.map(p => p.id))}
                                    className="flex items-center gap-2 bg-slate-200/80 px-2 py-1.5 border-y border-slate-300 sticky top-0 z-20 backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-slate-300 transition-colors"
                                >
                                        <button  
                                        onClick={() => {
                                            setExpandedKeys(prev => {
                                                const next = new Set(prev);
                                                if(next.has(k1)) next.delete(k1);
                                                else next.add(k1);
                                                return next;
                                            });
                                        }}
                                        className="p-0.5 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                                        >
                                        {isL1Expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                        <input 
                                        type="checkbox"
                                        className="rounded border-slate-400 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                                        checked={isL1Selected}
                                        ref={el => { if(el) el.indeterminate = isL1Partial; }}
                                        onChange={(e) => {
                                            const newSet = new Set(selectedBankProcs);
                                            if(e.target.checked) allProcsInL1.forEach(p => newSet.add(p.id));
                                            else allProcsInL1.forEach(p => newSet.delete(p.id));
                                            setSelectedBankProcs(newSet);
                                        }}
                                        />
                                        <span 
                                        className="text-xs font-bold text-slate-800 uppercase truncate cursor-pointer select-none" 
                                        onClick={() => {
                                            setExpandedKeys(prev => {
                                                const next = new Set(prev);
                                                if(next.has(k1)) next.delete(k1);
                                                else next.add(k1);
                                                return next;
                                            });
                                        }}
                                        >{k1}</span>
                                        <span className="text-[10px] bg-slate-300 text-slate-600 px-1.5 rounded-full">{allProcsInL1.length}</span>
                                </div>

                                {isL1Expanded && (
                                    <div className="pl-2 border-l-2 border-slate-200/50 ml-2 mt-1 space-y-1">
                                        {l2Keys.map(k2 => {
                                            const l3Obj = l2Obj[k2];
                                            const l3Keys = Object.keys(l3Obj).sort((a, b) => {
                                                const codeA = getMinCode(l3Obj[a]);
                                                const codeB = getMinCode(l3Obj[b]);
                                                return codeA.localeCompare(codeB, undefined, { numeric: true });
                                            });

                                            const uniqueK2 = `${k1}||${k2}`;
                                            const allProcsInL2 = getAllProcsInL2(l3Obj);
                                            const isL2Expanded = expandedKeys.has(uniqueK2);
                                            const isL2Selected = allProcsInL2.every(p => selectedBankProcs.has(p.id));
                                            const isL2Partial = !isL2Selected && allProcsInL2.some(p => selectedBankProcs.has(p.id));
                                            
                                            return (
                                                <div key={uniqueK2}>
                                                    <div 
                                                        draggable
                                                        onDragStart={(e) => handleGroupDragStart(e, allProcsInL2.map(p => p.id))}
                                                        className="flex items-center gap-2 py-1 px-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing hover:shadow-sm"
                                                    >
                                                        <button 
                                                            onClick={() => {
                                                                setExpandedKeys(prev => {
                                                                    const next = new Set(prev);
                                                                    if(next.has(uniqueK2)) next.delete(uniqueK2);
                                                                    else next.add(uniqueK2);
                                                                    return next;
                                                                });
                                                            }}
                                                            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                                        >
                                                            {isL2Expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                        <input 
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                                                            checked={isL2Selected}
                                                            ref={el => { if(el) el.indeterminate = isL2Partial; }}
                                                            onChange={(e) => {
                                                                const newSet = new Set(selectedBankProcs);
                                                                if(e.target.checked) allProcsInL2.forEach(p => newSet.add(p.id));
                                                                else allProcsInL2.forEach(p => newSet.delete(p.id));
                                                                setSelectedBankProcs(newSet);
                                                            }}
                                                        />
                                                        <span className="text-xs font-semibold text-slate-700 truncate cursor-pointer select-none flex-1" 
                                                            onClick={() => {
                                                                setExpandedKeys(prev => {
                                                                    const next = new Set(prev);
                                                                    if(next.has(uniqueK2)) next.delete(uniqueK2);
                                                                    else next.add(uniqueK2);
                                                                    return next;
                                                                });
                                                            }}
                                                        >{k2}</span>
                                                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{allProcsInL2.length}</span>
                                                    </div>

                                                    {isL2Expanded && (
                                                        <div className="pl-4 space-y-1 mt-1 mb-2">
                                                            {l3Keys.map(k3 => {
                                                                const procs = l3Obj[k3].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
                                                                const uniqueK3 = `${k1}||${k2}||${k3}`;
                                                                const isL3Expanded = expandedKeys.has(uniqueK3);
                                                                const isL3Selected = procs.every(p => selectedBankProcs.has(p.id));
                                                                const isL3Partial = !isL3Selected && procs.some(p => selectedBankProcs.has(p.id));

                                                                return (
                                                                    <div key={uniqueK3} className="border-l border-slate-200/60 pl-2">
                                                                         <div 
                                                                            draggable
                                                                            onDragStart={(e) => handleGroupDragStart(e, procs.map(p => p.id))}
                                                                            className="flex items-center gap-2 py-0.5 px-1 hover:bg-slate-50 rounded cursor-grab active:cursor-grabbing hover:shadow-sm"
                                                                         >
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setExpandedKeys(prev => {
                                                                                        const next = new Set(prev);
                                                                                        if(next.has(uniqueK3)) next.delete(uniqueK3);
                                                                                        else next.add(uniqueK3);
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 transition-colors"
                                                                            >
                                                                                {isL3Expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                            </button>
                                                                            <input 
                                                                                type="checkbox"
                                                                                className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3 h-3 cursor-pointer"
                                                                                checked={isL3Selected}
                                                                                ref={el => { if(el) el.indeterminate = isL3Partial; }}
                                                                                onChange={(e) => {
                                                                                    const newSet = new Set(selectedBankProcs);
                                                                                    if(e.target.checked) procs.forEach(p => newSet.add(p.id));
                                                                                    else procs.forEach(p => newSet.delete(p.id));
                                                                                    setSelectedBankProcs(newSet);
                                                                                }}
                                                                            />
                                                                            <span className="text-[11px] font-medium text-slate-600 truncate cursor-pointer select-none flex-1" 
                                                                                onClick={() => {
                                                                                    setExpandedKeys(prev => {
                                                                                        const next = new Set(prev);
                                                                                        if(next.has(uniqueK3)) next.delete(uniqueK3);
                                                                                        else next.add(uniqueK3);
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                            >{k3}</span>
                                                                            <span className="text-[9px] text-slate-300 bg-slate-50 px-1 rounded">{procs.length}</span>
                                                                        </div>

                                                                        {isL3Expanded && (
                                                                            <div className="pl-5 space-y-2 mt-1 mb-1">
                                                                                {procs.map(proc => (
                                                                                    <div 
                                                                                        key={proc.id}
                                                                                        draggable
                                                                                        onDragStart={(e) => {
                                                                                            setTimeout(() => setShowBankModal(false), 50);
                                                                                            handleDragStart(e, proc.id, 'bank');
                                                                                        }}
                                                                                        className={`bg-white p-2.5 rounded-lg border shadow-sm transition-all group flex gap-3 items-start ${selectedBankProcs.has(proc.id) ? 'border-red-500 ring-1 ring-red-500 bg-red-50/30' : 'border-slate-200 hover:border-red-300'} ${proc.isActive === false ? 'opacity-60 bg-slate-50' : ''}`}
                                                                                    >
                                                                                        <input 
                                                                                            type="checkbox" 
                                                                                            className="mt-1 rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                                                                                            checked={selectedBankProcs.has(proc.id)}
                                                                                            onChange={() => {
                                                                                                setSelectedBankProcs(prev => {
                                                                                                    const next = new Set(prev);
                                                                                                    if(next.has(proc.id)) next.delete(proc.id);
                                                                                                    else next.add(proc.id);
                                                                                                    return next;
                                                                                                });
                                                                                            }}
                                                                                        />
                                                                                        <div className="flex-1 cursor-grab active:cursor-grabbing min-w-0">
                                                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                                <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-bold px-1 py-0.5 rounded">{proc.code}</span>
                                                                                                {(proc.tahapan === 'Interim') && (
                                                                                                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1 py-0.5 rounded border border-blue-200">INTERIM</span>
                                                                                                )}
                                                                                                {proc.isActive === false && (
                                                                                                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-1 py-0.5 rounded border border-slate-300 flex items-center gap-0.5"><Power size={8}/> OFF</span>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-xs text-slate-700 line-clamp-3 leading-snug">{proc.name}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
                
                {unassignedFiltered.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                        {unassigned.length === 0 ? (
                            <div className="flex flex-col items-center">
                                <span>Semua prosedur telah dibagikan!</span>
                                <CheckCircle2 className="w-8 h-8 mx-auto mt-2 text-green-300" />
                                <span className="mt-2 not-italic text-slate-500">Gunakan drag & drop pada kartu pemeriksa untuk memindahkan tugas.</span>
                            </div>
                        ) : (
                            "Tidak ada prosedur yang sesuai pencarian."
                        )}
                    </div>
                )}
            </div>
        </div>
    );



    // --- MAIN APP ---
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in relative">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800">Workspace Distribusi Prosedur</h2>
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
                <div className="flex gap-2 items-center">
                    {currentUser && (
                        <>
                            <div className="bg-gradient-to-br from-red-600 to-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4" />
                                <div>
                                    <p className="font-semibold">{currentUser.nama}</p>
                                    <p className="text-xs text-red-100">{currentUser.nip}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <Button variant="outline" onClick={() => backupInputRef.current.click()}><FolderOpen className="w-4 h-4"/> Buka Proyek</Button>
                    <input type="file" ref={backupInputRef} onChange={handleLoadBackup} className="hidden" accept=".pkp,.json" />
                    <Button variant="outline" onClick={performBackup}><Save className="w-4 h-4 text-blue-600"/> Simpan Proyek</Button>
                    <Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4"/> Cetak PKP</Button>
                </div>
            </div>

            {/* Statistics Section / Empty State */}
            {examiners.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl m-4 mt-0 animate-in fade-in">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <AlertTriangle className="w-16 h-16 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Terdapat Proyek Aktif</h3>
                    <p className="text-slate-500 text-center max-w-md mb-6">
                        Silakan konfigurasi pemeriksa dan prosedur pemeriksaan terlebih dahulu.
                    </p>
                    <div className="flex gap-3">
                         <Button onClick={() => setActiveMenu('config_examiners')}>
                             <Settings className="w-4 h-4" /> Tambah Pemeriksa
                         </Button>
                         <Button onClick={() => setActiveMenu('config_procedures')}>
                             <Settings className="w-4 h-4" /> Kelola Prosedur
                         </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 shrink-0">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden lg:col-span-4">
                         <div className="flex justify-between items-start mb-3">
                             <h3 className="text-slate-700 font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500"/> Status Prosedur</h3>
                             <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded textxs font-bold">{procedures.length} Total</div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="bg-green-50 border border-green-100 p-2 rounded-lg text-center">
                                 <div className="text-2xl font-bold text-green-700">{countActive}</div>
                                 <div className="text-[10px] uppercase font-bold text-green-600">Prosedur Aktif</div>
                             </div>
                             <div className="space-y-1">
                                 <div className="bg-blue-50 border border-blue-100 px-2 py-1.5 rounded flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-blue-700">INTERIM</span>
                                     <span className="text-sm font-bold text-blue-900">{interimProcsLength}</span>
                                 </div>
                                 <div className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-slate-600">TERINCI</span>
                                     <span className="text-sm font-bold text-slate-800">{terinciProcsLength}</span>
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm lg:col-span-3">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-slate-700 font-bold flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> Jumlah Pemeriksa</h3>
                            <div className="bg-red-50 text-red-900 px-2 py-0.5 rounded textxs font-bold">{examiners.length} Orang</div>
                        </div>
                        <div className="flex flex-wrap gap-2 content-start min-h-[60px]">
                            {EXAMINER_ROLES.map(r => {
                                const count = examiners.filter(e => e.role === r.key).length;
                                if (count === 0) return null;
                                return (
                                    <div key={r.key} className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${r.color}`}>
                                        <span>{r.label}</span>
                                        <span className="bg-white/50 px-1.5 rounded-sm">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-5">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-red-800" /> Beban Kerja Anggota Tim/Dukungan Pemeriksaan
                        </h3>
                        {/* Increased height to show ~5 items */}
                        <div className="space-y-2 h-[100px] overflow-y-auto pr-1">
                            {(() => {
                                const totalProc = procedures.length;
                                const workload = examiners.filter(ex => ex.role !== 'KST' && ex.role !== 'KT').map(ex => ({
                                    name: ex.name,
                                    count: assignments[ex.id] ? assignments[ex.id].length : 0
                                })).sort((a,b) => b.count - a.count);
                                
                                return workload.length > 0 ? workload.map((w, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="font-medium text-slate-700 truncate w-32" title={w.name}>{w.name}</span>
                                            <span className="text-slate-500 font-mono ml-2">{w.count}</span>
                                        </div>

                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div 
                                                className="bg-red-700 h-1.5 rounded-full" 
                                                style={{ width: `${totalProc > 0 ? (w.count / totalProc * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-400 italic text-xs">Belum ada data tim.</p>;
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Workspace Area (Only show if examiners exist) */}
            {examiners.filter(ex => ex.role !== 'KST' && ex.role !== 'KT').length > 0 && (
            <div className="flex-1 flex gap-4 overflow-hidden relative">
                
                {/* Right: Examiners Cards (Full Width) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {examiners.filter(ex => ex.role !== 'KST' && ex.role !== 'KT').map(ex => {
                            const myProcs = assignments[ex.id] || [];
                            return (
                                <div 
                                    key={ex.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]"
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, ex.id); }}
                                >
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white rounded-t-xl sticky top-0 z-10">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                            {ex.nip ? (
                                                <img 
                                                    src={`https://sisdm.bpk.go.id/photo/${ex.nip}/md.jpg`} 
                                                    alt={ex.initials}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <div className="w-full h-full bg-red-50 text-red-900 flex items-center justify-center font-bold text-sm" style={{ display: ex.nip ? 'none' : 'flex' }}>
                                                {ex.initials}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate">{ex.name}</h4>
                                            <div className="flex items-center gap-2 text-xs">
                                                {ex.kstId && (
                                                    <span className="text-slate-400 bg-slate-50 px-1 rounded border border-slate-200" title="Ketua Subtim">
                                                        KST: {getInitials(examiners.find(k => k.id === ex.kstId)?.name || '?')}
                                                    </span>
                                                )}
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500">{myProcs.length} Prosedur</span>
                                            </div>
                                        </div>
                                        {myProcs.length > 0 && (
                                            <button 
                                                onClick={() => {
                                                    setConfirmState({
                                                        isOpen: true,
                                                        title: "Bersihkan Prosedur?",
                                                        message: `Kembalikan ${myProcs.length} prosedur dari ${ex.name} ke Bank Prosedur?`,
                                                        confirmText: "Bersihkan",
                                                        confirmType: "danger",
                                                        onConfirm: () => {
                                                            setAssignments(prev => {
                                                                const next = { ...prev };
                                                                next[ex.id] = []; 
                                                                return next;
                                                            });
                                                        }
                                                    });
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Bersihkan Prosedur"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Drop Zone List */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
                                        {myProcs.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-lg">
                                                <ArrowDownAZ className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-xs font-medium">Drop prosedur disini</span>
                                            </div>
                                        ) : (
                                            (() => {
                                                const assignedProcs = procedures.filter(p => myProcs.includes(p.id));
                                                
                                                // Grouping Logic
                                                const hierarchy = {};
                                                assignedProcs.forEach(proc => {
                                                    const l1 = proc.nama_akun_1 || 'Lainnya';
                                                    const l2 = proc.nama_akun_2 || 'Lainnya';
                                                    const l3 = proc.nama_akun_3 || 'Rincian Prosedur';
                                                    
                                                    if(!hierarchy[l1]) hierarchy[l1] = {};
                                                    if(!hierarchy[l1][l2]) hierarchy[l1][l2] = {};
                                                    if(!hierarchy[l1][l2][l3]) hierarchy[l1][l2][l3] = [];
                                                    
                                                    hierarchy[l1][l2][l3].push(proc);
                                                });
                                                
                                                const getMinCode = (procs) => {
                                                    if (!procs || procs.length === 0) return '';
                                                    return procs.reduce((min, p) => {
                                                        if (!min) return p.code;
                                                        return p.code.localeCompare(min, undefined, { numeric: true }) < 0 ? p.code : min;
                                                    }, null);
                                                };

                                                 const getAllProcsInL1 = (l2Obj) => {
                                                     return Object.values(l2Obj).flatMap(l3Obj => Object.values(l3Obj).flat());
                                                };
                                                 const getAllProcsInL2 = (l3Obj) => {
                                                     return Object.values(l3Obj).flat();
                                                };

                                                const l1Keys = Object.keys(hierarchy).sort((a, b) => {
                                                    const procsA = getAllProcsInL1(hierarchy[a]);
                                                    const codeA = getMinCode(procsA);
                                                    const procsB = getAllProcsInL1(hierarchy[b]);
                                                    const codeB = getMinCode(procsB);
                                                    return codeA.localeCompare(codeB, undefined, { numeric: true });
                                                });
                                                
                                                return l1Keys.map(k1 => {
                                                    const l2Obj = hierarchy[k1];
                                                    const l2Keys = Object.keys(l2Obj).sort((a, b) => {
                                                         const procsA = getAllProcsInL2(l2Obj[a]);
                                                         const procsB = getAllProcsInL2(l2Obj[b]);
                                                         const codeA = getMinCode(procsA);
                                                         const codeB = getMinCode(procsB);
                                                         return codeA.localeCompare(codeB, undefined, { numeric: true });
                                                    });
                                                    
                                                    const uniqueK1 = `${ex.id}||${k1}`;
                                                    const isL1Expanded = examinerExpandedKeys.has(uniqueK1);
                                                    const allProcsInL1 = getAllProcsInL1(l2Obj);
                                                    
                                                    const isL1Selected = allProcsInL1.every(p => selectedExaminerProcs.has(p.id));
                                                    const isL1Partial = !isL1Selected && allProcsInL1.some(p => selectedExaminerProcs.has(p.id));

                                                    return (
                                                        <div 
                                                            key={uniqueK1} 
                                                            className="mb-2 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"
                                                            draggable
                                                            onDragStart={(e) => handleGroupDragStart(e, allProcsInL1.map(p => p.id), ex.id)}
                                                        >
                                                            <div 
                                                                className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 cursor-pointer select-none transition-colors border-b border-slate-200"
                                                                onClick={(e) => {
                                                                    // Prevent collapse when clicking checkbox (handled by stopping propagation on checkbox)
                                                                    setExaminerExpandedKeys(prev => {
                                                                        const next = new Set(prev);
                                                                        if(next.has(uniqueK1)) next.delete(uniqueK1);
                                                                        else next.add(uniqueK1);
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                <input 
                                                                    type="checkbox"
                                                                    className="rounded border-slate-400 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                                                                    checked={isL1Selected}
                                                                    ref={el => { if(el) el.indeterminate = isL1Partial; }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setSelectedExaminerProcs(prev => {
                                                                            const next = new Set(prev);
                                                                            allProcsInL1.forEach(p => {
                                                                                if(checked) next.add(p.id);
                                                                                else next.delete(p.id);
                                                                            });
                                                                            return next;
                                                                        });
                                                                    }}
                                                                />
                                                                {isL1Expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                                                                <span className="text-xs font-bold text-slate-800 uppercase truncate flex-1">{k1}</span>
                                                                <span className="text-[10px] bg-white border border-slate-300 text-slate-600 px-1.5 rounded-full">{allProcsInL1.length}</span>
                                                            </div>
                                                            
                                                            {isL1Expanded && (
                                                                <div className="p-2 space-y-2">
                                                                    {l2Keys.map(k2 => {
                                                                        const l3Obj = l2Obj[k2];
                                                                        const uniqueK2 = `${ex.id}||${k1}||${k2}`;
                                                                        const isL2Expanded = examinerExpandedKeys.has(uniqueK2);
                                                                         const allProcsInL2 = getAllProcsInL2(l3Obj);
                                                                         
                                                                         const isL2Selected = allProcsInL2.every(p => selectedExaminerProcs.has(p.id));
                                                                         const isL2Partial = !isL2Selected && allProcsInL2.some(p => selectedExaminerProcs.has(p.id));
                                                                        
                                                                         return (
                                                                            <div 
                                                                                key={uniqueK2} 
                                                                                className="border-l-2 border-slate-200 pl-2 ml-1"
                                                                                draggable
                                                                                onDragStart={(e) => { e.stopPropagation(); handleGroupDragStart(e, allProcsInL2.map(p => p.id), ex.id); }}
                                                                            >
                                                                                <div 
                                                                                    className="flex items-center gap-2 py-1 hover:bg-slate-50 rounded px-1 cursor-pointer select-none"
                                                                                    onClick={(e) => {
                                                                                        setExaminerExpandedKeys(prev => {
                                                                                            const next = new Set(prev);
                                                                                            if(next.has(uniqueK2)) next.delete(uniqueK2);
                                                                                            else next.add(uniqueK2);
                                                                                            return next;
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                     <input 
                                                                                        type="checkbox"
                                                                                        className="rounded border-slate-400 text-red-600 focus:ring-red-500 w-3 h-3 cursor-pointer"
                                                                                        checked={isL2Selected}
                                                                                        ref={el => { if(el) el.indeterminate = isL2Partial; }}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        onChange={(e) => {
                                                                                            const checked = e.target.checked;
                                                                                            setSelectedExaminerProcs(prev => {
                                                                                                const next = new Set(prev);
                                                                                                allProcsInL2.forEach(p => {
                                                                                                    if(checked) next.add(p.id);
                                                                                                    else next.delete(p.id);
                                                                                                });
                                                                                                return next;
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                     {isL2Expanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                                                                                     <span className="text-[11px] font-semibold text-slate-700 flex-1 truncate">{k2}</span>
                                                                                     <span className="text-[9px] text-slate-400">{allProcsInL2.length}</span>
                                                                                </div>
                                                                                
                                                                                {isL2Expanded && (
                                                                                     <div className="space-y-1 mt-1">
                                                                                         {Object.keys(l3Obj).sort().map(k3 => {
                                                                                             const procs = l3Obj[k3].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
                                                                                             const uniqueK3 = `${ex.id}||${k1}||${k2}||${k3}`;
                                                                                             const isL3Expanded = examinerExpandedKeys.has(uniqueK3);
                                                                                             
                                                                                             return (
                                                                                                 <div 
                                                                                                     key={uniqueK3} 
                                                                                                     className="ml-2 pl-2 border-l border-slate-200/50"
                                                                                                     draggable
                                                                                                     onDragStart={(e) => { e.stopPropagation(); handleGroupDragStart(e, procs.map(p => p.id), ex.id); }}
                                                                                                 >
                                                                                                     <div 
                                                                                                        className="flex items-center gap-1.5 py-0.5 hover:bg-slate-50 cursor-pointer select-none px-1 rounded"
                                                                                                        onClick={() => {
                                                                                                            setExaminerExpandedKeys(prev => {
                                                                                                                const next = new Set(prev);
                                                                                                                if(next.has(uniqueK3)) next.delete(uniqueK3);
                                                                                                                else next.add(uniqueK3);
                                                                                                                return next;
                                                                                                            });
                                                                                                        }}
                                                                                                     >
                                                                                                          {isL3Expanded ? <ChevronDown size={10} className="text-slate-300" /> : <ChevronRight size={10} className="text-slate-300" />}
                                                                                                          <span className="text-[10px] font-medium text-slate-600 flex-1 truncate">{k3}</span>
                                                                                                          <span className="text-[8px] text-slate-400 bg-slate-100 px-1 rounded">{procs.length}</span>
                                                                                                     </div>
                                                                                                     
                                                                                                     {isL3Expanded && (
                                                                                                         <div className="space-y-1.5 mt-1">
                                                                                                            {procs.map(proc => (
                                                                                                                <div 
                                                                                                                    key={proc.id}
                                                                                                                    draggable
                                                                                                                    onDragStart={(e) => handleDragStart(e, proc.id, ex.id)}
                                                                                                                    className={`bg-white p-2.5 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-red-400 transition-all flex gap-2 group relative ${
                                                                                                                        selectedExaminerProcs.has(proc.id) ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                                                                                                    }`}
                                                                                                                    onClick={() => {
                                                                                                                        // Optional: select on click if not dragging? 
                                                                                                                        // Just toggle selection on click for better UX
                                                                                                                        /* setSelectedExaminerProcs(prev => {
                                                                                                                            const next = new Set(prev);
                                                                                                                            if(next.has(proc.id)) next.delete(proc.id);
                                                                                                                            else next.add(proc.id);
                                                                                                                            return next;
                                                                                                                        }); */
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <div className="flex items-start pt-0.5">
                                                                                                                        <input 
                                                                                                                            type="checkbox"
                                                                                                                            className="rounded border-slate-400 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer mt-0.5"
                                                                                                                            checked={selectedExaminerProcs.has(proc.id)}
                                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                                            onChange={(e) => {
                                                                                                                                const checked = e.target.checked;
                                                                                                                                setSelectedExaminerProcs(prev => {
                                                                                                                                    const next = new Set(prev);
                                                                                                                                    if(checked) next.add(proc.id);
                                                                                                                                    else next.delete(proc.id);
                                                                                                                                    return next;
                                                                                                                                });
                                                                                                                            }}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                    <div className="flex-1 min-w-0">
                                                                                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                                                                                            <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{proc.code}</span>
                                                                                                                            {proc.tahapan === 'Interim' && (
                                                                                                                                 <span className="bg-blue-50 text-blue-600 text-[9px] px-1 py-0.5 rounded border border-blue-100">Interim</span>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        <p className="text-[11px] text-slate-700 leading-snug">{proc.name}</p>
                                                                                                                    </div>
                                                                                                                    <button 
                                                                                                                        onClick={() => {
                                                                                                                            setAssignments(prev => {
                                                                                                                                const next = {...prev};
                                                                                                                                next[ex.id] = next[ex.id].filter(id => id !== proc.id);
                                                                                                                                return next;
                                                                                                                            });
                                                                                                                        }}
                                                                                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"
                                                                                                                    >
                                                                                                                        <X className="w-3 h-3 text-red-500" />
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                         </div>
                                                                                                     )}
                                                                                                 </div>
                                                                                             )
                                                                                         })}
                                                                                     </div>
                                                                                )}
                                                                            </div>
                                                                         )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            })()
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          )}

                {/* Floating Action Button (Bank Prosedur) - Fixed Position to ensure visibility */}
                {!showBankModal && (
                    <button
                        onClick={() => setShowBankModal(true)}
                        className="fixed bottom-8 right-8 z-[100] h-14 w-14 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all text-white rounded-full shadow-2xl shadow-slate-900/50 flex items-center justify-center group border border-slate-700"
                        title="Buka Bank Prosedur"
                    >
                        <Briefcase className="w-6 h-6" />
                        {unassigned.length > 0 ? (
                            <span className="absolute -top-1 -right-1 bg-red-600 border-2 border-white text-white text-[10px] font-bold h-6 min-w-[1.5rem] px-1 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in">
                                {unassigned.length}
                            </span>
                        ) : (
                             <span className="absolute -top-1 -right-1 bg-emerald-500 border-2 border-white text-white h-6 w-6 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in">
                                <Check size={12} strokeWidth={3} />
                            </span>
                        )}
                    </button>
                )}

                {/* Bank Prosedur Popover Modal - Fixed Position */}
                {showBankModal && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-[2px] transition-all"
                            onClick={() => setShowBankModal(false)}
                        ></div>
                        
                        {/* Popover Content */}
                        <div className="fixed top-4 bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1600px] z-[100] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 fade-in duration-300 flex flex-col bg-slate-50 ring-1 ring-slate-900/5">
                            {/* Close Button Overlay */}
                            <div className="absolute top-3 right-3 z-50">
                                <button 
                                    onClick={() => setShowBankModal(false)}
                                    className="bg-white hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-full p-1.5 shadow-sm border border-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Render Content */}
                            {renderBankContent()}
                        </div>
                    </>
                )}

        </div>
    );
  };

  const renderSidebar = () => {
    // Hide sidebar jika belum login
    if (!isLoggedIn) {
      return null;
    }
    
    return (
    <div className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 h-screen sticky top-0 print:hidden`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="shrink-0 focus:outline-none transition-transform active:scale-95"
                >
                    <img 
                        src="/icon.png" 
                        alt="Toggle Sidebar" 
                        className="w-8 h-8 rounded-lg shadow-lg shadow-red-900/40 object-cover"
                    />
                </button>
                {sidebarOpen && (
                    <div className="animate-in fade-in duration-300">
                        <h1 className="font-bold text-white tracking-tight leading-none">{APP_NAME}</h1>
                        <p className="text-[10px] text-slate-500 leading-none mt-1">{APP_SUBTITLE}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            <div className={`mb-2 px-3 text-xs font-bold text-slate-600 uppercase tracking-wider ${!sidebarOpen && 'hidden'}`}>
                Manajemen
            </div>
            <MenuButton 
                active={activeMenu === 'distribution'} 
                onClick={() => setActiveMenu('distribution')} 
                icon={<Briefcase size={20} />} 
                label="Distribusi Prosedur" 
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
        </div>

        {/* Sidebar Footer */}
        {sidebarOpen && (
            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center justify-center gap-4 mb-4 px-2">
                     <img src="/BPK.png" alt="BPK" className="h-16 w-auto object-contain" />
                     <img src="/SINER6I.png" alt="SINER6I" className="h-16 w-auto object-contain" />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400">PKP APP v1.0</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">© 2026 - Tim DAC BPK Bali</p>
                </div>
            </div>
        )}
    </div>
    );
  };

    // --- LOGIN PAGE ---
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {/* Login Card */}
            <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Logo / Header */}
              <div className="text-center mb-6">
                <img 
                  src="/icon.png" 
                  alt="PKP App Logo" 
                  className="w-16 h-16 mx-auto mb-4 rounded-lg shadow-lg"
                />
                <h1 className="text-3xl font-bold text-white mb-1">PKP App</h1>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Masuk</h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* NIP Input */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">NIP BPK</label>
                  <input
                    type="text"
                    placeholder="Input NIP 9 digit"
                    value={loginNip}
                    onChange={(e) => setLoginNip(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-red-300 rounded-lg focus:border-white focus:ring-2 focus:ring-red-200 transition-all outline-none text-slate-900"
                    disabled={loginLoading}
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email BPK</label>
                  <div className="flex items-center w-full px-4 py-2.5 border-2 border-red-300 rounded-lg bg-white focus-within:border-white focus-within:ring-2 focus-within:ring-red-200 transition-all">
                      <input
                        type="text"
                        placeholder="Input email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 min-w-0"
                        disabled={loginLoading}
                      />
                      <span className="text-slate-500 font-medium ml-1 select-none">@bpk.go.id</span>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-white text-red-800 font-semibold py-2.5 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Memvalidasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Masuk
                    </>
                  )}
                </button>
              </form>

              {/* Info Section */}
              <div className="bg-white/20 border border-red-200 p-3 rounded text-center">
                <p className="text-xs text-red-50">
                  Data Anda akan divalidasi dari daftar karyawan BPK
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-6">
              <p>© 2026 Tim DAC BPK Bali</p>
            </div>
          </div>
        </div>
      );
    }

  return (
    <>
      {/* CSS for Print */}
      <style>{`
        @media print {
            .print-hidden { display: none !important; }
            @page { size: A4; margin: 1cm; }
        }
      `}</style>

      {/* Debug Info: Removed */}

      {/* Main Container */}
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white print:block">
          
          {/* Main Content (Hidden on Print) */}
          <div className="flex flex-1 print:hidden">
            {renderSidebar()}
            
            <main className="flex-1 p-8 overflow-hidden">
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
                      {/* Searchable Name Dropdown */}
                      <div className="mb-3 relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                        <div className="relative">
                            <input 
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                name="name"
                                required 
                                placeholder="Cari Nama Pegawai..." 
                                value={examinerNameSearch}
                                onChange={(e) => {
                                    setExaminerNameSearch(e.target.value);
                                    setIsExaminerDropdownOpen(true);
                                }}
                                onFocus={() => setIsExaminerDropdownOpen(true)}
                                autoComplete="off"
                            />
                            {isExaminerDropdownOpen && examinerNameSearch && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {userList.filter(u => u.nama.toLowerCase().includes(examinerNameSearch.toLowerCase())).map((u, idx) => (
                                        <div 
                                            key={idx}
                                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                                            onClick={() => {
                                                setExaminerNameSearch(u.nama);
                                                setExaminerNipValue(u.nip);
                                                setIsExaminerDropdownOpen(false);
                                            }}
                                        >
                                            <div className="font-semibold text-slate-800">{u.nama}</div>
                                            <div className="text-xs text-slate-500">{u.nip}</div>
                                        </div>
                                    ))}
                                    {userList.filter(u => u.nama.toLowerCase().includes(examinerNameSearch.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-2 text-sm text-slate-400">Tidak ditemukan</div>
                                    )}
                                </div>
                            )}
                        </div>
                      </div>

                      {/* Read-only NIP */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">NIP BPK</label>
                        <input
                          className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-red-50 text-slate-600 focus:outline-none cursor-not-allowed"
                          name="nip"
                          value={examinerNipValue}
                          readOnly
                          required
                          placeholder="Otomatis terisi..."
                          title="NIP terisi otomatis berdasarkan nama yang dipilih"
                        />
                      </div>
                      
                      {/* State untuk menghandle perubahan role dr form agar dropdown KST tampil dinamis */}
                      <ExaminerFormFields editingExaminer={editingExaminer} examiners={examiners} />
                      
                      <div className="flex justify-end gap-2 mt-6">
                          <Button type="submit">Simpan</Button>
                          <Button variant="ghost" onClick={() => setShowExaminerModal(false)}>Batal</Button>
                      </div>
                  </form>
              </Modal>

              <Modal isOpen={showProcedureModal} onClose={() => setShowProcedureModal(false)} title={editingProcedure ? 'Edit Prosedur' : 'Tambah Prosedur Manual'}>
                  <form onSubmit={handleSaveProcedure}>
                      <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Jenis Laporan</label>
                          <select 
                              name="jenis_laporan" 
                              defaultValue={editingProcedure?.jenis_laporan || ''} 
                              className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-800"
                          >
                              <option value="">-- Pilih Jenis Laporan --</option>
                              <option value="LRA">LRA</option>
                              <option value="Neraca">Neraca</option>
                              <option value="LO">LO</option>
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input name="kode_akun_1" label="Kode Akun 1" defaultValue={editingProcedure?.kode_akun_1} placeholder="Contoh: 1000" />
                          <Input name="nama_akun_1" label="Nama Akun 1" defaultValue={editingProcedure?.nama_akun_1} placeholder="Contoh: Kas" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input name="kode_akun_2" label="Kode Akun 2" defaultValue={editingProcedure?.kode_akun_2} placeholder="Contoh: 2000" />
                          <Input name="nama_akun_2" label="Nama Akun 2" defaultValue={editingProcedure?.nama_akun_2} placeholder="Contoh: Hutang" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input name="kode_akun_3" label="Kode Akun 3" defaultValue={editingProcedure?.kode_akun_3} placeholder="Contoh: 3000" />
                          <Input name="nama_akun_3" label="Nama Akun 3" defaultValue={editingProcedure?.nama_akun_3} placeholder="Contoh: Modal" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <Input name="code" label="Kode Prosedur" defaultValue={editingProcedure?.code} required placeholder="Contoh: KAS-01" />
                          <Input name="level" label="Level" defaultValue={editingProcedure?.level} placeholder="Contoh: 1" />
                      </div>

                      <TextArea name="name" label="Uraian Prosedur" defaultValue={editingProcedure?.name} required placeholder="Deskripsi lengkap prosedur pemeriksaan..." />
                      
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Header</label>
                        <select name="isheader" defaultValue={editingProcedure?.isheader || '0'} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-800">
                            <option value="0">Tidak</option>
                            <option value="1">Ya</option>
                        </select>
                      </div>

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
                  confirmText={confirmState.confirmText}
                  confirmType={confirmState.confirmType}
              />
              
              <AlertModal
                  isOpen={alertState.isOpen}
                  onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                  title={alertState.title}
                  message={alertState.message}
                  type={alertState.type}
              />
              
              <Modal isOpen={showCloudModal} onClose={() => setShowCloudModal(false)} title="Sinkronisasi Cloud Prosedur">
                  <div className="space-y-4">
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100 flex gap-3">
                          <Info className="w-5 h-5 shrink-0" />
                          <div>
                              <p className="font-bold">Perhatian</p>
                              <p>Sinkronisasi akan <u>menimpa seluruh data prosedur</u> yang ada saat ini. Penugasan prosedur (jika ada) akan di-reset.</p>
                          </div>
                      </div>
                      <Input 
                        label="Link Google Sheet CSV (Publik)" 
                        value={cloudUrl} 
                        onChange={(e) => setCloudUrl(e.target.value)} 
                        placeholder="https://docs.google.com/..." 
                      />
                      <div className="flex justify-end gap-2 mt-4">
                          <Button onClick={handleSyncProcedures} disabled={syncLoading}>
                              {syncLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                              {syncLoading ? 'Sedang Sinkronisasi...' : 'Mulai Sinkronisasi'}
                          </Button>
                          <Button variant="ghost" onClick={() => setShowCloudModal(false)} disabled={syncLoading}>Batal</Button>
                      </div>
                  </div>
              </Modal>
              
              <Modal isOpen={showPrintTahapanModal} onClose={() => setShowPrintTahapanModal(false)} title="Pilih Tahapan PKP">
                  <div className="space-y-4">
                      <p className="text-sm text-slate-600">Pilih tahapan pemeriksaan untuk dicetak:</p>
                      <div className="flex gap-3">
                          <Button onClick={() => handlePrintPKP('Interim')} className="flex-1">
                              <FileText className="w-4 h-4" /> Interim
                          </Button>
                          <Button onClick={() => handlePrintPKP('Terinci')} className="flex-1">
                              <FileText className="w-4 h-4" /> Terinci
                          </Button>
                      </div>
                      <div className="flex justify-end mt-4">
                          <Button variant="ghost" onClick={() => setShowPrintTahapanModal(false)}>Batal</Button>
                      </div>
                  </div>
              </Modal>
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