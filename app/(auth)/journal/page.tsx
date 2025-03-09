"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface JournalEntry {
  _id: string;
  title: string;
  thoughts: string;
  tags: string[];
  mood: string;
  createdAt: string;
}

export default function Journal() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryContent, setEntryContent] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState("Neutral");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/journal');
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/user/journal', {
        title: entryTitle,
        thoughts: entryContent,
        tags,
        mood
      });
      
      setEntryTitle("");
      setEntryContent("");
      setTags("");
      setMood("Neutral");
      setShowEntryForm(false);
      fetchEntries();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      setError('Failed to save journal entry');
    }
  };

  const filteredEntries = entries
    .filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.title.toLowerCase().includes(searchLower) ||
        entry.thoughts.toLowerCase().includes(searchLower) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

  const moods = ['Happy', 'Sad', 'Anxious', 'Excited', 'Neutral', 'Stressed', 'Calm'];
  const moodEmojis: { [key: string]: string } = {
    Happy: '😊',
    Sad: '😢',
    Anxious: '😰',
    Excited: '🤩',
    Neutral: '😐',
    Stressed: '😫',
    Calm: '😌'
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 pt-20">
          <h1 className="text-4xl font-bold">Welcome to Your Personal Journal</h1>
          <p className="text-xl text-gray-400">
            A safe space to express your thoughts, track your emotions, and reflect on your journey.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowWelcome(false);
                setShowEntryForm(true);
              }}
              className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Start Your First Entry
            </button>
            <p className="text-sm text-gray-500">
              Your thoughts are private and secure
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-6xl">
        <div className="py-3 md:py-7 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold">Personal Journal</h1>
            <button 
              onClick={() => setShowEntryForm(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              New Entry
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none pl-10"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Entry Form Modal */}
          {showEntryForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold">New Journal Entry</h2>
                  <button 
                    onClick={() => setShowEntryForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Entry Title"
                      value={entryTitle}
                      onChange={(e) => setEntryTitle(e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Write your thoughts..."
                      value={entryContent}
                      onChange={(e) => setEntryContent(e.target.value)}
                      rows={6}
                      className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Add tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">How are you feeling?</label>
                    <div className="flex gap-2 flex-wrap">
                      {moods.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMood(m)}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm ${
                            mood === m 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <span>{moodEmojis[m]}</span>
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEntryForm(false)}
                      className="flex-1 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Entry Detail Modal */}
          {showEntryDetail && selectedEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{selectedEntry.title}</h2>
                    <span className="text-2xl">{moodEmojis[selectedEntry.mood]}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowEntryDetail(false);
                      setSelectedEntry(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="text-sm text-gray-400">
                    {new Date(selectedEntry.createdAt).toLocaleString()}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedEntry.thoughts}</p>
                  {selectedEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Journal Entries Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-orange-500">Loading...</div>
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry._id} 
                  className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowEntryDetail(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">{entry.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{moodEmojis[entry.mood]}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-3 line-clamp-3">{entry.thoughts}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                          +{entry.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'No entries found matching your search' : 'No journal entries yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
