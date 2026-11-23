import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../utils/themeConfig';
import { GRAPH_PRESETS, generateGraphData, PresetGraph } from '../utils/graphGenerator';
import {
  LineChart,
  X,
  Sparkles,
  Download,
  Check,
  Layers,
  TrendingUp,
} from 'lucide-react';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string, graphImageUrl?: string) => void;
}

export const GraphModal: React.FC<GraphModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const { themeConfig } = useTheme();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('parabola-standard');
  const [customEquation, setCustomEquation] = useState<string>('f(x) = x^2 - 4x + 3');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Compute live graph dataset and image based on active equation
  const graphData = useMemo(() => {
    return generateGraphData(customEquation);
  }, [customEquation]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetGraph) => {
    setSelectedPresetId(preset.id);
    setCustomEquation(preset.equation);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = graphData.svgDataUrl;
    link.download = `cipher_graph_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleSendToCipher = () => {
    const prompt = `Graph and analyze the equation ${customEquation}. Identify the vertex, intercepts, and key geometric properties.`;
    onSendToChat(prompt, graphData.svgDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl border rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto flex flex-col gap-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between border-b pb-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-md">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  Cipher AI Graph Generator
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
                  Visual Curve Plotter
                </span>
              </div>
              <p className="text-xs opacity-75 mt-0.5">
                Generate high-resolution mathematical coordinate graph images and ask Cipher AI to solve.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Pills */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Select Mathematical Preset or Enter Below:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GRAPH_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 rounded-2xl border text-left transition-all hover:opacity-90"
                  style={{
                    backgroundColor: isSelected ? 'var(--badge-bg)' : 'var(--bg-input)',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <div className="text-xs font-bold truncate">{preset.name}</div>
                  <div className="text-[11px] font-mono opacity-85 truncate text-amber-500">
                    {preset.equation}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Equation Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider opacity-75">
            Function Equation / Curve:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customEquation}
              onChange={(e) => {
                setCustomEquation(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="e.g. f(x) = x^2 - 4x + 3, y = 2x - 1, y = 2sin(x)"
              className="flex-1 border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)',
              }}
            />
          </div>
        </div>

        {/* Live Generated Graph Image Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Generated Graph Image Preview
            </span>
            <span className="text-[10px] font-mono opacity-65">
              High-Resolution Coordinate Plane
            </span>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden border bg-slate-950 shadow-inner group"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <img
              src={graphData.svgDataUrl}
              alt="Generated Coordinate Graph"
              className="w-full max-h-72 object-contain mx-auto"
            />
          </div>
        </div>

        {/* Key Points & Analysis Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {graphData.vertex && (
            <div
              className="p-2.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] uppercase font-bold opacity-70">Vertex (h, k)</div>
              <div className="text-xs font-mono font-bold text-amber-500 mt-0.5">
                ({graphData.vertex.x.toFixed(2)}, {graphData.vertex.y.toFixed(2)})
              </div>
            </div>
          )}

          {graphData.xIntercepts.length > 0 && (
            <div
              className="p-2.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] uppercase font-bold opacity-70">X-Intercepts</div>
              <div className="text-xs font-mono font-bold text-emerald-500 mt-0.5">
                {graphData.xIntercepts.map((r) => r.toFixed(1)).join(', ')}
              </div>
            </div>
          )}

          {graphData.yIntercept !== undefined && (
            <div
              className="p-2.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] uppercase font-bold opacity-70">Y-Intercept</div>
              <div className="text-xs font-mono font-bold text-sky-500 mt-0.5">
                (0, {graphData.yIntercept.toFixed(1)})
              </div>
            </div>
          )}

          {graphData.intersection && (
            <div
              className="p-2.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] uppercase font-bold opacity-70">Equilibrium</div>
              <div className="text-xs font-mono font-bold text-amber-500 mt-0.5">
                Q*={graphData.intersection.x}, P*={graphData.intersection.y}
              </div>
            </div>
          )}
        </div>

        {/* Actions Toolbar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)',
            }}
          >
            {copiedNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Downloaded Graph Image!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Download Graph Image</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendToCipher}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${themeConfig.classes.accentBtn}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Cipher AI to Plot & Solve This Curve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
