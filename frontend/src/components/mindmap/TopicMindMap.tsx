import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/components/mindmap/mindmap-controls.css';
import { api } from '@/services/api';
import GlassNode from '@/components/mindmap/GlassNode';

interface Topic {
  id: string;
  name: string;
  frequency_count: number;
  relevance_count: number;
  subtopics: string[];
  position_x: number;
  position_y: number;
}

interface TopicMindMapProps {
  subjectId: string;
  onTopicClick: (topicId: string) => void;
}

const nodeTypes = {
  glassNode: GlassNode,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const listener = () => setIsMobile(media.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return isMobile;
}

const createSmartEdges = (topics: Topic[]): Edge[] => {
  const edges: Edge[] = [];
  
  const validTopics = topics
    .filter(t => t.frequency_count > 0)
    .sort((a, b) => b.frequency_count - a.frequency_count);
  
  if (validTopics.length < 2) return edges;
  
  for (let i = 0; i < validTopics.length - 1; i++) {
    const currentTopic = validTopics[i];
    const nextTopic = validTopics[i + 1];
    
    const connectionStrength = Math.min(
      (currentTopic.frequency_count + nextTopic.frequency_count) / 15, 
      2
    );
    
    edges.push({
      id: `${currentTopic.id}-${nextTopic.id}`,
      source: currentTopic.id,
      target: nextTopic.id,
      type: 'smoothstep',
      animated: connectionStrength > 1,
      style: {
        stroke: '#64748b',
        strokeWidth: Math.max(2, connectionStrength),
        opacity: 0.9,
        filter: 'drop-shadow(0 1px 3px rgba(100, 116, 139, 0.3))',
      },
      data: { strength: connectionStrength }
    });
  }
  
  return edges;
};

const calculateRelevancePoints = (frequency: number, relevance: number): number => {
  const baseScore = frequency * 10;
  const relevanceBonus = Math.max(0, (relevance - frequency) * 5);
  return Math.min(100, Math.max(0, baseScore + relevanceBonus));
};

export function TopicMindMap({ subjectId, onTopicClick }: TopicMindMapProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const isMobile = useIsMobile();

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: topicsData, error: topicsError } = await api
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .gt('frequency_count', 0)
        .order('frequency_count', { ascending: false });

      if (topicsError) {
        throw new Error(`Failed to fetch topics: ${topicsError.message}`);
      }

      if (!topicsData || topicsData.length === 0) {
        setError('No topics found. Please upload and analyze documents first.');
        return;
      }

      const transformedTopics = topicsData.map((topic: any) => ({
        ...topic,
        subtopics: Array.isArray(topic.subtopics) 
          ? topic.subtopics.map(st => String(st))
          : []
      }));
      setTopics(transformedTopics);

    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  const createEnhancedNodes = useMemo(() => {
    if (!topics.length) return [];

    const sortedTopics = [...topics].sort((a, b) => b.frequency_count - a.frequency_count);

    return sortedTopics.map((topic, index) => {
      const relevancePoints = calculateRelevancePoints(
        topic.frequency_count, 
        topic.relevance_count
      );
      
      const baseSize = 120;
      const nodeWidth = baseSize;

      const isEven = index % 2 === 0;
      const x = isEven ? 80 : 280; 
      const y = 30 + index * 90; 

      return {
        id: topic.id,
        type: 'glassNode',
        position: { x, y },
        data: {
          id: topic.id,
          label: topic.name,
          frequency: topic.frequency_count,
          importance: relevancePoints,
          description: topic.subtopics?.length > 0 
            ? `Subtopics: ${topic.subtopics.slice(0, 3).join(', ')}`
            : `Frequency: ${topic.frequency_count}, Relevance: ${topic.relevance_count}`,
          onTopicClick,
          subtopics: topic.subtopics || [],
          relevancePoints: relevancePoints
        },
        style: {
          width: nodeWidth,
          height: 50,
        },
        draggable: true,
      } as Node;
    });
  }, [topics, onTopicClick]);

  const createEnhancedEdges = useMemo(() => {
    if (!topics.length) return [];
    return createSmartEdges(topics);
  }, [topics]);

  useEffect(() => {
    setNodes(createEnhancedNodes);
    setEdges(createEnhancedEdges);
  }, [createEnhancedNodes, createEnhancedEdges, setNodes, setEdges]);

  useEffect(() => {
    if (subjectId) {
      fetchTopics();
    }
  }, [subjectId, fetchTopics]);

  useEffect(() => {
    if (!loading && topics.length === 0) {
      let retryCount = 0;
      const maxRetries = 3;
      
      const interval = setInterval(() => {
        retryCount++;
        if (retryCount >= maxRetries) {
          clearInterval(interval);
          return;
        }
        fetchTopics();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [loading, topics.length, fetchTopics]);

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-white dark:bg-ink-900 rounded-3xl border border-ink-200/70 dark:border-ink-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-500">Generating your mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-white dark:bg-ink-900 rounded-3xl border border-ink-200/70 dark:border-ink-800 p-6 text-center">
        <div className="max-w-xs mx-auto">
          <div className="text-lg mb-2">💡</div>
          <h3 className="font-semibold text-sm mb-1 text-ink-900 dark:text-ink-50">Upload materials to begin</h3>
          <p className="text-xs text-ink-500 mb-4">We will extract key concepts and map your learning route once documents are processed.</p>
          <button 
            onClick={fetchTopics}
            className="px-3.5 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition"
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] bg-slate-50 dark:bg-ink-950 rounded-3xl border border-ink-200/70 dark:border-ink-800 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        minZoom={0.1}
        maxZoom={1.5}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.3 : 0.15,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.2,
        }}
        className="bg-transparent"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background 
          color="rgba(148, 163, 184, 0.15)" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="mindmap-controls bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 rounded-xl"
        />
      </ReactFlow>
    </div>
  );
}
