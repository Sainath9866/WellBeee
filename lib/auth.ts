import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from './mongodb';
import User from '@/models/User';

declare module "next-auth" {
  interface User {
    role?: string;
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

        // Check password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
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
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user'
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        console.error('No email provided');
        return false;
      }

      try {
        await dbConnect();
        
        // Check if user exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // For Google sign in, create a new user
          if (account?.provider === 'google') {
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
              role: 'user'
            });
            
            try {
              await newUser.save();
              console.log('New user registered:', user.email);
            } catch (saveError) {
              console.error('Error saving new user:', saveError);
              return false;
            }
          } else {
            // For credentials sign in, don't auto-create users
            console.error('User not found for credentials sign in');
            return false;
          }
        } else {
          // Update existing user info if using Google
          if (account?.provider === 'google') {
            try {
              if (existingUser.image !== user.image || existingUser.name !== user.name) {
                existingUser.image = user.image;
                existingUser.name = user.name;
                await existingUser.save();
              }
            } catch (updateError) {
              console.error('Error updating user:', updateError);
              // Still allow login even if update fails
            }
          }
          
          // If user exists but trying to use different auth method
          if (account?.provider === 'credentials' && existingUser.provider === 'google') {
            console.error('Please sign in with Google');
            return false;
          }
          if (account?.provider === 'google' && existingUser.provider === 'credentials') {
            console.error('Please sign in with email and password');
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    }
  }
}; 