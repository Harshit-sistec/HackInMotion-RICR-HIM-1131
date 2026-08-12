import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface EnhancedGlassNodeData {
  label: string;
  frequency: number;
  importance: number;
  relevancePoints?: number;
  description?: string;
  subtopics?: string[];
  onTopicClick: (id: string) => void;
  id: string;
}

interface EnhancedGlassNodeProps {
  data: EnhancedGlassNodeData;
}

const topicColors = {
  OOP: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300',
  DataStructures: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-700 dark:text-green-300',
  Algorithms: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-700 dark:text-orange-300',
  Database: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  default: 'from-primary-500/10 to-primary-500/5 border-primary-500/20 text-primary-700 dark:text-primary-300',
};

const getTopicKey = (label: string): keyof typeof topicColors => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('class') || lowerLabel.includes('object') || lowerLabel.includes('inherit')) return 'OOP';
  if (lowerLabel.includes('array') || lowerLabel.includes('list') || lowerLabel.includes('stack') || lowerLabel.includes('tree') || lowerLabel.includes('graph')) return 'DataStructures';
  if (lowerLabel.includes('algorithm') || lowerLabel.includes('sort') || lowerLabel.includes('search') || lowerLabel.includes('complexity')) return 'Algorithms';
  if (lowerLabel.includes('database') || lowerLabel.includes('sql') || lowerLabel.includes('query') || lowerLabel.includes('table')) return 'Database';
  return 'default';
};

const getImportanceLevel = (relevancePoints: number): { level: string; color: string; icon: string; tone: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' } => {
  if (relevancePoints >= 80) return { level: 'Critical', color: 'bg-red-500', icon: '🔥', tone: 'error' };
  if (relevancePoints >= 60) return { level: 'High', color: 'bg-orange-500', icon: '⭐', tone: 'warning' };
  if (relevancePoints >= 40) return { level: 'Medium', color: 'bg-yellow-500', icon: '📍', tone: 'accent' };
  if (relevancePoints >= 20) return { level: 'Low', color: 'bg-blue-500', icon: '📌', tone: 'primary' };
  return { level: 'Minimal', color: 'bg-gray-400', icon: '📋', tone: 'neutral' };
};

export default function GlassNode({ data }: EnhancedGlassNodeProps) {
  const topicKey = getTopicKey(data.label);
  const colorClass = topicColors[topicKey] || topicColors.default;
  
  const relevancePoints = data.relevancePoints || data.importance || 0;
  const importanceLevel = getImportanceLevel(relevancePoints);
  
  return (
    <div
      className="relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-20 w-[200px]"
      onClick={() => data.onTopicClick(data.id)}
    >
      {/* Frequency Badge */}
      <div className="absolute -top-3 -right-3 z-20">
        <span className="bg-slate-900 border border-slate-700 text-[10px] font-bold text-white rounded-full flex items-center justify-center min-w-[24px] h-6 px-1.5 shadow-lg">
          {data.frequency}
        </span>
      </div>

      {/* Importance Level Indicator */}
      {relevancePoints > 0 && (
        <div className="absolute -top-3 -left-3 z-20">
          <div className="bg-slate-900 border border-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg" title={`Importance: ${importanceLevel.level}`}>
            {importanceLevel.icon}
          </div>
        </div>
      )}

      {/* Main Glass Node Card */}
      <div 
        className={`relative p-3 bg-gradient-to-br ${colorClass} backdrop-blur-md border rounded-2xl flex flex-col justify-center text-center font-medium shadow-sm transition-all duration-300 group-hover:border-opacity-100 group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)] overflow-hidden`}
      >
        <div className="truncate text-xs font-bold leading-tight text-ink-900 dark:text-ink-50">
          {data.label}
        </div>
        
        {data.subtopics && data.subtopics.length > 0 ? (
          <div className="text-[9px] text-ink-500 dark:text-ink-400 truncate mt-1">
            {data.subtopics.slice(0, 2).join(', ')}
          </div>
        ) : (
          <div className="text-[9px] text-ink-500 dark:text-ink-400 mt-1">
            Relevance: {relevancePoints.toFixed(0)}%
          </div>
        )}

        {/* Handles */}
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-2 h-2 bg-slate-300 dark:bg-slate-700 border border-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-2 h-2 bg-slate-300 dark:bg-slate-700 border border-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
        />
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 min-w-[200px]">
        <div className="bg-slate-900/95 text-white border border-slate-700 rounded-xl p-2.5 shadow-xl text-left backdrop-blur-sm text-[11px]">
          <div className="font-bold text-xs mb-0.5 truncate">{data.label}</div>
          <div className="opacity-80 space-y-0.5">
            <div>Frequency: {data.frequency} | Relevance: {relevancePoints.toFixed(0)}%</div>
            <div>Importance: {importanceLevel.level}</div>
            {data.subtopics && data.subtopics.length > 0 && (
              <div className="border-t border-slate-800 pt-1 mt-1">
                <span className="font-bold">Subtopics:</span> {data.subtopics.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
