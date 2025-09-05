'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Brain, LogOut, Plus, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';
import LoadingSpinner from '@/components/LoadingSpinner';
import EnvironmentBadge from '@/components/EnvironmentBadge';

interface Note {
  id: string;
  text: string;
  ownerUid: string;
  createdAt: Timestamp;
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Load notes from Firestore
  useEffect(() => {
    if (!user) return;

    const notesRef = collection(db, 'notes_demo');
    const q = query(
      notesRef,
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        notesData.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(notesData);
      setLoadingNotes(false);
    }, (error) => {
      console.error('Error fetching notes:', error);
      setLoadingNotes(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'notes_demo'), {
        text: noteText.trim(),
        ownerUid: user.uid,
        createdAt: Timestamp.now(),
      });
      setNoteText('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">TutorAI Dashboard</h1>
              </div>
              <EnvironmentBadge />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-5 w-5" />
                <span className="text-sm">{user?.displayName || user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Welcome Section */}
          <div className="lg:col-span-3">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {user?.displayName || 'Student'}! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                This is your TutorAI dashboard. Below you can test the Firestore integration 
                by creating and viewing demo notes.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Last login: {new Date().toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>User ID: {user?.uid?.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Note Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Add Demo Note</span>
              </h3>
              
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label htmlFor="noteText" className="block text-sm font-medium text-gray-700 mb-1">
                    Note Text
                  </label>
                  <textarea
                    id="noteText"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="input resize-none"
                    rows={4}
                    placeholder="Enter your demo note here..."
                    required
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={loading || !noteText.trim()}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Add Note'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Demo Notes ({notes.length})
              </h3>
              
              {loadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No notes yet</p>
                  <p>Create your first demo note to test Firestore integration!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-gray-900 mb-2">{note.text}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(note.createdAt)}</span>
                        </span>
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                          {note.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Future Features Preview */}
        <div className="mt-12">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Coming Soon</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'AI Socratic Tutor',
                  description: 'Interactive math tutoring sessions with AI-powered Socratic questioning',
                  status: 'In Development'
                },
                {
                  title: 'Progress Tracking',
                  description: 'Detailed analytics and progress reports for students and parents',
                  status: 'Planned'
                },
                {
                  title: 'MOE Curriculum',
                  description: 'Full Primary 6 mathematics curriculum integration',
                  status: 'Planned'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded">
                    {feature.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}