import React, { useState } from 'react';
import LinearPromptTracker from './components/LinearPromptTracker';
import PromptTreeVisualizer from './components/PromptTreeVisualizer';
import { Layers, GitFork } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('tracker'); // 'tracker' | 'graph'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sub-navigation view toggle pill */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          AI Prompt Version Control System & Visualization
        </div>

        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveView('tracker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === 'tracker'
                ? 'bg-purple-600 text-white font-medium shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Linear Tracker</span>
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === 'graph'
                ? 'bg-purple-600 text-white font-medium shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>React Flow Tree Graph</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1">
        {activeView === 'tracker' ? (
          <LinearPromptTracker projectId="proj_linear_tracker_01" />
        ) : (
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Interactive Prompt Branch Tree</h2>
              <p className="text-xs text-slate-400">
                Visualizing hierarchical prompt iterations derived from PostgreSQL parent_id relationships. Click any node to inspect parameters.
              </p>
            </div>
            <PromptTreeVisualizer />
          </div>
        )}
      </div>
    </div>
  );
}
