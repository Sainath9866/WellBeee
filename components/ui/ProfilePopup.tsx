"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface ProfilePopupProps {
  username: string;
  isOpen: boolean;
}

export default function ProfilePopup({ username, isOpen }: ProfilePopupProps) {
  const handleSignOut = async () => {
    // Clear Google session data first
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Then sign out from NextAuth with specific configuration
    await signOut({ 
      redirect: true,
      callbackUrl: '/',
    });

    // Clear any remaining session data from localStorage
    localStorage.removeItem('googleOAuth');
    sessionStorage.clear();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-48 rounded-md bg-gray-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
      <div className="px-4 py-2 text-sm text-gray-300">{username}</div>
      <Link href="/profile/update" className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800">
        Update Profile
      </Link>
      <button
        onClick={handleSignOut}
        className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  );
}
