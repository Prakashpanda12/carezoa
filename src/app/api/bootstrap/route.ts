import { getBootstrap } from "@/server/data";
import { ensureSeed } from "@/server/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeed();
    return Response.json(await getBootstrap());
  } catch (err) {
    console.error("[bootstrap]", err);
    return Response.json({ error: "Failed to load data" }, { status: 500 });
  }
}
