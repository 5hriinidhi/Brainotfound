/**
 * POST /api/test-session
 *
 * Stores a completed test session. Logs to console and
 * saves to a local JSON file for persistence.
 */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const SESSIONS_FILE = path.join(DATA_DIR, 'test-sessions.json');

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
        // already exists
    }
}

async function loadSessions(): Promise<unknown[]> {
    try {
        const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.mode || !body.totalQuestions || body.solved === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const session = {
            id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ...body,
            savedAt: new Date().toISOString(),
        };

        // Persist to file
        await ensureDataDir();
        const sessions = await loadSessions();
        sessions.push(session);
        await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');

        console.log(`[API] Test session saved: ${session.id} — ${body.mode} — ${body.solved}/${body.totalQuestions} solved — ${body.totalXP} XP`);

        return NextResponse.json({ success: true, sessionId: session.id });
    } catch (err) {
        console.error('[API] Error saving test session:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
