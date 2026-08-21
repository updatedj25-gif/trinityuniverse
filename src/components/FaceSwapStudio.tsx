import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  User, 
  Image as ImageIcon, 
  Video, 
  Download, 
  RefreshCw, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Tenant } from '../types';

interface FaceSwapStudioProps {
  tenant: Tenant;
}

export interface SwapHistoryItem {
  id: string;
  originalUrl: string;
  targetFaceUrl: string;
  resultUrl: string;
  createdAt: string;
}

export const FaceSwapStudio: React.FC<FaceSwapStudioProps> = ({ tenant }) => {
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [swapMode, setSwapMode] = useState<'single' | 'multiple' | 'batch'>('single');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [targetFaceImage, setTargetFaceImage] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapStep, setSwapStep] = useState<string>('');
  const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>([]);
  const [showHistoryToggle, setShowHistoryToggle] = useState<boolean>(true);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const sampleOriginals = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
  ];
  const sampleTargets = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80"
  ];

  const fetchSwapHistory = async () => {
    try {
      const res = await fetch('/api/faceswap/history');
      const data = await res.json() as any;
      if (data.history && Array.isArray(data.history)) {
        setSwapHistory(data.history);
        if (data.history.length > 0 && !selectedResult) {
          setSelectedResult(data.history[0].resultUrl);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchSwapHistory();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'orig' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (target === 'orig') setOriginalImage(reader.result as string);
        else setTargetFaceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Phase 1: Direct Neural Backend Execution without client canvas blending
  const handleExecuteFaceSwap = async () => {
    if (!originalImage || !targetFaceImage || isSwapping) return;
    setIsSwapping(true);
    setSwapStep('Uploading raw assets to E2B Sandbox...');

    try {
      setTimeout(() => {
        setSwapStep('Running InsightFace neural swap in Micro-VM...');
      }, 1500);

      const res = await fetch('/api/faceswap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImage,
          targetFaceImage,
          mode: swapMode,
          mediaType
        })
      });

      const data = await res.json() as any;
      if (data.success && data.resultUrl) {
        setSwapStep('Persisting assets to Cloudflare R2 & KV...');
        setSelectedResult(data.resultUrl);
        fetchSwapHistory();
      } else {
        throw new Error(data.error || 'Face swap execution failed');
      }
    } catch (e: any) {
      console.error('[InsightFace Error]:', e);
      alert(`Face Swap Error: ${e.message || 'Detection failed on one or both faces.'}`);
    } finally {
      setIsSwapping(false);
      setSwapStep('');
    }
  };

  const isYada = tenant.id === 'yada';
  const primaryBg = isYada ? 'bg-[#A36224] hover:bg-[#8a511d]' : 'bg-[#0070f3] hover:bg-[#0060df]';
  const activeBorder = isYada ? 'border-[#A36224] text-[#A36224]' : 'border-[#0070f3] text-[#0070f3]';

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[#FBF9F6] text-slate-800">
      {/* LEFT INPUT WORKSPACE */}
      <div className="w-full lg:w-[460px] bg-white border-r border-stone-200 p-6 flex flex-col overflow-y-auto shrink-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className={`p-1.5 rounded-lg text-white ${isYada ? 'bg-[#A36224]' : 'bg-[#0070f3]'}`}>
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="font-bold text-sm tracking-tight text-slate-800">
            {tenant.name} InsightFace Studio
          </span>
        </div>

        {/* Media Type Switcher */}
        <div className="flex bg-stone-100 p-1 rounded-full mb-6 border border-stone-200">
          <button
            onClick={() => setMediaType('photo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'photo' ? `${primaryBg} text-white shadow-sm` : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo Face Swap
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'video' ? `${primaryBg} text-white shadow-sm` : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Video & GIF Face Swap
          </button>
        </div>

        {/* Mode Sub-Tabs */}
        <div className="flex border-b border-stone-200 mb-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setSwapMode('single')}
            className={`pb-2.5 transition-all cursor-pointer ${swapMode === 'single' ? `${activeBorder} border-b-2 font-bold` : 'text-stone-400 hover:text-slate-800'}`}
          >
            Single Face
          </button>
          <button
            onClick={() => setSwapMode('multiple')}
            className={`pb-2.5 transition-all cursor-pointer ${swapMode === 'multiple' ? `${activeBorder} border-b-2 font-bold` : 'text-stone-400 hover:text-slate-800'}`}
          >
            Multiple Faces
          </button>
          <button
            onClick={() => setSwapMode('batch')}
            className={`pb-2.5 transition-all cursor-pointer ${swapMode === 'batch' ? `${activeBorder} border-b-2 font-bold` : 'text-stone-400 hover:text-slate-800'}`}
          >
            Batch Swap
          </button>
        </div>

        {/* Dual Upload Dropzones */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Dropzone 1: Original Image */}
          <div className="flex flex-col">
            <div className="text-xs font-bold text-slate-800 mb-0.5">Upload Original Image</div>
            <div className="text-[10px] text-stone-400 mb-2 truncate">Retain areas outside face</div>
            
            <label className="flex-1 min-h-[150px] border-2 border-dashed border-stone-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center p-3 cursor-pointer bg-stone-50/50 hover:bg-blue-50/20 transition-all relative overflow-hidden group">
              {originalImage ? (
                <img src={originalImage} alt="Original" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 mb-2">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-600">Upload body</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'orig')} className="hidden" />
            </label>

            <div className="mt-2.5">
              <span className="text-[10px] text-stone-400 block mb-1">Try those images</span>
              <div className="flex gap-1.5">
                {sampleOriginals.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    onClick={() => setOriginalImage(src)} 
                    alt="sample" 
                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-xs" 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dropzone 2: Target Face */}
          <div className="flex flex-col">
            <div className="text-xs font-bold text-slate-800 mb-0.5">Upload Target face</div>
            <div className="text-[10px] text-stone-400 mb-2 truncate">Face to extract identity from</div>
            
            <label className="flex-1 min-h-[150px] border-2 border-dashed border-stone-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center p-3 cursor-pointer bg-stone-50/50 hover:bg-blue-50/20 transition-all relative overflow-hidden group">
              {targetFaceImage ? (
                <img src={targetFaceImage} alt="Target" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 mb-2">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-600">Upload face</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'face')} className="hidden" />
            </label>

            <div className="mt-2.5">
              <span className="text-[10px] text-stone-400 block mb-1">Try those images</span>
              <div className="flex gap-1.5">
                {sampleTargets.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    onClick={() => setTargetFaceImage(src)} 
                    alt="sample" 
                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-xs" 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleExecuteFaceSwap}
          disabled={!originalImage || !targetFaceImage || isSwapping}
          className={`w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            originalImage && targetFaceImage && !isSwapping
              ? `${primaryBg} text-white cursor-pointer`
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
        >
          {isSwapping ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{swapStep || 'Executing Neural Face Swap...'}</span>
            </>
          ) : (
            <>Run InsightFace Swap</>
          )}
        </button>
      </div>

      {/* RIGHT DISPLAY WORKSPACE */}
      <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto items-center">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-1.5">InsightFace Neural Processing</h2>
          <p className="text-xs text-stone-500">
            Powered by Buffalo_L Landmark Detection + Inswapper-128 ONNX inside E2B Sandbox.
          </p>
        </div>

        {/* Single HD Result Container */}
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-4 shadow-sm flex flex-col items-center">
          <div className="w-full aspect-[3/4] max-h-[460px] rounded-2xl bg-stone-100 border border-stone-200 relative overflow-hidden flex items-center justify-center shadow-inner">
            {selectedResult ? (
              <img 
                src={selectedResult} 
                alt="Face Swap Result" 
                className="w-full h-full object-cover rounded-2xl transition-all duration-300" 
              />
            ) : isSwapping ? (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">{swapStep || 'Processing...'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-400 p-6 text-center">
                <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                <span className="text-xs font-medium">Your InsightFace swap will render here</span>
              </div>
            )}

            {selectedResult && !isSwapping && (
              <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600/90 text-white rounded-full text-[10px] font-mono font-bold shadow flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Neural Swap Result
              </span>
            )}
          </div>

          {selectedResult && (
            <a
              href={selectedResult}
              download={`insightface_result_${Date.now()}.jpg`}
              className={`w-full py-3.5 mt-4 rounded-xl ${primaryBg} text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer`}
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res Output</span>
            </a>
          )}
        </div>

        {/* History Gallery */}
        <div className="max-w-md w-full mt-10">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">History</span>
              <label className="text-xs text-stone-400 flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="rounded text-blue-600" />
                Select Multiple
              </label>
            </div>
            <div 
              onClick={() => setShowHistoryToggle(!showHistoryToggle)}
              className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${showHistoryToggle ? (isYada ? 'bg-[#A36224]' : 'bg-blue-600') : 'bg-stone-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform transform ${showHistoryToggle ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {showHistoryToggle && (
            <div className="grid grid-cols-3 gap-3">
              {swapHistory.length === 0 ? (
                <div className="col-span-full py-6 text-center text-xs text-stone-400 italic bg-white rounded-2xl border border-stone-200">
                  No face swap history yet.
                </div>
              ) : (
                swapHistory.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedResult(item.resultUrl)}
                    className={`group relative h-32 rounded-2xl overflow-hidden border cursor-pointer shadow-sm hover:shadow-md transition-all bg-white ${
                      selectedResult === item.resultUrl ? 'border-blue-500 ring-2 ring-blue-400' : 'border-stone-200'
                    }`}
                  >
                    <img src={item.resultUrl} alt="History" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a 
                        href={item.resultUrl} 
                        download={`faceswap_${item.id}.jpg`} 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full bg-white text-slate-900 shadow hover:bg-stone-100"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
