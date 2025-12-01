import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export const revalidate = 0;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username');

    if (!room) {
        return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }
    if (!username) {
        return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: username,
        name: username,
    });

    at.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
        accessToken: token,
        url: wsUrl,
    });
}
