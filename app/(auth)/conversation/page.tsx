'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FiPlus, FiHeart, FiMessageCircle, FiTrash } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Post = {
  _id: string;
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image: string;
  };
  likes: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  replies: Array<{
    _id: string;
    content: string;
    userId: {
      name: string;
      email: string;
      image: string;
    };
    likes: Array<any>;
  }>;
  createdAt: string;
};

export default function ConversationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/user/post/bulk');
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Expected array of posts but got:', data);
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Filter out user's own posts
      const postsFromOthers = data.filter((post: Post) => 
        post?.userId?.email !== session?.user?.email
      );
      
      setPosts(postsFromOthers);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      // Log the session status
      console.log('Session status:', session);

      const response = await fetch('/api/user/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to create post:', data);
        // You could add a toast notification here
        return;
      }

      setNewPostContent('');
      setIsModalOpen(false);
      await fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleViewThread = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Community Posts</h1>
          <Link 
            href="/my-posts" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            My Posts
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-400">No community posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Image
                  src={post.userId.image || '/default-avatar.png'}
                  alt={post.userId.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{post.userId.name}</span>
                    <span className="text-gray-400 text-sm">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-200 mt-2">{post.content}</p>
                  <div className="flex items-center space-x-6 mt-4 text-gray-400">
                    <button 
                      onClick={() => handleViewThread(post._id)}
                      className="cursor-pointer flex items-center space-x-2 hover:text-blue-400"
                    >
                      <FiMessageCircle />
                      <span>{post.replies.length}</span>
                    </button>
                    <button className="cursor-pointer flex items-center space-x-2 hover:text-red-400">
                      <FiHeart />
                      <span>{post.likes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer fixed bottom-6 right-60 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg"
      >
        <FiPlus className="text-xl" />
      </button>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Create a Post</h2>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}