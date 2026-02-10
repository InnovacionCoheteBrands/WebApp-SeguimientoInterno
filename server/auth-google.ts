
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import { generateToken } from './middleware/auth';
import type { Express } from 'express';


export function setupGoogleAuth(app: Express) {
    const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.BASE_URL);

    if (!hasCredentials) {
        console.warn("⚠️  [Auth] Google OAuth credentials not configured. Google login will be disabled.");
        console.warn("   Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and BASE_URL in your .env file.");
    } else {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${process.env.BASE_URL!}/api/auth/google/callback`,
            scope: ['profile', 'email']
        }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                const email = profile.emails?.[0]?.value;
                const googleId = profile.id;
                const avatarUrl = profile.photos?.[0]?.value;
                const displayName = profile.displayName;

                if (!email) {
                    return done(new Error("No email found in Google profile"));
                }

                // 1. Try to find user by Google ID
                let user = await storage.getUserByGoogleId(googleId);

                if (!user) {
                    // 2. Try to find user by email (using username as fallback)
                    user = await storage.getUserByUsername(email);
                }

                if (user) {
                    // Link Google ID if not linked
                    if (!user.googleId) {
                        await storage.updateUser(user.id, { googleId, avatarUrl });
                    }
                    return done(null, user);
                }

                // 3. Create new user
                const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                const newUser = await storage.createUser({
                    username: email,
                    password: randomPassword,
                    role: 'user',
                    googleId,
                    avatarUrl,
                    email
                });

                return done(null, newUser);
            } catch (error) {
                return done(error as Error);
            }
        }));
    }

    app.use(passport.initialize());
}
