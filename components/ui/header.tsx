"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Logo from "./logo";
import ProfilePopup from "./ProfilePopup";
import NotificationBell from "@/app/components/NotificationBell";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation items based on user role
  const getNavItems = () => {
    // Common items for all users
    const commonItems = [
      { name: 'Home', href: '/' },
      { name: 'Conversation', href: '/conversation' },
    ];
    
    // Items only for students (non-doctors)
    const studentItems = [
      { name: 'Fitness Tracker', href: '/fitness-tracker' },
      { name: 'Mood Tracker', href: '/mood-tracker' },
      { name: 'Journal', href: '/journal' },
      { name: 'AI Therapist', href: '/ai-therapist' },
      { name: 'Medical Assistance', href: '/medical-assistance' },
      { name: 'My Appointments', href: '/my-appointments' },
      { name: 'Resources', href: '/resources' },
    ];
    
    // Items only for doctors
    const doctorItems = [
      { name: 'Doctor Dashboard', href: '/doctor-dashboard' },
    ];
    
    // Items only for non-logged in users
    const publicItems = [
      { name: 'Doctor Login', href: '/doctor-login' },
      { name: 'Doctor Registration', href: '/doctor-register' },
    ];
    
    // Return appropriate items based on user role
    if (session?.user?.role === 'doctor') {
      return [...commonItems, ...doctorItems];
    } else if (session) {
      return [...commonItems, ...studentItems];
    } else {
      return [...commonItems, ...studentItems, ...publicItems];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-30 w-full bg-gray-900 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side items */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell (only for logged in users) */}
            {session && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}

            {/* User menu or sign in links */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700"
                >
                  <span className="hidden sm:block">{session.user?.name || "User"}</span>
                  <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                </button>
                <ProfilePopup
                  username={session.user?.name || "User"}
                  isOpen={isProfileOpen}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/signin"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 rounded-md"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
