import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Sparkles, Image as ImageIcon } from 'lucide-react';

/**
 * Custom React Flow Node representing a Prompt Version in the tree graph.
 */
function PromptNodeComponent({ data, selected }) {
  const isLR = data.direction !== 'TB';
  const targetPosition = isLR ? Position.Left : Position.Top;
  const sourcePosition = isLR ? Position.Right : Position.Bottom;

  // Truncate snippet of prompt text
  const snippet = data.prompt_text
    ? data.prompt_text.length > 90
      ? data.prompt_text.slice(0, 90) + '...'
      : data.prompt_text
    : 'No prompt text';

  return (
    <div
      className={`group relative w-[260px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur transition-all duration-200 ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-purple-500/20'
          : data.isRoot
          ? 'border-purple-500/60 hover:border-purple-400'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Target Handle (incoming edge from parent prompt) */}
      {!data.isRoot && (
        <Handle
          type="target"
          position={targetPosition}
          className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-purple-500 transition-transform group-hover:scale-125"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 text-[11px] font-bold rounded-md font-mono ${
              data.isRoot
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
            }`}
          >
            {data.version ? `v${data.version}` : 'v1'}
          </span>

          {data.isRoot ? (
            <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Root
            </span>
          ) : data.branch_label ? (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
              <GitBranch className="w-2.5 h-2.5" />
              <span className="truncate max-w-[80px]">{data.branch_label}</span>
            </span>
          ) : null}
        </div>

        {/* CFG Scale badge */}
        {data.settings?.cfg_scale !== undefined && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
            CFG {data.settings.cfg_scale}
          </span>
        )}
      </div>

      {/* Prompt Snippet & Image Thumbnail */}
      <div className="flex items-start gap-2.5">
        <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3 flex-1 select-none">
          "{snippet}"
        </p>

        {data.image_url ? (
          <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-950">
            <img
              src={data.image_url}
              alt={`Thumbnail v${data.version}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg border border-dashed border-slate-800 flex-shrink-0 bg-slate-950/60 flex items-center justify-center text-slate-600">
            <ImageIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Model & Parameter footer */}
      {data.settings?.model && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>🤖 {data.settings.model}</span>
          {data.settings.aspect_ratio && <span>{data.settings.aspect_ratio}</span>}
        </div>
      )}

      {/* Source Handle (outgoing edge to child branches) */}
      <Handle
        type="source"
        position={sourcePosition}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-indigo-500 transition-transform group-hover:scale-125"
      />
    </div>
  );
}

export default memo(PromptNodeComponent);
