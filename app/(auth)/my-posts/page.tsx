'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiTrash, FiArrowLeft } from 'react-icons/fi';

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

export default function MyPostsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    try {
      const response = await fetch('/api/user/post/bulk');
      const data = await response.json();

      if (!Array.isArray(data)) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      const userPosts = data.filter((post: Post) => 
        post?.userId?.email === session?.user?.email
      );
      
      setPosts(userPosts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      setIsLoading(false);
    }
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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/conversation" 
            className="text-gray-400 hover:text-white"
          >
            <FiArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-400">You haven't created any posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Image
                  src={post.userId.image || '/default-avatar.png'}
                  alt={post.userId.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{post.userId.name}</span>
                      <span className="text-gray-400 text-sm">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-red-400">
                      <FiTrash />
                    </button>
                  </div>
                  <p className="text-gray-200 mt-2">{post.content}</p>
                  <div className="flex items-center space-x-6 mt-4 text-gray-400">
                    <Link href={`/post/${post._id}`} className="flex items-center space-x-2 hover:text-white">
                      <FiMessageCircle />
                      <span>{post.replies.length}</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <FiHeart />
                      <span>{post.likes.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
