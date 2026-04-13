import Mux from "@mux/mux-node";
import { prisma } from '@/lib/db';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

async function run() {
    console.log("Fetching Mux assets...");
    const res = await mux.video.assets.list({ limit: 100 });
    let d = 0;
    
    for (const asset of res.data) {
        try {
            await mux.video.assets.delete(asset.id);
            d++;
            console.log(`Deleted Mux asset ${asset.id}`);
        } catch (e: any) {
            console.error(`Failed to delete ${asset.id}: ${e.message}`);
        }
    }
    
    console.log(`Successfully deleted ${d} Mux assets. Resetting DB...`);
    
    await prisma.lesson.updateMany({
        where: { muxAssetId: { not: null } },
        data: { muxStatus: null, muxAssetId: null, muxPlaybackId: null }
    });
    
    await prisma.lesson.updateMany({
        where: { muxStatus: 'errored' },
        data: { muxStatus: null }
    });

    console.log("Cleanup complete!");
}

run().catch(console.error);
