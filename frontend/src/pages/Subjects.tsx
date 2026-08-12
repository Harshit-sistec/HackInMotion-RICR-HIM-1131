import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Folder, FolderPlus, ArrowRight, Trash2, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';

interface Subject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  documentsCount?: number;
  topicsCount?: number;
}

const COLORS = [
  { value: '#2563EB', label: 'Blue' },
  { value: '#16A34A', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#DC2626', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
];

export function Subjects() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: subjectsData, error } = await api
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch additional counts (documents count) for each subject
      const enriched = await Promise.all(
        (subjectsData || []).map(async (subj: any) => {
          const { count: docsCount } = await api
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subj.id);
            
          const { count: topicsCount } = await api
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subj.id);

          return {
            ...subj,
            documentsCount: docsCount || 0,
            topicsCount: topicsCount || 0,
          };
        })
      );

      setSubjects(enriched);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Could not load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await api.from('subjects').insert({
        name: name.trim(),
        description: description.trim(),
        color,
        user_id: user.id,
      }).single();

      if (error) throw error;

      showToast('Subject created successfully.');
      setName('');
      setDescription('');
      setIsOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showToast(err.message || 'Failed to create subject.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this subject? All related topics and uploaded documents will be deleted.')) return;

    try {
      // Delete documents and topics first (cascading cleanup)
      await api.from('documents').delete().eq('subject_id', id);
      await api.from('topics').delete().eq('subject_id', id);
      
      const { error } = await api.from('subjects').delete().eq('id', id);
      if (error) throw error;

      showToast('Subject deleted successfully.');
      fetchSubjects();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete subject.', 'error');
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Subjects & Mind Maps"
          subtitle="Explore your subjects, upload course materials, and study interactive topic maps."
          action={
            <Button size="sm" onClick={() => setIsOpen(true)}>
              <Plus size={16} /> New Subject
            </Button>
          }
        />

        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-ink-800 flex items-center justify-center text-primary-600 mb-4">
              <Folder size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">No subjects yet</h3>
            <p className="text-sm text-ink-500 max-w-sm mb-6">
              Create your first subject, then upload documents (PDFs, study notes) to generate an AI mind map.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <FolderPlus size={16} /> Create first subject
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subj) => (
              <Link key={subj.id} to={`/app/subjects/${subj.id}`} className="group block">
                <Card hover className="h-full flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: subj.color || '#2563EB' }}
                      >
                        <BookOpen size={20} />
                      </div>
                      <button
                        onClick={(e) => handleDelete(subj.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-ink-400 hover:text-error-600 transition rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800"
                        title="Delete Subject"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink-900 group-hover:text-primary-600 transition dark:text-ink-50 leading-snug mb-1.5">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed mb-4">
                      {subj.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-ink-100 dark:border-ink-800">
                    <div className="flex gap-2">
                      <Badge tone="primary">{subj.documentsCount} documents</Badge>
                      {subj.topicsCount && subj.topicsCount > 0 ? (
                        <Badge tone="success">{subj.topicsCount} topics</Badge>
                      ) : null}
                    </div>
                    <span className="text-xs font-bold text-primary-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Create Subject Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            
            <div className="relative w-full max-w-md bg-white dark:bg-ink-900 rounded-3xl border border-ink-200/70 dark:border-ink-800 shadow-2xl p-6 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">Create New Subject</h3>
                <button onClick={() => setIsOpen(false)} className="text-ink-400 hover:text-ink-600 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">Subject Name</label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief overview of the curriculum or exam goal."
                    className="w-full min-h-[80px] rounded-xl border border-ink-200 bg-white dark:bg-ink-900 dark:border-ink-800 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">Theme Color</label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`h-8 w-8 rounded-full border-2 transition ${
                          color === c.value ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-ink-100 dark:border-ink-800">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={submitting}>
                    Create Subject
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
