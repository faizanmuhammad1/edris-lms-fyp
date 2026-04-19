import { NextResponse } from "next/server";
import { mux } from "@/lib/mux";

export async function GET() {
    try {
        const assets = await mux.video.assets.list({ limit: 10 });
        return NextResponse.json({ success: true, count: assets.data.length, assets: assets.data });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message });
    }
}
