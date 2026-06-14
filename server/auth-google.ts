
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import type { Express } from 'express';

type GoogleProfile = {
    id: string;
    emails?: Array<{ value?: string | null }>;
    photos?: Array<{ value?: string | null }>;
};

export async function resolveExistingGoogleUser(profile: GoogleProfile) {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email) {
        throw new Error("No email found in Google profile");
    }

    let user = await storage.getUserByGoogleId(googleId);
    if (!user) {
        user = await storage.getUserByUsername(email);
    }

    if (!user) {
        return undefined;
    }

    if (!user.googleId) {
        await storage.updateUser(user.id, { googleId, avatarUrl });
    }

    return user;
}

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
        }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            try {
                const user = await resolveExistingGoogleUser(profile);
                if (!user) {
                    return done(null, false, { message: "AccountNotProvisioned" });
                }
                return done(null, user);
            } catch (error) {
                return done(error as Error);
            }
        }));
    }

    app.use(passport.initialize());
}
