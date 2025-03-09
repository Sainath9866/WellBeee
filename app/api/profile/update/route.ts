import { getSession } from 'next-auth/react';
import User from '@/models/User';
import clientPromise from '../../../lib/mongodb';

interface UpdateProfileBody {
    age: number;
    gender: string;
}

interface SessionUser {
    email: string;
}

interface Session {
    user: SessionUser;
}

export default async function handler(
    req: { body: UpdateProfileBody },
    res: {
        status: (code: number) => {
            json: (data: { message: string; error?: any }) => void;
        };
    }
) {
    let session: Session | null = null;

    try {
        session = await getSession({ req }) as Session | null;
    } catch (error) {
        console.error('Error fetching session:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
        await db.collection('users').updateOne(
            { email: session.user.email },
            { $set: { age, gender } }
        );
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Profile update failed', error });
    }
}
