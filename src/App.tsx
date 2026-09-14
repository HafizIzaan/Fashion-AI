import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  FolderHeart,
  Sliders,
  User,
  CreditCard,
  Users,
  Check,
  ChevronRight,
  Upload,
  ScanLine,
  Download,
  Share2,
  Filter,
  AlertCircle,
  Loader2,
  Scissors,
  X,
  Info,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

// --- Type Definitions ---
interface ClothingItem {
  id: string;
  name: string;
  category: 'Outerwear' | 'Tops' | 'Dresses' | 'Bottoms' | 'Shoes' | 'Accessories';
  description?: string;
  imageUrl: string;
  source: 'manual' | 'scan';
  createdAt: string;
}

interface GeneratedResult {
  id: string;
  name: string;
  items: string[]; // item IDs
  imageUrl: string;
  creditCost: number;
  isSaved: boolean;
  isShared: boolean;
  createdAt: string;
}

interface Detection {
  id: string;
  category: 'Outerwear' | 'Tops' | 'Dresses' | 'Bottoms' | 'Shoes' | 'Accessories';
  description: string;
  confidence: number;
  imageUrl: string;
  selected: boolean;
}

interface AppData {
  library: ClothingItem[];
  results: GeneratedResult[];
  settings: {
    account: {
      name: string;
      email: string;
      role: 'Admin' | 'Member';
    };
    aiProviders: {
      geminiKey: string;
      activeModel: string;
    };
    credits: {
      balance: number;
      totalUsed: number;
    };
    preferences: {
      autoSave: boolean;
      highContrast: boolean;
    };
    members: {
      id: string;
      name: string;
      role: 'Admin' | 'Member';
      email: string;
    }[];
  };
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'results' | 'settings'>('studio');
  const [settingsSubTab, setSettingsSubTab] = useState<'account' | 'ai' | 'credits' | 'admin'>('account');

