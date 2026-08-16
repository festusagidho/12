/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AgentLog } from '../types';
import { Shield, BrainCircuit, Activity, Cpu, CheckCircle, Search, RefreshCw, Layers } from 'lucide-react';

interface GiaAgentGridProps {
  agents: AgentLog[];
  isScanning: boolean;
}

export default function GiaAgentGrid({ agents, isScanning }: GiaAgentGridProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('master_decision');

  const currentAgent = (agents && agents.length > 0)
    ? (agents.find((a) => a.id === selectedAgent) || agents[0])
    : null;

  const formattedTimestamp = currentAgent?.timestamp && typeof currentAgent.timestamp === 'string'
    ? (currentAgent.timestamp.length >= 19 ? currentAgent.timestamp.substring(11, 19) : currentAgent.timestamp)
    : '12:00:00';

  // Helper icons for specific agents to enrich visual polish
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'master_decision':
        return <BrainCircuit className="w-4 h-4 text-amber-400" />;
      case 'risk_management':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'tech_analysis':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'web_intel':
      case 'news_intel':
        return <Search className="w-4 h-4 text-cyan-400" />;
      default:
        return <Cpu className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full backdrop-blur-xl shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="font-display font-semibold text-lg text-white">AI Agent Command Center</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 px-2.5 rounded-full border border-slate-800/60 font-mono text-[10px] text-slate-400">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>14 Active Node Agents</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[350px]">
        {/* Left Agent Directory Panel */}
        <div className="lg:col-span-5 flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgent;
            return (
              <button
                key={agent.id}
                id={`agent-btn-${agent.id}`}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md text-white'
                    : 'bg-slate-950/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-2 font-display text-xs font-semibold">
                    {getAgentIcon(agent.id)}
                    <span className={isSelected ? 'text-amber-400' : ''}>{agent.name}</span>
                  </div>
                  {/* Status lights */}
                  <div className="flex items-center gap-1">
                    {isScanning ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    <span className="text-[9px] font-mono opacity-80 uppercase">
                      {isScanning ? 'RUNNING' : 'ONLINE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-500">
                  <span className="truncate max-w-[150px]">{agent.role}</span>
                  <span className="text-slate-400 font-bold bg-slate-950 p-0.5 px-1 rounded">
                    Weight: {agent.influence}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Terminal Console */}
        <div className="lg:col-span-7 bg-slate-950/90 rounded-2xl border border-slate-800 p-4 font-mono text-xs flex flex-col justify-between h-full relative overflow-hidden shadow-inner min-h-[220px]">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3 z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500 text-[10px] ml-2">TERMINAL_SECURE_CHANNEL://{currentAgent?.id || 'master_decision'}</span>
            </div>
            <div className="text-slate-400 text-[10px]">influence_weight: {currentAgent?.influence || 0}.00%</div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 z-10 max-h-[250px]">
            <div>
              <span className="text-slate-500">[ROLE DEFINITION]</span>
              <p className="text-slate-300 mt-1 leading-relaxed">{currentAgent?.role || 'System Agent'}</p>
            </div>

            <div>
              <span className="text-amber-500/80">[AGENT INTERNAL LOGIC & THOUGHT PROCESS]</span>
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg mt-1 text-slate-200 font-mono leading-relaxed relative">
                {isScanning ? (
                  <div className="flex items-center gap-2 py-2">
                    <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-amber-400">Recalculating vectors for target scenario...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-emerald-500 mr-1.5">✔</span>
                    {currentAgent?.thought || 'Node active and monitoring order flow.'}
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500">[METRICS SUMMARY]</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10px] text-slate-400">
                <div className="bg-slate-900/30 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-500 block">LAST CALIBRATION</span>
                  <span className="text-slate-300">{formattedTimestamp} UTC</span>
                </div>
                <div className="bg-slate-900/30 p-1.5 rounded border border-slate-900">
                  <span className="text-slate-500 block">DECISION INFLUENCE</span>
                  <span className="text-amber-400 font-bold">{currentAgent?.influence || 0}% relative weight</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer simulation */}
          <div className="border-t border-slate-900 pt-2 mt-3 flex items-center justify-between text-[10px] text-slate-500 z-10">
            <span>CORE NODE VERIFICATION: SECURE</span>
            <span>SYSTEM ACCURACY: {(75 + (currentAgent?.influence || 0) * 0.5).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
