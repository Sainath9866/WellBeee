import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from './mongodb';
import User from '@/models/User';

declare module "next-auth" {
  interface User {
    role?: string;
    provider?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      provider?: string;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Check if user was created with Google
        if (user.provider === 'google') {
          throw new Error('Please sign in with Google');
        }

        // Check password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          provider: 'credentials'
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/signin',
    error: '/signin'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.provider = account?.provider || user.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false;
      }

      try {
        await dbConnect();
        
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Only allow new user creation through Google
          if (account?.provider === 'google') {
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
              role: 'user',
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10) // Generate random password for Google users
            });
            
            if (!newUser) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          // Check if the user is trying to use the correct auth method
          if (account?.provider !== existingUser.provider) {
            if (existingUser.provider === 'google') {
              throw new Error('Please sign in with Google');
            } else {
              throw new Error('Please sign in with email and password');
            }
          }
          
          // Update Google user info if needed
          if (account?.provider === 'google') {
            if (existingUser.image !== user.image || existingUser.name !== user.name) {
              existingUser.image = user.image;
              existingUser.name = user.name;
              await existingUser.save();
            }
          }
        }
        
        return true;
      } catch (error: any) {
        console.error('Sign in error:', error);
        throw new Error(error.message || 'Authentication failed');
      }
    }
  }
}; 