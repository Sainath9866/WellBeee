import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../../lib/mongodb';
import User from '@/models/User';

// Exporting authOptions for use with getServerSession
export const authOptions: NextAuthOptions = {
  providers: [
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
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
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
        // You might want to change this depending on your requirements
        return true;
      }
    },
    async jwt({ token, user, account }) {
      // Add any JWT customization here if needed
      return token;
    }
  }
}; 