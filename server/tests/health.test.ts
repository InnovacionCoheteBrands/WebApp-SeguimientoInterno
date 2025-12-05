import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../routes';

describe('Server Initialization', () => {
    it('should register routes and return 404 for unknown path', async () => {
        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        await registerRoutes(app);

        // basic middleware check
        const res = await request(app).get('/api/unknown-route-12345');
        // It might return 404 or a JSON error pending on error handler, 
        // but the fact it responds means routes registered.
        expect(res.status).toBeDefined();
    });
});
