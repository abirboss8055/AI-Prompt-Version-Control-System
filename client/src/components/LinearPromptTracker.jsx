import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Sliders,
  Send,
  Clock,
  Copy,
  Check,
  RotateCcw,
  Image as ImageIcon,
  Layers,
  GitCommit,
  GitBranch,
  X,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';

const DEFAULT_PROJECT_ID = 'proj_linear_tracker_01';

const CONCEPT_PRESETS = [
  {
    label: '🏍️ Cyberpunk Motorcycle',
    concept: 'Outdoor cyberpunk street scene with a sleek neon futuristic motorcycle parked under rain-slicked asphalt, holographic reflections, moody purple and cyan volumetric fog, hyper-detailed, 8k cinematic shot.',
    negative: 'cartoon, low-res, blurry, distorted anatomy, text, watermark',
    settings: { cfg_scale: 7.5, steps: 35, aspect_ratio: '16:9', model: 'SDXL Turbo' },
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: '👤 Cinematic Portrait',
    concept: 'Studio cinematic portrait of a cybernetic warrior with subtle glowing gold circuits along the jawline, Rembrandt lighting, shallow depth of field, 85mm lens, photorealistic texture.',
    negative: 'bad eyes, multiple faces, deformed, plastic skin, oversaturated',
    settings: { cfg_scale: 6.5, steps: 40, aspect_ratio: '1:1', model: 'Flux.1 Schnell' },
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: '🏜️ Wasteland Outpost',
    concept: 'Post-apocalyptic desert trading post built from scavenged aircraft fuselages, dusty golden hour sunlight, heat shimmer, gritty hyper-realistic environment.',
    negative: 'clean, modern, sterile, saturated neon, blurry',
    settings: { cfg_scale: 8.0, steps: 30, aspect_ratio: '16:9', model: 'SDXL Base' },
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
  },
];

