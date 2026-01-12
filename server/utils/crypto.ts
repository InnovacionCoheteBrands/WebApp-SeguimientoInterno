/**
 * Cryptographic utilities for Mission Control security.
 * 
 * This module provides:
 * - Password hashing using bcrypt (SEC-001)
 * - AES-256-GCM encryption for API keys (SEC-002)
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

// ===========================================
// 🔐 PASSWORD HASHING (SEC-001)
// ===========================================

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 * @param password - Plain text password to verify
 * @param hash - Stored hash to compare against
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ===========================================
// 🔒 API KEY ENCRYPTION (SEC-002)
// ===========================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Get the encryption key from environment.
 * Must be exactly 32 bytes (256 bits) for AES-256.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // If key is hex-encoded (64 chars), decode it
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, 'hex');
    }

    // If key is base64-encoded
    if (key.length === 44 && /^[A-Za-z0-9+/=]+$/.test(key)) {
        return Buffer.from(key, 'base64');
    }

    // Use key directly (must be 32 bytes)
    const keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (256 bits)');
    }
    return keyBuffer;
}

/**
 * Encrypt a string using AES-256-GCM.
 * @param text - Plain text to encrypt
 * @returns Base64 encoded string in format: iv:tag:ciphertext
 */
export function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    // Format: base64(iv):base64(tag):base64(ciphertext)
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 * @param ciphertext - Encrypted string in format: iv:tag:ciphertext
 * @returns Original plain text
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

/**
 * Check if encryption is configured properly.
 * Useful for startup health checks.
 */
export function isEncryptionConfigured(): boolean {
    try {
        getEncryptionKey();
        return true;
    } catch {
        return false;
    }
}
