import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PromptNode from './PromptNode';
import { mapPromptsToGraph } from '../utils/promptGraphMapper';
import {
  GitBranch,
  Layers,
  ZoomIn,
  Sliders,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Info,
} from 'lucide-react';

// Default mock data illustrating a branched prompt tree
const SAMPLE_BRANCHED_PROMPTS = [
  {
    id: 'p-1',
    parent_id: null,
    version: 1,
    prompt_text: 'Outdoor cyberpunk street scene with a sleek neon futuristic motorcycle parked under rain-slicked asphalt.',
    negative_prompt: 'blurry, low quality, deformed',
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    settings: { cfg_scale: 7.0, steps: 30, model: 'SDXL Turbo', aspect_ratio: '16:9' },
    created_at: '2026-11-11T08:00:00Z',
  },
  {
    id: 'p-2',
    parent_id: 'p-1',
    version: 2,
    branch_label: 'night-alley',
    prompt_text: 'Outdoor cyberpunk street scene with sleek neon motorcycle in moody dark alley with heavy rain and purple puddles.',
    negative_prompt: 'cartoon, low-res, text',
    image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    settings: { cfg_scale: 7.5, steps: 35, model: 'SDXL Turbo', aspect_ratio: '16:9' },
    created_at: '2026-11-11T08:15:00Z',
  },
  {
    id: 'p-3',
    parent_id: 'p-1',
    version: 3,
    branch_label: 'sunset-golden-hour',
    prompt_text: 'Outdoor futuristic motorcycle on coastal highway at golden hour sunset with warm lens flare and ocean spray.',
    negative_prompt: 'dark, rainy, neon, gloomy',
    image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    settings: { cfg_scale: 8.0, steps: 40, model: 'Flux.1 Schnell', aspect_ratio: '16:9' },
    created_at: '2026-11-11T08:20:00Z',
  },
  {
    id: 'p-4',
    parent_id: 'p-2',
    version: 4,
    branch_label: 'studio-rim-lighting',
    prompt_text: 'Outdoor cyberpunk street scene with neon motorcycle, adding cinematic studio rim lighting with cyan and magenta edge highlights.',
    negative_prompt: 'flat lighting, oversaturated, bad reflection',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    settings: { cfg_scale: 9.0, steps: 45, model: 'SDXL Turbo', aspect_ratio: '16:9' },
    created_at: '2026-11-11T08:30:00Z',
  },
  {
    id: 'p-5',
    parent_id: 'p-2',
    version: 5,
    branch_label: 'anime-cel-shading',
    prompt_text: 'Anime Makoto Shinkai style cyberpunk street with glowing electric motorcycle, vibrant skies and hand-drawn line art.',
    negative_prompt: 'photorealistic, 3d render',
    image_url: null,
    settings: { cfg_scale: 8.5, steps: 28, model: 'SD 1.5 Anime', aspect_ratio: '16:9' },
    created_at: '2026-11-11T08:35:00Z',
  },
];

export default function PromptTreeVisualizer({
  prompts = SAMPLE_BRANCHED_PROMPTS,
  onSelectPrompt,
}) {
  const [direction, setDirection] = useState('LR'); // 'LR' or 'TB'
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Register custom node types
  const nodeTypes = useMemo(() => ({ promptNode: PromptNode }), []);

  // Compute graph structure using utility function
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = mapPromptsToGraph(prompts, { direction });
    return { initialNodes: nodes, initialEdges: edges };
  }, [prompts, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize state when input prompts or layout orientation changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = mapPromptsToGraph(prompts, { direction });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [prompts, direction, setNodes, setEdges]);

  // Handle node selection
  const handleNodeClick = useCallback(
    (_, node) => {
      setSelectedPrompt(node.data);
      if (onSelectPrompt) onSelectPrompt(node.data);
    },
    [onSelectPrompt]
  );

  const handleCopyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      {/* Top Toolbar */}
      <div className="z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            Prompt Version Tree Graph
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {prompts.length} nodes
          </span>
        </div>

        {/* Layout Orientation Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">Orientation:</span>
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setDirection('LR')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                direction === 'LR'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Horizontal (LR)
            </button>
            <button
              onClick={() => setDirection('TB')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                direction === 'TB'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vertical (TB)
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          {/* Subtle grid background */}
          <Background color="#334155" gap={24} size={1} />

          {/* Standard navigation controls */}
          <Controls
            className="!bg-slate-900 !border-slate-800 !rounded-lg !overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800"
          />

          {/* MiniMap */}
          <MiniMap
            nodeStrokeColor="#7c3aed"
            nodeColor="#1e1b4b"
            maskColor="rgba(15, 23, 42, 0.75)"
            className="!bg-slate-950 !border !border-slate-800 !rounded-xl overflow-hidden"
          />
        </ReactFlow>

        {/* Inspector Panel for Clicked Node */}
        {selectedPrompt && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur flex flex-col justify-between z-20 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                    Version v{selectedPrompt.version}
                  </span>
                  {selectedPrompt.branch_label && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                      #{selectedPrompt.branch_label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Full Prompt Text */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Full Prompt Text
                  </span>
                  <button
                    onClick={() => handleCopyPrompt(selectedPrompt.prompt_text)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedPrompt.prompt_text}
                </p>
              </div>

              {/* Negative Prompt */}
              {selectedPrompt.negative_prompt && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400/80 tracking-wider">
                    Negative Prompt
                  </span>
                  <p className="text-xs text-rose-300/80 font-mono bg-rose-950/20 p-2 rounded border border-rose-900/30 mt-1">
                    {selectedPrompt.negative_prompt}
                  </p>
                </div>
              )}

              {/* JSONB Settings */}
              {selectedPrompt.settings && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Generation Settings (JSONB)
                  </span>
                  <div className="mt-1 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                    {Object.entries(selectedPrompt.settings).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-purple-300">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {selectedPrompt.image_url && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Image Output
                  </span>
                  <div className="rounded-lg overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                    <img
                      src={selectedPrompt.image_url}
                      alt="Prompt Output"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center font-mono">
              <span>Parent: {selectedPrompt.parent_id ? selectedPrompt.parent_id.slice(0, 8) + '...' : 'Root'}</span>
              <span>ID: {selectedPrompt.id.slice(0, 8)}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
