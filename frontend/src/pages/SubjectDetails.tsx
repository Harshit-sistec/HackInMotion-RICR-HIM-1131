import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, Upload, Search, FileText, Calendar, Activity, Check, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';
import { useToast } from '@/store/ToastContext';
import { TopicMindMap } from '@/components/mindmap/TopicMindMap';

interface Subject {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  file_path: string;
  file_size?: number;
  analysis_status?: string;
}

interface SearchResult {
  question_text: string;
  year?: number;
  similarity: number;
}

export function SubjectDetails() {
  const { id: subjectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'mindmap' | 'materials' | 'search'>('mindmap');
  const [loading, setLoading] = useState(true);

  // Upload/Processing state
  const [uploading, setUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!subjectId) return;
    try {
      // Get Subject
      const { data: subj } = await api.from('subjects').select('*').eq('id', subjectId).maybeSingle();
      if (!subj) {
        showToast('Subject not found.', 'error');
        navigate('/app/subjects');
        return;
      }
      setSubject(subj);

      // Get Documents
      const { data: docs } = await api.from('documents').select('*').eq('subject_id', subjectId);
      setDocuments(docs || []);
      
      // Determine if there are topics extracted already
      const { count: topicsCount } = await api.from('topics').select('*', { count: 'exact', head: true }).eq('subject_id', subjectId);
      if (!topicsCount || topicsCount === 0) {
        setActiveTab('materials');
      }

    } catch (err: any) {
      console.error(err);
      showToast('Error loading subject details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [subjectId, navigate]);

  useEffect(() => {
    fetchData();
  }, [subjectId, fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subjectId) return;

    setUploading(true);
    setProcessingProgress(0);
    setProcessingStatus('Uploading file to storage...');

    try {
      // 1. Upload to storage bucket 'documents'
      const { data: uploadData, error: uploadErr } = await api.storage
        .from('documents')
        .upload(`${subjectId}/${file.name}`, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      setProcessingStatus('Registering document...');

      // 2. Insert document record
      const { data: docRecord, error: insertErr } = await api.from('documents').insert({
        subject_id: subjectId,
        name: file.name,
        type: file.type || 'application/pdf',
        file_path: uploadData?.path || file.name,
        file_size: file.size,
        analysis_status: 'pending',
        upload_status: 'completed',
      }).single();

      if (insertErr) throw insertErr;

      setProcessingStatus('Queueing background AI analysis...');
      
      // 3. Trigger analysis function
      await api.functions.invoke('analyze-documents', { body: { subjectId } });

      // 4. Poll progress loop
      const sessionId = docRecord?.id || `session_${Date.now()}`;
      let checkInterval = setInterval(async () => {
        try {
          // Keep processing queue moving forward (acts as the client job worker)
          await api.functions.invoke('client-job-trigger', { body: { subjectId, sessionId } });

          // Check status
          const { data: progressData } = await api.functions.invoke('check-analysis-progress', {
            body: { subjectId, sessionId }
          });

          if (progressData) {
            setProcessingProgress(progressData.progress || 10);
            setProcessingStatus(`Analyzing contents... ${progressData.progress || 10}%`);

            if (progressData.isComplete) {
              clearInterval(checkInterval);
              setProcessingStatus('Finalizing analysis results...');
              
              await api.functions.invoke('finalize-background-analysis', {
                body: { subjectId, sessionId }
              });

              showToast('Document analyzed and mind map updated!');
              setUploading(false);
              fetchData();
              setActiveTab('mindmap');
            }
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 3000);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'File upload and analysis failed.', 'error');
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !subjectId) return;

    setSearching(true);
    try {
      const { data, error } = await api.functions.invoke('semantic-search', {
        body: {
          subjectId,
          query: searchQuery.trim()
        }
      });

      if (error) throw error;
      setSearchResults(data?.results || []);
    } catch (err: any) {
      showToast(err.message || 'Semantic search failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/app/tutor?topicId=${topicId}&subjectId=${subjectId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!subject) return null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
          <Link to="/app/subjects" className="text-xs font-bold text-ink-500 hover:text-primary-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to subjects
          </Link>
        </div>

        <PageHeader
          title={subject.name}
          subtitle={subject.description || 'Subject learning space'}
          action={
            <div 
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: subject.color || '#2563EB' }}
            >
              <BookOpen size={20} />
            </div>
          }
        />

        {/* Upload overlay progress */}
        {uploading && (
          <Card className="mb-6 p-6 border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-9 w-9 bg-primary-100 dark:bg-ink-800 rounded-xl flex items-center justify-center text-primary-600 animate-pulse">
                <Brain size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-ink-900 dark:text-ink-50">{processingStatus}</h4>
                <p className="text-xs text-ink-500">Please keep this tab open while the AI extracts study topics.</p>
              </div>
              <Badge tone="primary">{processingProgress}%</Badge>
            </div>
            <div className="w-full h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full transition-all duration-300" style={{ width: `${processingProgress}%` }} />
            </div>
          </Card>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-ink-100 dark:border-ink-800 mb-6">
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'mindmap' 
                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            Mind Map
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'materials' 
                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            Materials
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'search' 
                ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            Question Search
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'mindmap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Interactive Concept Map</span>
              <Badge tone="success"><Brain size={11} /> AI Generated</Badge>
            </div>
            <TopicMindMap subjectId={subjectId!} onTopicClick={handleTopicClick} />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Documents List */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">Course Materials</h3>
              
              {documents.length === 0 ? (
                <div className="py-8 text-center text-ink-400 border border-dashed rounded-3xl p-6">
                  No materials uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-100 dark:bg-ink-800 rounded-xl flex items-center justify-center text-slate-500">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink-900 dark:text-ink-50 truncate max-w-sm">{doc.name}</p>
                          <p className="text-[10px] text-ink-500">
                            {(doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.analysis_status === 'completed' ? (
                          <Badge tone="success"><Check size={10} /> Analyzed</Badge>
                        ) : (
                          <Badge tone="warning"><Activity size={10} /> Processing</Badge>
                        )}
                        
                        <a 
                          href={`${api.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="xs" variant="outline">View</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload form */}
            <div>
              <Card className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-4">Upload PDF</h3>
                <div className="border border-dashed border-ink-200 dark:border-ink-800 hover:border-primary-400 rounded-2xl p-6 text-center transition cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="mx-auto text-ink-400 group-hover:text-primary-500 mb-3 transition" />
                  <p className="text-xs font-bold text-ink-800 dark:text-ink-100">Click or Drag to Upload</p>
                  <p className="text-[10px] text-ink-500 mt-1">Supports PDF or Text files (Max 50MB)</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500 mb-4">Search Exam Database</h3>
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search previous year exam questions..."
                  />
                </div>
                <Button type="submit" loading={searching}>
                  <Search size={15} /> Search
                </Button>
              </form>
            </Card>

            {/* Search Results */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Search Results</span>
              
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-ink-400 border border-dashed rounded-3xl p-6 bg-slate-50/20">
                  Search for exam patterns or specific questions.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((res, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 rounded-2xl shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {res.year && <Badge tone="primary">{res.year} Exam</Badge>}
                          <Badge tone="accent">Similarity: {Math.round(res.similarity * 100)}%</Badge>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-850 dark:text-ink-100 whitespace-pre-wrap">
                        {res.question_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
