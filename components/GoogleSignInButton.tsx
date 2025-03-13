'use client';

import { signIn, useSession } from 'next-auth/react';

export default function GoogleSignInButton() {
  const { data: session } = useSession();

  const handleGoogleSignIn = () => {
    signIn('google', {
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!session && (
        <button 
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white text-gray-800 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <img src="/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      )}
    </div>
  );
}
