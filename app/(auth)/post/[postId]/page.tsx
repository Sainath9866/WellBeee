'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiArrowLeft } from 'react-icons/fi';
import { useParams } from 'next/navigation';

export default function ThreadPage() {
  const { postId } = useParams();
  const { data: session } = useSession();
  const [thread, setThread] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchThread();
  }, [postId]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/user/post/thread/${postId}`);
      const data = await response.json();
      setThread(data.thread);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching thread:', error);
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/user/post/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent }),
      });

      if (response.ok) {
        setReplyContent('');
        await fetchThread(); // Refresh the thread
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  if (!thread) {
    return <div>Post not found</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/conversation" className="text-gray-400 hover:text-white">
            <FiArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Thread</h1>
        </div>

        {/* Parent Post */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Image
              src={thread.userId.image || '/default-avatar.png'}
              alt={thread.userId.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">{thread.userId.name}</span>
                <span className="text-gray-400 text-sm">
                  {new Date(thread.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-200 mt-2">{thread.content}</p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="mb-6">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reply
          </button>
        </form>

        {/* Replies */}
        <div className="space-y-4">
          {thread.replies.map((reply: any) => (
            <div key={reply._id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Image
                  src={reply.userId.image || '/default-avatar.png'}
                  alt={reply.userId.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{reply.userId.name}</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-200 mt-2">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