  // Application Data State
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modals & Interactive States ---
  // Clothes Library
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<'Outerwear' | 'Tops' | 'Dresses' | 'Bottoms' | 'Shoes' | 'Accessories'>('Tops');
  const [manualDescription, setManualDescription] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);

  // Scan workflow
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanFileBase64, setScanFileBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanDetections, setScanDetections] = useState<Detection[]>([]);
  const [scanStep, setScanStep] = useState<'upload' | 'detections' | 'completed'>('upload');

  // Studio Outfit Builder State
  const [selectedOutfitItems, setSelectedOutfitItems] = useState<{
    Outerwear?: ClothingItem;
    Tops?: ClothingItem;
    Dresses?: ClothingItem;
    Bottoms?: ClothingItem;
    Shoes?: ClothingItem;
    Accessories?: ClothingItem;
  }>({});
  const [isSlotPickerOpen, setIsSlotPickerOpen] = useState<'Outerwear' | 'Tops' | 'Dresses' | 'Bottoms' | 'Shoes' | 'Accessories' | null>(null);
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioTempModelUrl, setStudioTempModelUrl] = useState('');
  const [studioGenerating, setStudioGenerating] = useState(false);
  const [studioGenerationStep, setStudioGenerationStep] = useState(0);
  const [studioGeneratedResult, setStudioGeneratedResult] = useState<GeneratedResult | null>(null);
  const [studioError, setStudioError] = useState<string | null>(null);

  // Results Tab Filter
  const [resultsFilter, setResultsFilter] = useState<'all' | 'saved' | 'shared'>('all');

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to load application data.');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync / update wrapper
  const triggerRefetch = async () => {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
  };

  // --- Handlers ---
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualImageUrl) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/library/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          category: manualCategory,
          description: manualDescription,
          imageUrl: manualImageUrl,
          source: 'manual',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to add clothing item.');
      }

      await triggerRefetch();
      setIsAddManualOpen(false);
      setManualName('');
      setManualDescription('');
      setManualImageUrl('');
      setManualImagePreview(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this garment from your library?')) return;
    try {
      const response = await fetch('/api/library/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete.');
      await triggerRefetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Image Upload Helper for Scan/Manual (Convert file to base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'manual' | 'scan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'manual') {
        setManualImageUrl(base64String);
        setManualImagePreview(base64String);
      } else {
        setScanFileBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScanOutfit = async () => {
    if (!scanFileBase64) return;
    setScanning(true);
    try {
      const response = await fetch('/api/library/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: scanFileBase64 }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Scan failed.');
      }

      const resJson = await response.json();
      setScanDetections(resJson.detections);
      setScanStep('detections');
      await triggerRefetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleToggleDetectionSelect = (id: string) => {
    setScanDetections(prev =>
      prev.map(det => (det.id === id ? { ...det, selected: !det.selected } : det))
    );
  };

  const handleExtractDetections = async () => {
    const selectedItems = scanDetections.filter(d => d.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one detected clothing item.');
      return;
    }

    try {
      const response = await fetch('/api/library/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(d => ({
            name: `${d.category} - ${d.description.split(' ').slice(0, 3).join(' ')}`,
            category: d.category,
            description: d.description,
            imageUrl: d.imageUrl,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Extraction failed.');
      }

      await triggerRefetch();
      setScanStep('completed');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Studio Workflow
  const handleSelectSlotItem = (item: ClothingItem) => {
    const slot = isSlotPickerOpen;
    if (!slot) return;

    // Outfits logic & Validation:
    // Outerwear, Tops, Dresses, Bottoms, Shoes, Accessories.
    // Spec: "Wrong-category items are rejected with a clear explanation."
    if (item.category !== slot) {
      setStudioError(`Incompatible slot: A ${item.category} cannot be assigned to the ${slot} slot.`);
      return;
    }

    // Rules logic:
    // "Dress is a main garment; Dress + Shoes + Accessories is valid. Dress + Top + Bottoms is normally invalid unless layering is explicitly supported."
    const updatedOutfit = { ...selectedOutfitItems, [slot]: item };

    if (slot === 'Dresses') {
      // If adding a dress, warn or remove Tops/Bottoms
      if (updatedOutfit.Tops || updatedOutfit.Bottoms) {
        if (confirm('A Dress is a full main garment. Adding a dress will remove your currently selected Tops and Bottoms.')) {
          delete updatedOutfit.Tops;
          delete updatedOutfit.Bottoms;
        } else {
          setIsSlotPickerOpen(null);
          return;
        }
      }
    } else if (slot === 'Tops' || slot === 'Bottoms') {
      if (updatedOutfit.Dresses) {
        if (confirm('An outfit cannot have a Dress paired with independent Tops/Bottoms. This will remove your currently selected Dress.')) {
          delete updatedOutfit.Dresses;
        } else {
          setIsSlotPickerOpen(null);
          return;
        }
      }
    }

    setSelectedOutfitItems(updatedOutfit);
    setIsSlotPickerOpen(null);
    setStudioError(null);
  };

  const handleGenerateOutfit = async () => {
    const selectedItemIds = Object.values(selectedOutfitItems).map(item => item!.id);
    if (selectedItemIds.length === 0) {
      setStudioError('Please select at least one garment to build an outfit.');
      return;
    }

    setStudioGenerating(true);
    setStudioGeneratedResult(null);
    setStudioError(null);
    setStudioGenerationStep(0);

    // Simulated beautiful loader steps for premium studio feel
    const steps = [
      'Deconstructing clothing layer profiles...',
      'Synthesizing editorial fabric lighting alignments...',
      'Blending background geometry to monochrome theme...',
      'Finalizing high-fidelity generative render...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1100));
      setStudioGenerationStep(i + 1);
    }

    try {
      const response = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItemIds,
          prompt: studioPrompt,
          tempBaseImage: studioTempModelUrl,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Studio generation failed.');
      }

      const resJson = await response.json();
      setStudioGeneratedResult(resJson.result);
      await triggerRefetch();
    } catch (err: any) {
      setStudioError(err.message || 'Generation failed.');
    } finally {
      setStudioGenerating(false);
    }
  };

  const handleSaveResult = async (id: string) => {
    try {
      const response = await fetch('/api/results/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Save failed.');
      await triggerRefetch();
      if (studioGeneratedResult && studioGeneratedResult.id === id) {
        setStudioGeneratedResult(prev => prev ? { ...prev, isSaved: true } : null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShareResult = async (id: string, isShared: boolean) => {
    try {
      const response = await fetch('/api/results/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isShared }),
      });
      if (!response.ok) throw new Error('Share setting failed.');
      await triggerRefetch();
      if (studioGeneratedResult && studioGeneratedResult.id === id) {
        setStudioGeneratedResult(prev => prev ? { ...prev, isShared } : null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generated outfit result?')) return;
    try {
      const response = await fetch('/api/results/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete result.');
      await triggerRefetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Settings update wrapper
  const handleUpdateSettings = async (updatedFields: any) => {
    if (!data) return;
    const nextSettings = { ...data.settings, ...updatedFields };
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: nextSettings }),
      });
      if (!response.ok) throw new Error('Failed to update settings.');
      await triggerRefetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdminAddCredits = async (amount: number) => {
    try {
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Failed to update credits.');
      await triggerRefetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Sub-render Components & Pages ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF9F6] text-[#222]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111] mb-4" />
        <p className="font-serif text-lg tracking-wide uppercase">Fashion AI Studio</p>
        <p className="text-xs text-neutral-400 mt-1">Initializing editorial canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF9F6] text-[#222] p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="font-serif text-lg text-red-700">Database connection offline</p>
        <p className="text-sm text-neutral-500 mt-2 text-center max-w-md">{error}</p>
        <button
          onClick={fetchData}
          className="mt-6 px-4 py-2 border border-[#111] hover:bg-[#111] hover:text-[#fff] transition-colors text-xs tracking-wider uppercase font-medium"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const appState = data!;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FCFCFB] text-[#1C1C1A]">
      {/* --- DESKTOP SIDEBAR NAVIGATION --- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#F5F4F0] border-r border-[#EBEAE4] p-8 shrink-0">
        <div className="mb-12">
          <h1 className="font-serif text-3xl font-light tracking-tight text-[#1C1C1A]">Fashion AI</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C8A82] mt-2 font-medium">Family Private Workspace</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => { setActiveTab('studio'); setStudioGeneratedResult(null); }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm tracking-wide transition-all ${
              activeTab === 'studio'
                ? 'font-medium bg-[#FFF] text-[#1C1C1A] shadow-[0_2px_4px_rgba(0,0,0,0.02)]'
                : 'text-[#6C6A60] hover:text-[#1C1C1A]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Studio Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm tracking-wide transition-all ${
              activeTab === 'library'
                ? 'font-medium bg-[#FFF] text-[#1C1C1A] shadow-[0_2px_4px_rgba(0,0,0,0.02)]'
                : 'text-[#6C6A60] hover:text-[#1C1C1A]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Clothes Library</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm tracking-wide transition-all ${
              activeTab === 'results'
                ? 'font-medium bg-[#FFF] text-[#1C1C1A] shadow-[0_2px_4px_rgba(0,0,0,0.02)]'
                : 'text-[#6C6A60] hover:text-[#1C1C1A]'
            }`}
          >
            <FolderHeart className="w-4 h-4 shrink-0" />
            <span>Generated Results</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm tracking-wide transition-all ${
              activeTab === 'settings'
                ? 'font-medium bg-[#FFF] text-[#1C1C1A] shadow-[0_2px_4px_rgba(0,0,0,0.02)]'
                : 'text-[#6C6A60] hover:text-[#1C1C1A]'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Settings & Admin</span>
          </button>
        </nav>

        {/* User Card in Sidebar */}
        <div className="mt-auto border-t border-[#EBEAE4] pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1C1C1A] rounded-none flex items-center justify-center text-[#FFF] font-serif text-sm">
              {appState.settings.account.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#1C1C1A] truncate">{appState.settings.account.name}</p>
              <p className="text-[10px] text-[#8C8A82] truncate">{appState.settings.account.email}</p>
            </div>
          </div>
          <div className="bg-[#FFF] border border-[#EBEAE4] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-[#8C8A82]" />
              <span className="text-[10px] uppercase tracking-wider text-[#6C6A60] font-medium">Credits</span>
            </div>
            <span className="text-xs font-bold text-[#1C1C1A]">{appState.settings.credits.balance} CR</span>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP NAVIGATION BAR --- */}
      <header className="md:hidden flex flex-col bg-[#F5F4F0] border-b border-[#EBEAE4] p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl tracking-tight text-[#1C1C1A]">Fashion AI</h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#8C8A82]">Family Library</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#FFF] border border-[#EBEAE4] px-2 py-1 flex items-center gap-1.5 rounded-none">
              <span className="text-[9px] font-bold text-[#1C1C1A]">{appState.settings.credits.balance} CR</span>
            </div>
            <div className="w-8 h-8 bg-[#1C1C1A] text-[#FFF] font-serif flex items-center justify-center text-xs">
              {appState.settings.account.name[0]}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN PAGE WRAPPER --- */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-12 max-w-7xl w-full mx-auto flex-1">
          {/* --- TAB CONTENT: STUDIO BUILDER --- */}
          {activeTab === 'studio' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBEAE4] pb-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-light text-[#1C1C1A]">Studio Outfit Generator</h2>
                  <p className="text-xs md:text-sm text-[#8C8A82] mt-1">Combine library pieces, overlay styles, and render editorial outputs with AI.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Info className="w-4 h-4 text-[#8C8A82]" />
                  <span>Cost per generate: <strong className="text-[#1C1C1A] font-semibold">25 Credits</strong></span>
                </div>
              </div>

              {studioError && (
                <div className="bg-red-50 border-l-2 border-red-500 p-4 text-xs text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Styling Conflict:</span> {studioError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Outfitting Slots (Left Column) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#FBFBF9] border border-[#EBEAE4] p-6 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[#8C8A82] font-semibold border-b border-[#EBEAE4] pb-2">Outfit Canvas Slots</h3>
                    
                    {/* SLOTS LIST */}
                    {(['Outerwear', 'Tops', 'Dresses', 'Bottoms', 'Shoes', 'Accessories'] as const).map(slot => {
                      const selectedItem = selectedOutfitItems[slot];
                      return (
                        <div key={slot} className="flex items-center justify-between gap-4 p-3 border border-dashed border-[#DCDAD2] bg-[#FCFCFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-[#EBEAE4] bg-[#FFF] flex items-center justify-center overflow-hidden">
                              {selectedItem ? (
                                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-[#A3A199] uppercase font-mono">{slot[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-[#8C8A82] font-semibold">{slot}</p>
                              <p className="text-xs text-[#1C1C1A] font-medium truncate max-w-[180px]">
                                {selectedItem ? selectedItem.name : 'Empty Slot'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {selectedItem && (
                              <button
                                onClick={() => {
                                  setSelectedOutfitItems(prev => {
                                    const copy = { ...prev };
                                    delete copy[slot];
                                    return copy;
                                  });
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50"
                                title="Clear slot"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setIsSlotPickerOpen(slot)}
                              className="px-2.5 py-1.5 bg-[#1C1C1A] text-[#FFF] hover:bg-[#3C3A32] text-[10px] font-semibold uppercase tracking-wider"
                            >
                              {selectedItem ? 'Change' : 'Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Temporary Model Upload & Prompt Controls */}
                  <div className="bg-[#FBFBF9] border border-[#EBEAE4] p-6 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[#8C8A82] font-semibold border-b border-[#EBEAE4] pb-2">AI Styling Control</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-[#6C6A60] font-medium block">Creative Direction / Editorial Prompt</label>
                      <textarea
                        value={studioPrompt}
                        onChange={e => setStudioPrompt(e.target.value)}
                        placeholder="e.g. In a minimalist light-grey brutalist studio, soft overhead fashion lighting, highly tailored editorial style..."
                        className="w-full text-xs p-3 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A] h-20 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-[#6C6A60] font-medium block">Base Model Photo URL (Optional)</label>
                      <input
                        type="text"
                        value={studioTempModelUrl}
                        onChange={e => setStudioTempModelUrl(e.target.value)}
                        placeholder="Paste image link of a fashion model to overlay clothes on"
                        className="w-full text-xs p-2.5 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A]"
                      />
                      <p className="text-[10px] text-neutral-400">Allows overlaying outfit elements onto custom posture backdrops dynamically.</p>
                    </div>

                    <button
                      onClick={handleGenerateOutfit}
                      disabled={studioGenerating || Object.keys(selectedOutfitItems).length === 0}
                      className="w-full bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 disabled:bg-neutral-300 py-3 text-xs tracking-widest uppercase font-semibold flex items-center justify-center gap-2"
                    >
                      {studioGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Outfit...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Outfit Visual (25 CR)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview and Generation Area (Right Column) */}
                <div className="lg:col-span-7 bg-[#FAF9F5] border border-[#EBEAE4] p-6 min-h-[450px] flex flex-col justify-between">
                  {studioGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-[#1C1C1A] mb-4" />
                      <p className="font-serif text-lg font-light text-[#1C1C1A]">Synthesizing Fashion Vision</p>
                      
                      {/* Animated Step Tracker */}
                      <div className="mt-6 space-y-2 w-full max-w-xs">
                        {[
                          'Analyzing outfit layering...',
                          'Decompressing garment lighting patterns...',
                          'Blending background environment layers...',
                          'Assembling final high-contrast presentation...'
                        ].map((st, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${studioGenerationStep > sIdx ? 'bg-green-600' : studioGenerationStep === sIdx ? 'bg-[#1C1C1A] animate-pulse' : 'bg-[#DCDAD2]'}`} />
                            <span className={`text-[11px] ${studioGenerationStep === sIdx ? 'font-semibold text-[#1C1C1A]' : 'text-neutral-400'}`}>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : studioGeneratedResult ? (
                    <div className="flex-1 flex flex-col justify-between gap-6 animate-fade-in">
                      <div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 uppercase tracking-widest font-semibold">AI Generation Complete</span>
                        <h4 className="font-serif text-2xl font-light text-[#1C1C1A] mt-2">{studioGeneratedResult.name}</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">Generated: {new Date(studioGeneratedResult.createdAt).toLocaleTimeString()}</p>
                      </div>

                      <div className="aspect-square bg-neutral-200 border border-[#EBEAE4] overflow-hidden relative group">
                        <img src={studioGeneratedResult.imageUrl} alt="Result outfit" className="w-full h-full object-cover" />
                        <div className="absolute bottom-3 left-3 bg-[#1C1C1A]/80 text-[#FFF] text-[10px] tracking-wider px-2 py-1 uppercase">
                          Rendering Preview
                        </div>
                      </div>

                      <div className="border-t border-[#EBEAE4] pt-4 space-y-3">
                        <p className="text-xs text-[#6C6A60]">
                          This result was synthesized privately using <strong className="text-[#1C1C1A] font-semibold">{appState.settings.aiProviders.activeModel}</strong>. It is currently stored in temporary memory.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {studioGeneratedResult.isSaved ? (
                            <button disabled className="bg-neutral-100 text-[#8C8A82] border border-[#EBEAE4] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              Saved to Results
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSaveResult(studioGeneratedResult.id)}
                              className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                            >
                              Save Output Permanently
                            </button>
                          )}

                          <button
                            onClick={() => handleShareResult(studioGeneratedResult.id, !studioGeneratedResult.isShared)}
                            className="border border-[#1C1C1A] hover:bg-[#F5F4F0] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#1C1C1A]" />
                            {studioGeneratedResult.isShared ? 'Shared with Family' : 'Share with Family'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#DCDAD2] bg-[#FBFBF9] p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-[#8C8A82]" />
                      </div>
                      <h4 className="font-serif text-lg font-light text-[#1C1C1A]">Outfitter Output Frame</h4>
                      <p className="text-xs text-[#8C8A82] max-w-sm mt-1.5">
                        Add garments using the builder slots, describe details (optional) and select Generate to see high-end AI rendering here.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SLOT PICKER DRAWER / POPUP */}
              {isSlotPickerOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-[#FFF] border border-[#1C1C1A] max-w-lg w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#EBEAE4] pb-3">
                      <h4 className="font-serif text-lg text-[#1C1C1A]">Select {isSlotPickerOpen} Item</h4>
                      <button onClick={() => setIsSlotPickerOpen(null)} className="p-1 hover:bg-neutral-100 text-[#8C8A82] hover:text-[#1C1C1A]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                      {appState.library.filter(item => item.category === isSlotPickerOpen).length === 0 ? (
                        <div className="text-center py-6 text-xs text-neutral-400">
                          No clothing items in <strong className="text-[#1C1C1A]">{isSlotPickerOpen}</strong> category yet.
                        </div>
                      ) : (
                        appState.library
                          .filter(item => item.category === isSlotPickerOpen)
                          .map(item => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectSlotItem(item)}
                              className="flex items-center justify-between gap-3 p-2.5 border border-[#EBEAE4] hover:border-[#1C1C1A] cursor-pointer bg-[#FCFCFA] transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-neutral-100 overflow-hidden shrink-0 border border-[#EBEAE4]">
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-semibold text-[#1C1C1A] truncate">{item.name}</p>
                                  <p className="text-[10px] text-[#8C8A82] truncate">{item.description || 'No description provided.'}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#8C8A82] shrink-0" />
                            </div>
                          ))
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-[#EBEAE4] pt-3">
                      <p className="text-[10px] text-neutral-400">Filters: Only showing matching category</p>
                      <button
                        onClick={() => { setActiveTab('library'); setIsSlotPickerOpen(null); }}
                        className="text-[10px] uppercase tracking-wider font-semibold text-[#1C1C1A] hover:underline"
                      >
                        + Upload new item
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: CLOTHES LIBRARY --- */}
          {activeTab === 'library' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBEAE4] pb-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-light text-[#1C1C1A]">Clothes Library</h2>
                  <p className="text-xs md:text-sm text-[#8C8A82] mt-1">Manage family clothing products, extract elements, and tag items.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setScanStep('upload'); setScanFileBase64(null); setScanDetections([]); setIsScanOpen(true); }}
                    className="border border-[#1C1C1A] hover:bg-[#F5F4F0] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    Scan Outfit with AI
                  </button>
                  <button
                    onClick={() => setIsAddManualOpen(true)}
                    className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Clothes Item
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-100 pb-4">
                <Filter className="w-3.5 h-3.5 text-[#8C8A82] mr-2" />
                {['All', 'Outerwear', 'Tops', 'Dresses', 'Bottoms', 'Shoes', 'Accessories'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all rounded-none ${
                      selectedCategory === cat
                        ? 'bg-[#1C1C1A] text-[#FFF]'
                        : 'border border-[#EBEAE4] text-[#6C6A60] hover:text-[#1C1C1A] bg-[#FFF]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of Garments */}
              {appState.library.filter(item => selectedCategory === 'All' || item.category === selectedCategory).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#DCDAD2] bg-[#FAF9F5] rounded-none">
                  <ShoppingBag className="w-10 h-10 text-[#8C8A82] mb-3" />
                  <h4 className="font-serif text-lg text-[#1C1C1A]">Empty library section</h4>
                  <p className="text-xs text-[#8C8A82] max-w-xs text-center mt-1">
                    No apparel uploaded under "{selectedCategory}" yet. Add garments to build your custom family dressing room inventory.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {appState.library
                    .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
                    .map(item => (
                      <div key={item.id} className="group bg-[#FFF] border border-[#EBEAE4] hover:border-[#1C1C1A] transition-all flex flex-col justify-between">
                        <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300" />
                          <span className="absolute top-2.5 left-2.5 bg-neutral-900/80 text-[#FFF] text-[8px] uppercase tracking-wider px-2 py-0.5">
                            {item.category}
                          </span>
                          {item.source === 'scan' && (
                            <span className="absolute top-2.5 right-2.5 bg-indigo-900/85 text-[#FFF] text-[8px] uppercase tracking-wider px-2 py-0.5" title="Extracted using AI Outfit scan.">
                              AI Scan
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-1 bg-[#FFF]">
                          <h4 className="text-xs font-semibold text-[#1C1C1A] truncate">{item.name}</h4>
                          <p className="text-[10px] text-neutral-400 line-clamp-2 min-h-[30px] leading-relaxed">{item.description || 'No description added.'}</p>
                          <div className="flex items-center justify-between border-t border-[#F5F4F0] pt-2.5 mt-2">
                            <span className="text-[9px] text-[#8C8A82]">Added {new Date(item.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* MANUAL ADD MODAL */}
              {isAddManualOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <form onSubmit={handleAddManual} className="bg-[#FFF] border border-[#1C1C1A] max-w-md w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#EBEAE4] pb-3">
                      <h4 className="font-serif text-lg text-[#1C1C1A]">Add Clothing Item</h4>
                      <button type="button" onClick={() => setIsAddManualOpen(false)} className="p-1 hover:bg-neutral-100 text-[#8C8A82]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#6C6A60] font-semibold block">Garment Name *</label>
                          <input
                            type="text"
                            required
                            value={manualName}
                            onChange={e => setManualName(e.target.value)}
                            placeholder="e.g. Silk Drape Shirt"
                            className="w-full text-xs p-2 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#6C6A60] font-semibold block">Category *</label>
                          <select
                            value={manualCategory}
                            onChange={e => setManualCategory(e.target.value as any)}
                            className="w-full text-xs p-2 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A]"
                          >
                            <option value="Outerwear">Outerwear</option>
                            <option value="Tops">Tops</option>
                            <option value="Dresses">Dresses</option>
                            <option value="Bottoms">Bottoms</option>
                            <option value="Shoes">Shoes</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-[#6C6A60] font-semibold block">Description</label>
                        <textarea
                          value={manualDescription}
                          onChange={e => setManualDescription(e.target.value)}
                          placeholder="e.g. Crafted in pure organic linen with slightly oversized collars."
                          className="w-full text-xs p-2 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A] h-16 resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-[#6C6A60] font-semibold block">Product Image URL / Source *</label>
                        <input
                          type="text"
                          required
                          value={manualImageUrl}
                          onChange={e => { setManualImageUrl(e.target.value); setManualImagePreview(null); }}
                          placeholder="Paste a direct image web link"
                          className="w-full text-xs p-2 border border-[#DCDAD2] bg-[#FFF] focus:outline-none focus:border-[#1C1C1A]"
                        />
                        <div className="flex items-center gap-2 py-1">
                          <span className="text-[9px] text-neutral-400 uppercase">Or</span>
                          <label className="text-[9px] cursor-pointer underline text-[#1C1C1A] font-semibold uppercase">
                            Upload from computer
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageFileChange(e, 'manual')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Manual Image Preview */}
                      {(manualImagePreview || (manualImageUrl && manualImageUrl.startsWith('http'))) && (
                        <div className="aspect-video bg-neutral-50 border border-[#EBEAE4] overflow-hidden flex items-center justify-center relative">
                          <img src={manualImagePreview || manualImageUrl} alt="Upload preview" className="h-full object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[#EBEAE4] pt-3">
                      <button
                        type="button"
                        onClick={() => setIsAddManualOpen(false)}
                        className="border border-[#EBEAE4] text-xs px-4 py-2 hover:bg-[#F5F4F0]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 text-xs px-4 py-2"
                      >
                        Add to Library
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* AI OUTFIT SCAN OVERLAY WORKFLOW */}
              {isScanOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-[#FFF] border border-[#1C1C1A] max-w-2xl w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#EBEAE4] pb-3">
                      <h4 className="font-serif text-lg text-[#1C1C1A]">Scan Outfit Photo with AI</h4>
                      <button onClick={() => setIsScanOpen(false)} className="p-1 hover:bg-neutral-100 text-[#8C8A82]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step Content */}
                    {scanStep === 'upload' && (
                      <div className="space-y-4 text-center">
                        <p className="text-xs text-[#8C8A82]">
                          Upload a combined outfit / lookbook photograph. AI will analyze the picture, segment individual garments (coats, tops, pants), and crop them isolated into your library.
                        </p>

                        <div className="border border-dashed border-[#DCDAD2] bg-[#FAF9F5] p-8 flex flex-col items-center justify-center cursor-pointer relative hover:border-[#1C1C1A]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageFileChange(e, 'scan')}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {scanFileBase64 ? (
                            <div className="max-h-48 overflow-hidden border border-[#EBEAE4]">
                              <img src={scanFileBase64} alt="Upload Preview" className="h-full object-contain" />
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-[#8C8A82] mb-2" />
                              <p className="text-xs font-semibold text-[#1C1C1A]">Drag & Drop or Click to Upload Outfit Picture</p>
                              <p className="text-[10px] text-neutral-400 mt-1">Supports PNG, JPG up to 5MB</p>
                            </>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t border-[#EBEAE4] pt-3">
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Deducts: <strong className="text-[#1C1C1A]">5 Credits</strong></span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsScanOpen(false)}
                              className="border border-[#EBEAE4] text-xs px-4 py-2 hover:bg-[#F5F4F0]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleScanOutfit}
                              disabled={!scanFileBase64 || scanning}
                              className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 disabled:bg-neutral-300 text-xs px-4 py-2 flex items-center gap-1.5"
                            >
                              {scanning ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Scanning Look...
                                </>
                              ) : (
                                <>
                                  <ScanLine className="w-3.5 h-3.5" />
                                  Initiate Scan
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {scanStep === 'detections' && (
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-xs uppercase tracking-widest text-[#8C8A82] font-semibold">Identified Garments</h5>
                          <p className="text-[10px] text-neutral-400 mt-1">AI segmented 4 distinct clothing components from your outfit. Select which pieces to extract and isolate in your Clothes Library.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                          {scanDetections.map(det => (
                            <div
                              key={det.id}
                              onClick={() => handleToggleDetectionSelect(det.id)}
                              className={`flex items-center gap-3 p-2.5 border cursor-pointer transition-all ${
                                det.selected
                                  ? 'border-[#1C1C1A] bg-[#FAF9F5]'
                                  : 'border-[#EBEAE4] bg-[#FFF]'
                              }`}
                            >
                              <div className="w-12 h-16 bg-neutral-100 overflow-hidden shrink-0 border border-[#EBEAE4]">
                                <img src={det.imageUrl} alt={det.category} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#FFF] bg-[#1C1C1A] px-1.5 py-0.5">
                                    {det.category}
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-700">{det.confidence}% match</span>
                                </div>
                                <p className="text-xs text-[#1C1C1A] truncate font-medium mt-1">{det.description}</p>
                              </div>
                              <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${det.selected ? 'border-[#1C1C1A] bg-[#1C1C1A]' : 'border-[#EBEAE4]'}`}>
                                {det.selected && <Check className="w-3 h-3 text-[#FFF]" />}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-[#EBEAE4] pt-3">
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                            <Info className="w-3.5 h-3.5" />
                            <span>Extraction Cost: <strong className="text-[#1C1C1A]">{scanDetections.filter(d => d.selected).length * 10} Credits</strong> (10 CR/item)</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setScanStep('upload')}
                              className="border border-[#EBEAE4] text-xs px-4 py-2 hover:bg-[#F5F4F0]"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleExtractDetections}
                              disabled={scanDetections.filter(d => d.selected).length === 0}
                              className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 disabled:bg-neutral-300 text-xs px-4 py-2 flex items-center gap-1.5"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                              Isolate & Save
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {scanStep === 'completed' && (
                      <div className="space-y-4 text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <Check className="w-6 h-6" />
                        </div>
                        <h5 className="font-serif text-lg text-[#1C1C1A]">Extraction Complete</h5>
                        <p className="text-xs text-[#8C8A82] max-w-sm mx-auto">
                          Selected garment cropped segments were isolated and added straight to your family library catalog successfully!
                        </p>
                        <div className="pt-4 flex justify-center">
                          <button
                            onClick={() => setIsScanOpen(false)}
                            className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 text-xs px-5 py-2.5"
                          >
                            Close Scan Portal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: GENERATED RESULTS --- */}
          {activeTab === 'results' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EBEAE4] pb-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-light text-[#1C1C1A]">Generated Results</h2>
                  <p className="text-xs md:text-sm text-[#8C8A82] mt-1">Review saved editorial compilations and adjust family sharing.</p>
                </div>
                <div className="flex items-center gap-2 border border-[#EBEAE4] bg-[#FFF] p-1">
                  <button
                    onClick={() => setResultsFilter('all')}
                    className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider ${resultsFilter === 'all' ? 'bg-[#1C1C1A] text-[#FFF]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'}`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => setResultsFilter('saved')}
                    className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider ${resultsFilter === 'saved' ? 'bg-[#1C1C1A] text-[#FFF]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'}`}
                  >
                    Saved Permanent
                  </button>
                  <button
                    onClick={() => setResultsFilter('shared')}
                    className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider ${resultsFilter === 'shared' ? 'bg-[#1C1C1A] text-[#FFF]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'}`}
                  >
                    Shared with Family
                  </button>
                </div>
              </div>

              {/* Grid of Results */}
              {appState.results.filter(r => {
                if (resultsFilter === 'saved') return r.isSaved;
                if (resultsFilter === 'shared') return r.isShared;
                return true;
              }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#DCDAD2] bg-[#FAF9F5]">
                  <FolderHeart className="w-10 h-10 text-[#8C8A82] mb-3" />
                  <h4 className="font-serif text-lg text-[#1C1C1A]">No results to showcase</h4>
                  <p className="text-xs text-[#8C8A82] max-w-xs text-center mt-1">
                    No generated outfit matches under the current filter state. Build outfits inside the Studio builder tab to generate lookbook ideas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {appState.results
                    .filter(r => {
                      if (resultsFilter === 'saved') return r.isSaved;
                      if (resultsFilter === 'shared') return r.isShared;
                      return true;
                    })
                    .map(r => (
                      <div key={r.id} className="bg-[#FFF] border border-[#EBEAE4] hover:border-[#1C1C1A] transition-all flex flex-col justify-between">
                        <div className="aspect-square bg-neutral-100 overflow-hidden relative group">
                          <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover transition-transform group-hover:scale-101 duration-500" />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            {!r.isSaved && (
                              <span className="bg-amber-500 text-white text-[8px] uppercase tracking-wider px-2 py-0.5">
                                Temp Preview
                              </span>
                            )}
                            {r.isShared && (
                              <span className="bg-blue-600 text-[#FFF] text-[8px] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                Family Shared
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-5 space-y-4 bg-[#FFF]">
                          <div>
                            <h4 className="font-serif text-lg text-[#1C1C1A]">{r.name}</h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Synthesized {new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>

                          {/* Components lists */}
                          <div className="space-y-1.5 border-t border-[#F5F4F0] pt-3">
                            <span className="text-[9px] uppercase tracking-wider text-[#8C8A82] font-semibold">Layer Composition:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {r.items.map(itemId => {
                                const matchedItem = appState.library.find(l => l.id === itemId);
                                if (!matchedItem) return null;
                                return (
                                  <span key={itemId} className="text-[9px] border border-[#EBEAE4] px-2 py-0.5 bg-[#FAFBF9] text-[#6C6A60]">
                                    {matchedItem.category}: {matchedItem.name.split(' ').slice(0, 2).join(' ')}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#F5F4F0] pt-4 mt-2 gap-2">
                            <div className="flex gap-1">
                              {!r.isSaved && (
                                <button
                                  onClick={() => handleSaveResult(r.id)}
                                  className="bg-[#1C1C1A] text-[#FFF] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 hover:bg-neutral-800"
                                >
                                  Save Output
                                </button>
                              )}
                              <button
                                onClick={() => handleShareResult(r.id, !r.isShared)}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 border ${
                                  r.isShared
                                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                                    : 'border-[#1C1C1A] text-[#1C1C1A] hover:bg-neutral-50'
                                }`}
                              >
                                {r.isShared ? 'Shared' : 'Share'}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <a
                                href={r.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={`fashion_outfit_${r.id}.jpg`}
                                className="p-1.5 border border-[#EBEAE4] text-[#6C6A60] hover:text-[#1C1C1A]"
                                title="Download image"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleDeleteResult(r.id)}
                                className="p-1.5 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Delete Result"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: SETTINGS & ADMIN --- */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-[#EBEAE4] pb-6">
                <h2 className="font-serif text-2xl md:text-3xl font-light text-[#1C1C1A]">Settings & Administration</h2>
                <p className="text-xs md:text-sm text-[#8C8A82] mt-1">Configure account options, edit AI provider credentials, track credits, and manage family roles.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Left Mini Sub Tab Navigation */}
                <div className="md:col-span-3 space-y-1 bg-[#F5F4F0] p-4 border border-[#EBEAE4]">
                  <button
                    onClick={() => setSettingsSubTab('account')}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold flex items-center justify-between ${
                      settingsSubTab === 'account' ? 'bg-[#FFF] text-[#1C1C1A] border-l-2 border-[#1C1C1A]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'
                    }`}
                  >
                    <span>My Account</span>
                    <User className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('ai')}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold flex items-center justify-between ${
                      settingsSubTab === 'ai' ? 'bg-[#FFF] text-[#1C1C1A] border-l-2 border-[#1C1C1A]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'
                    }`}
                  >
                    <span>AI Engine</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('credits')}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold flex items-center justify-between ${
                      settingsSubTab === 'credits' ? 'bg-[#FFF] text-[#1C1C1A] border-l-2 border-[#1C1C1A]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'
                    }`}
                  >
                    <span>Credits & Refills</span>
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>

                  {appState.settings.account.role === 'Admin' && (
                    <button
                      onClick={() => setSettingsSubTab('admin')}
                      className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-semibold flex items-center justify-between ${
                        settingsSubTab === 'admin' ? 'bg-[#FFF] text-[#1C1C1A] border-l-2 border-[#1C1C1A]' : 'text-[#6C6A60] hover:text-[#1C1C1A]'
                      }`}
                    >
                      <span>Family & Access</span>
                      <Users className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right Settings Container */}
                <div className="md:col-span-9 bg-[#FFF] border border-[#EBEAE4] p-6 min-h-[350px]">
                  {settingsSubTab === 'account' && (
                    <div className="space-y-6">
                      <h4 className="font-serif text-xl font-light text-[#1C1C1A] border-b border-neutral-100 pb-3">User Profile</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">User Profile Name</label>
                          <input
                            type="text"
                            value={appState.settings.account.name}
                            onChange={e => handleUpdateSettings({
                              account: { ...appState.settings.account, name: e.target.value }
                            })}
                            className="w-full text-xs p-2.5 border border-[#DCDAD2] bg-[#FAF9F5]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Private Access Email</label>
                          <input
                            type="email"
                            readOnly
                            value={appState.settings.account.email}
                            className="w-full text-xs p-2.5 border border-[#DCDAD2] bg-neutral-50 text-neutral-400 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-[#FBFBF9] border border-[#EBEAE4] space-y-2">
                        <p className="text-xs font-semibold text-[#1C1C1A] flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-neutral-400" />
                          Role Status: {appState.settings.account.role}
                        </p>
                        <p className="text-[10px] text-[#8C8A82] leading-relaxed">
                          Your profile is an authorized workspace {appState.settings.account.role}. You can view the clothing inventory, save generated outcomes, and contribute lookbooks.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'ai' && (
                    <div className="space-y-6">
                      <h4 className="font-serif text-xl font-light text-[#1C1C1A] border-b border-neutral-100 pb-3">AI Engine Orchestrator</h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Active Generative Vision Model</label>
                          <select
                            value={appState.settings.aiProviders.activeModel}
                            onChange={e => handleUpdateSettings({
                              aiProviders: { ...appState.settings.aiProviders, activeModel: e.target.value }
                            })}
                            className="w-full text-xs p-2.5 border border-[#DCDAD2] bg-[#FAF9F5] focus:outline-none focus:border-[#1C1C1A]"
                          >
                            <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Ultra Editorial)</option>
                            <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Performance Segment)</option>
                            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Legacy High Density)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Custom API Credentials Key (Optional)</label>
                          <input
                            type="password"
                            value={appState.settings.aiProviders.geminiKey}
                            onChange={e => handleUpdateSettings({
                              aiProviders: { ...appState.settings.aiProviders, geminiKey: e.target.value }
                            })}
                            placeholder="Enter Google Developer API key to override workspace limits"
                            className="w-full text-xs p-2.5 border border-[#DCDAD2] bg-[#FAF9F5] focus:outline-none focus:border-[#1C1C1A]"
                          />
                          <p className="text-[10px] text-neutral-400">
                            By default, the platform uses server-side service pooled keys. Providing your custom developer key unlocks unlimited generates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'credits' && (
                    <div className="space-y-6">
                      <h4 className="font-serif text-xl font-light text-[#1C1C1A] border-b border-neutral-100 pb-3">Credits & Ledger History</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-[#EBEAE4] bg-[#FAF9F5] space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Available Balance</span>
                          <p className="text-2xl font-bold font-serif text-[#1C1C1A]">{appState.settings.credits.balance} CR</p>
                        </div>
                        <div className="p-4 border border-[#EBEAE4] bg-[#FAF9F5] space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Accumulated Consumption</span>
                          <p className="text-2xl font-bold font-serif text-neutral-500">{appState.settings.credits.totalUsed} CR</p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <h5 className="text-[10px] uppercase tracking-wider text-[#8C8A82] font-semibold">Consumables Cost Breakdown</h5>
                        <div className="border border-[#EBEAE4] divide-y divide-[#EBEAE4] text-xs">
                          <div className="flex justify-between items-center p-2.5 bg-[#FAFBF9]">
                            <span>Segment clothing from combined outfit photo (AI Scan)</span>
                            <span className="font-mono font-bold">5 Credits</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-[#FAFBF9]">
                            <span>Isolate & extract high-end garment into Library catalog</span>
                            <span className="font-mono font-bold">10 Credits / item</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-[#FAFBF9]">
                            <span>Synthesize layer layout & build visual (Studio render)</span>
                            <span className="font-mono font-bold">25 Credits</span>
                          </div>
                        </div>

                        {appState.settings.account.role === 'Admin' && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleAdminAddCredits(100)}
                              className="bg-[#1C1C1A] text-[#FFF] hover:bg-neutral-800 text-xs font-semibold px-4 py-2.5 uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Refill Admin Balance (+100 CR)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsSubTab === 'admin' && (
                    <div className="space-y-6">
                      <h4 className="font-serif text-xl font-light text-[#1C1C1A] border-b border-neutral-100 pb-3">Family Members & Access Controls</h4>
                      
                      <div className="space-y-4">
                        <p className="text-xs text-[#8C8A82]">Only Admin users can review family permission records or expand members.</p>
                        
                        <div className="border border-[#EBEAE4] divide-y divide-[#EBEAE4]">
                          {appState.settings.members.map(member => (
                            <div key={member.id} className="flex justify-between items-center p-3 text-xs bg-[#FAFBF9]">
                              <div>
                                <p className="font-semibold text-[#1C1C1A]">{member.name}</p>
                                <p className="text-[10px] text-neutral-400">{member.email}</p>
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${
                                member.role === 'Admin'
                                  ? 'bg-[#1C1C1A] text-white'
                                  : 'border-[#EBEAE4] text-neutral-600'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => alert('Adding new private family records requires a validated invitation link.')}
                            className="border border-[#1C1C1A] hover:bg-neutral-50 text-xs px-4 py-2.5 uppercase tracking-wider"
                          >
                            + Invite Family Member
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MOBILE NAVIGATION DOCK --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F4F0] border-t border-[#EBEAE4] grid grid-cols-4 z-40 h-16">
        <button
          onClick={() => { setActiveTab('studio'); setStudioGeneratedResult(null); }}
          className={`flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-wider font-semibold ${activeTab === 'studio' ? 'text-[#1C1C1A] bg-[#FFF]' : 'text-[#8C8A82]'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-wider font-semibold ${activeTab === 'library' ? 'text-[#1C1C1A] bg-[#FFF]' : 'text-[#8C8A82]'}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Library</span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-wider font-semibold ${activeTab === 'results' ? 'text-[#1C1C1A] bg-[#FFF]' : 'text-[#8C8A82]'}`}
        >
          <FolderHeart className="w-4 h-4" />
          <span>Results</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-wider font-semibold ${activeTab === 'settings' ? 'text-[#1C1C1A] bg-[#FFF]' : 'text-[#8C8A82]'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