export default function LinearPromptTracker({ projectId = DEFAULT_PROJECT_ID }) {
  // Input Form States
  const [promptText, setPromptText] = useState(CONCEPT_PRESETS[0].concept);
  const [negativePrompt, setNegativePrompt] = useState(CONCEPT_PRESETS[0].negative);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [steps, setSteps] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [model, setModel] = useState('SDXL Turbo');
  const [imageUrl, setImageUrl] = useState(CONCEPT_PRESETS[0].imageUrl);
  const [branchLabel, setBranchLabel] = useState('');

  // Active Branch Parent State
  const [branchParent, setBranchParent] = useState(null);

  // Timeline & Async States
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch prompts on mount
  useEffect(() => {
    fetchPrompts();
  }, [projectId]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/prompts`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setPrompts(response.data.data);
      }
    } catch (error) {
      console.warn('Backend not reachable; utilizing initial local demonstration versions.', error);
      if (prompts.length === 0) {
        setPrompts([
          {
            id: 'mock-v3',
            project_id: projectId,
            parent_id: 'mock-v2',
            parent: { id: 'mock-v2', version: 2 },
            branch_label: 'cinematic-studio-lighting',
            version: 3,
            prompt_text: 'Outdoor cyberpunk street scene with sleek neon futuristic motorcycle parked under rain-slicked asphalt, holographic reflections, moody purple and cyan volumetric fog, volumetric cinematic studio lighting.',
            negative_prompt: 'cartoon, low-res, blurry, distorted anatomy, text',
            image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
            settings: { cfg_scale: 8.5, steps: 40, aspect_ratio: '16:9', model: 'SDXL Turbo' },
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            _count: { branches: 0 },
          },
          {
            id: 'mock-v2',
            project_id: projectId,
            parent_id: 'mock-v1',
            parent: { id: 'mock-v1', version: 1 },
            branch_label: 'night-alley-tweak',
            version: 2,
            prompt_text: 'Outdoor motorcycle parked in futuristic city night alleyway, moody rain lights, sharp focus.',
            negative_prompt: 'deformed, low quality',
            image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
            settings: { cfg_scale: 7.0, steps: 30, aspect_ratio: '16:9', model: 'SDXL Base' },
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            _count: { branches: 1 },
          },
          {
            id: 'mock-v1',
            project_id: projectId,
            parent_id: null,
            parent: null,
            version: 1,
            prompt_text: 'A cool motorcycle at night in an outdoor city street.',
            negative_prompt: 'blurry',
            image_url: null,
            settings: { cfg_scale: 5.5, steps: 20, aspect_ratio: '1:1', model: 'Stable Diffusion 1.5' },
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            _count: { branches: 1 },
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit either a new root prompt or a branch from an existing prompt
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      prompt_text: promptText.trim(),
      negative_prompt: negativePrompt.trim() || null,
      image_url: imageUrl.trim() || null,
      settings: {
        cfg_scale: Number(cfgScale),
        steps: Number(steps),
        aspect_ratio: aspectRatio,
        model: model,
      },
      branch_label: branchLabel.trim() || undefined,
    };

    try {
      let response;
      if (branchParent) {
        // Post to the 'Branch from here' endpoint
        response = await axios.post(`/api/prompts/${branchParent.id}/branch`, payload);
      } else {
        // Standard prompt creation
        response = await axios.post(`/api/projects/${projectId}/prompts`, payload);
      }

      if (response.data?.success && response.data.data) {
        setPrompts((prev) => [response.data.data, ...prev]);
        setStatusMessage({
          type: 'success',
          text: branchParent
            ? `Branch v${response.data.data.version} created from parent v${branchParent.version}!`
            : `Committed version v${response.data.data.version} successfully!`,
        });
        setBranchParent(null);
        setBranchLabel('');
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.warn('Backend request failed or offline. Simulating local branch/commit:', error);
      const nextVersion = prompts.length > 0 ? (prompts[0].version || prompts.length) + 1 : 1;
      const optimisticPrompt = {
        id: 'local-' + Date.now(),
        project_id: projectId,
        parent_id: branchParent ? branchParent.id : null,
        parent: branchParent ? { id: branchParent.id, version: branchParent.version } : null,
        branch_label: branchLabel.trim() || (branchParent ? `branch-v${branchParent.version}` : null),
        version: nextVersion,
        prompt_text: payload.prompt_text,
        negative_prompt: payload.negative_prompt,
        image_url: payload.image_url,
        settings: payload.settings,
        created_at: new Date().toISOString(),
      };
      setPrompts((prev) => [optimisticPrompt, ...prev]);
      setStatusMessage({
        type: 'info',
        text: branchParent
          ? `Branched v${nextVersion} from v${branchParent.version} (Client preview). Connect PostgreSQL to persist.`
          : `Committed v${nextVersion} (Client preview). Connect PostgreSQL to persist.`,
      });
      setBranchParent(null);
      setBranchLabel('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 'Branch from here' handler
  const handleBranchFrom = (parentItem) => {
    setBranchParent({
      id: parentItem.id,
      version: parentItem.version,
      text: parentItem.prompt_text,
    });

    // Populate current parameters as the baseline for the tweak
    setPromptText(parentItem.prompt_text + ', cinematic studio lighting, dramatic volumetric glow');
    setNegativePrompt(parentItem.negative_prompt || '');
    if (parentItem.image_url) setImageUrl(parentItem.image_url);
    if (parentItem.settings) {
      if (parentItem.settings.cfg_scale !== undefined) setCfgScale(parentItem.settings.cfg_scale);
      if (parentItem.settings.steps !== undefined) setSteps(parentItem.settings.steps);
      if (parentItem.settings.aspect_ratio) setAspectRatio(parentItem.settings.aspect_ratio);
      if (parentItem.settings.model) setModel(parentItem.settings.model);
    }
    setBranchLabel(`branch-v${parentItem.version}`);

    setStatusMessage({
      type: 'info',
      text: `Branching from Version v${parentItem.version}. Tweak the prompt and click 'Commit Branch'.`,
    });
  };

  // Restore previous version settings into the editor
  const handleRestoreVersion = (versionItem) => {
    setBranchParent(null);
    setPromptText(versionItem.prompt_text);
    setNegativePrompt(versionItem.negative_prompt || '');
    if (versionItem.image_url) setImageUrl(versionItem.image_url);

    if (versionItem.settings) {
      if (versionItem.settings.cfg_scale !== undefined) setCfgScale(versionItem.settings.cfg_scale);
      if (versionItem.settings.steps !== undefined) setSteps(versionItem.settings.steps);
      if (versionItem.settings.aspect_ratio) setAspectRatio(versionItem.settings.aspect_ratio);
      if (versionItem.settings.model) setModel(versionItem.settings.model);
    }

    setStatusMessage({
      type: 'info',
      text: `Restored parameters from version v${versionItem.version} into composer.`,
    });
  };

  const handleCopyPrompt = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyPreset = (preset) => {
    setBranchParent(null);
    setPromptText(preset.concept);
    setNegativePrompt(preset.negative);
    setCfgScale(preset.settings.cfg_scale);
    setSteps(preset.settings.steps);
    setAspectRatio(preset.settings.aspect_ratio);
    setModel(preset.settings.model);
    setImageUrl(preset.imageUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <GitCommit className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">PromptTrack</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
                Linear VCS & Branching
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Project ID:</span>
              <code className="text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {projectId}
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Versions:</span>
            <span className="font-semibold text-white">{prompts.length}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>CFG:</span>
            <span className="font-semibold text-white">{cfgScale}</span>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2.5 text-xs flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800/50'
              : 'bg-indigo-950/80 text-indigo-300 border-b border-indigo-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-4 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: Prompt Composer & Branching Controls (5 cols)     */}
        {/* ============================================================== */}
        <section className="lg:col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur flex flex-col gap-5 lg:sticky lg:top-20">
          
          {/* Header & Active Branching Indicator */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {branchParent ? (
                <GitBranch className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-400" />
              )}
              <h2 className="text-sm font-semibold text-white">
                {branchParent ? `Branching from v${branchParent.version}` : 'Prompt Composer'}
              </h2>
            </div>
            {branchParent ? (
              <button
                type="button"
                onClick={() => setBranchParent(null)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/30"
              >
                <X className="w-3 h-3" />
                Cancel Branch
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">Create new iteration</span>
            )}
          </div>

          {/* Active Branch Callout Banner */}
          {branchParent && (
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Target Parent: Version v{branchParent.version}
                </span>
                <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200">
                  parent_id: {branchParent.id.slice(0, 8)}...
                </span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-1 italic">
                "{branchParent.text}"
              </p>
              <div className="mt-1">
                <label className="text-[10px] text-slate-400 block mb-0.5">Branch Label (optional):</label>
                <input
                  type="text"
                  value={branchLabel}
                  onChange={(e) => setBranchLabel(e.target.value)}
                  placeholder="e.g. cinematic-lighting, portrait-mod"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Preset Templates */}
          {!branchParent && (
            <div>
              <label className="text-xs font-medium text-slate-300 mb-2 block">Quick Concept Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {CONCEPT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs bg-slate-800/80 hover:bg-purple-900/30 hover:border-purple-600/50 border border-slate-700/60 text-slate-300 hover:text-purple-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Prompt Text Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-200">
                  {branchParent ? 'Tweaked Prompt Text' : 'Base Concept / Prompt'} <span className="text-purple-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">{promptText.length} chars</span>
              </div>
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your scene or add tweaks (e.g., adding cinematic studio lighting)..."
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all shadow-inner"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Negative Prompt</label>
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude (e.g., blurry, mutated hands)..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all"
              />
            </div>

            {/* Image URL Input */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Image URL (Output / Reference)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (or leave empty for placeholder)"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Settings Accordion */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Generation Settings (JSONB)</span>
              </div>

              {/* CFG Scale */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400">CFG Scale (Prompt Guidance)</span>
                  <span className="font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded text-[11px] border border-purple-800/40">
                    {cfgScale}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="20.0"
                  step="0.5"
                  value={cfgScale}
                  onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Steps & Model */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="SDXL Turbo">SDXL Turbo</option>
                    <option value="Flux.1 Schnell">Flux.1 Schnell</option>
                    <option value="Midjourney v6">Midjourney v6</option>
                    <option value="SDXL Base">SDXL Base</option>
                    <option value="Stable Diffusion 1.5">SD 1.5</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="4:3">4:3 (Standard)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Commit / Branch Button */}
            <button
              type="submit"
              disabled={isSubmitting || !promptText.trim()}
              className={`mt-2 w-full font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer ${
                branchParent
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{branchParent ? 'Creating Branch...' : 'Committing Version...'}</span>
                </>
              ) : (
                <>
                  {branchParent ? <GitBranch className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{branchParent ? `Commit Branch (Parent v${branchParent.version})` : 'Commit Prompt Version'}</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Vertical Linear Tracker Timeline (7 cols)       */}
        {/* ============================================================== */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Linear Version History & Branches</h2>
            </div>
            <button
              onClick={fetchPrompts}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Timeline List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <div className="h-6 w-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-xs">Loading prompt timeline...</p>
            </div>
          ) : prompts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No prompt versions yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter your base concept on the left and submit to start your linear version history.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 flex flex-col gap-6">
              {/* Vertical Continuous Line */}
              <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500/50 to-slate-800" />

              {prompts.map((item, index) => {
                const isLatest = index === 0;
                const formattedDate = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now';

                return (
                  <div key={item.id || index} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.parent_id
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : isLatest
                          ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-500/40 ring-4 ring-purple-500/20'
                          : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-purple-500'
                      }`}
                    >
                      {item.parent_id ? (
                        <GitBranch className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {item.version ? `v${item.version}` : `#${prompts.length - index}`}
                        </span>
                      )}
                    </div>

                    {/* Timeline Card */}
                    <div
                      className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 shadow-lg transition-all flex flex-col gap-4 backdrop-blur ${
                        item.parent_id
                          ? 'border-emerald-900/50 hover:border-emerald-700/60'
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                              item.parent_id
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : isLatest
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            Version {item.version || prompts.length - index}
                          </span>

                          {/* Branch indicator */}
                          {item.parent && (
                            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                              <GitBranch className="w-3 h-3" />
                              <span>Branched from v{item.parent.version}</span>
                            </span>
                          )}

                          {item.branch_label && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              #{item.branch_label}
                            </span>
                          )}

                          {isLatest && !item.parent_id && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              HEAD
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Branch From Here Button */}
                          <button
                            type="button"
                            onClick={() => handleBranchFrom(item)}
                            title="Branch from this prompt version"
                            className="p-1.5 rounded-lg text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-xs flex items-center gap-1 transition-colors"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium hidden sm:inline">Branch from here</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(item.id, item.prompt_text)}
                            title="Copy prompt"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px] hidden sm:inline">
                              {copiedId === item.id ? 'Copied' : 'Copy'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(item)}
                            title="Restore prompt into composer"
                            className="p-1.5 rounded-lg text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-xs flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="text-[11px] hidden sm:inline">Restore</span>
                          </button>
                        </div>
                      </div>

                      {/* Content: Prompt & Image Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Prompt Description (8 cols) */}
                        <div className="md:col-span-8 flex flex-col gap-2.5">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              Prompt Concept
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans mt-0.5 select-text">
                              {item.prompt_text}
                            </p>
                          </div>

                          {item.negative_prompt && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-rose-400/80 tracking-wider">
                                Negative
                              </span>
                              <p className="text-xs text-rose-300/70 font-mono mt-0.5">
                                {item.negative_prompt}
                              </p>
                            </div>
                          )}

                          {/* Parameter badges from JSONB settings */}
                          {item.settings && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                              {item.settings.model && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  🤖 {item.settings.model}
                                </span>
                              )}
                              {item.settings.cfg_scale !== undefined && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                                  CFG: {item.settings.cfg_scale}
                                </span>
                              )}
                              {item.settings.steps && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  Steps: {item.settings.steps}
                                </span>
                              )}
                              {item.settings.aspect_ratio && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  📐 {item.settings.aspect_ratio}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Image Output / Placeholder (4 cols) */}
                        <div className="md:col-span-4 w-full">
                          {item.image_url ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-800 group/img aspect-video sm:aspect-square bg-slate-950">
                              <img
                                src={item.image_url}
                                alt={`Generated for version ${item.version}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-2.5">
                                <a
                                  href={item.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-white flex items-center gap-1 hover:underline"
                                >
                                  <span>View High-Res</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-4 aspect-video sm:aspect-square flex flex-col items-center justify-center text-center">
                              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-2">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">Image Placeholder</span>
                              <span className="text-[9px] text-slate-600 mt-0.5">Ready for model rendering</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
