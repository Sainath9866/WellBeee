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
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/signin',
    error: '/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;  // Save user ID in session
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // Only run database operations when using OAuth providers
        if (account?.provider === 'google') {
          await dbConnect();
          
          // Check if this user already exists in our database
          const userExists = await User.findOne({ email: user.email });
          
          if (!userExists) {
            // Create a new user document
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google'
            });
            
            await newUser.save();
            console.log('New user registered:', user.email);
          } else {
            // Optionally update user info if changed
            if (userExists.image !== user.image || userExists.name !== user.name) {
              userExists.image = user.image;
              userExists.name = user.name;
              await userExists.save();
            }
            console.log('Existing user logged in:', user.email);
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        // Still allow sign in even if database operations fail
        return true;
      }
    }
  }
}; 