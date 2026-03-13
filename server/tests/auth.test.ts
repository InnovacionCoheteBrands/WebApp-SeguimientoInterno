import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../controllers/auth';
import { storage } from '../storage';
import { generateToken } from '../middleware/auth';
import { hashPassword } from '../utils/crypto';

vi.mock('../storage', () => ({
    storage: {
        getUserByUsername: vi.fn(),
        createUser: vi.fn(),
        createRefreshToken: vi.fn(),
        getRefreshToken: vi.fn(),
        revokeRefreshToken: vi.fn(),
        revokeAllUserRefreshTokens: vi.fn(),
        getUser: vi.fn(),
        updateUserPassword: vi.fn(),
        createAuditLog: vi.fn().mockResolvedValue(undefined),
    }
}));

describe('Authentication Module', () => {
    let app: express.Application;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.createAuditLog).mockResolvedValue(undefined);
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRouter);
    });

    describe('Token Generation Middleware', () => {
        it('should generate a valid JWT token string', () => {
            const token = generateToken({ id: '123', username: 'testuser', role: 'user' });
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should fail validation with 400 if credentials are missing', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('ValidationError');
        });

        it('should fail with 401 for unknown user', async () => {
            vi.mocked(storage.getUserByUsername).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'missing_user', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('InvalidCredentials');
        });

        it('should succeed with 200 and return both tokens for valid user', async () => {
            const hashedPwd = await hashPassword('correct_password');
            const mockUser = {
                id: '1',
                username: 'valid_user',
                password: hashedPwd,
                role: 'admin',
                email: 'test@example.com',
                avatarUrl: null,
                googleId: null,
                settings: '{}',
                apiKey: null,
                webhookUrl: null,
                createdAt: new Date(),
            };

            vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser);
            vi.mocked(storage.createRefreshToken).mockResolvedValue({
                id: 1,
                userId: '1',
                tokenHash: 'dummy_hash',
                expiresAt: new Date(),
                revoked: false,
                createdAt: new Date(),
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'valid_user', password: 'correct_password' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user.username).toBe('valid_user');
            expect(storage.createRefreshToken).toHaveBeenCalled();
            expect(storage.createAuditLog).toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should fail with 401 if refresh token is invalid/unknown', async () => {
            vi.mocked(storage.getRefreshToken).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid_token' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('InvalidToken');
        });

        it('should fail with 401 if refresh token is revoked', async () => {
            vi.mocked(storage.getRefreshToken).mockResolvedValue({
                id: 1,
                userId: '1',
                tokenHash: 'revoked_token',
                expiresAt: new Date(Date.now() + 10000),
                revoked: true,
                createdAt: new Date(),
            });

            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'revoked_token' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('TokenRevoked');
            expect(storage.revokeAllUserRefreshTokens).toHaveBeenCalledWith('1');
        });
    });
});
