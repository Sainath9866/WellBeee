'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GoogleSignInButton() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signIn('google', {
        callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (session) return null;

  return (
    <button 
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-800 text-white rounded-lg border border-gray-700 transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
      }`}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <img src="/google.svg" alt="Google" className="w-5 h-5 filter invert" />
      )}
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}
