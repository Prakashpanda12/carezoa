import { db } from "@/db";
import { messages } from "@/db/schema";
import { CARE_TEAM } from "@/lib/constants";
import { toMessage } from "@/server/data";
import { ensureSeed } from "@/server/seed";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeed();
    const rows = await db.select().from(messages).orderBy(asc(messages.createdAt));
    return Response.json(rows.map(toMessage));
  } catch (err) {
    console.error("[messages:get]", err);
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

const RULES: { test: RegExp; reply: string; author: number }[] = [
  {
    test: /refill|pharmacy|prescription/i,
    reply:
      "I'll get that refill processed right away. It'll be sent to your pharmacy on Market St within the hour — you'll get a pickup notification when it's ready.",
    author: 2,
  },
  {
    test: /metformin|lisinopril|albuterol|medication|medicine|dose|pill/i,
    reply:
      "Good question — for fasting labs, skip your morning dose and take it with your first meal after the draw. Anything else on your meds you're noticing (dizziness, cough, stomach upset) is worth flagging at your next visit.",
    author: 0,
  },
  {
    test: /appointment|schedule|reschedule|book|visit|cancel/i,
    reply:
      "I can help with scheduling. The fastest way is the Schedule tab — pick a slot that works and we'll confirm within a few hours. If you need something sooner than what's shown, let me know and I'll look for a cancellation.",
    author: 2,
  },
  {
    test: /pain|chest|breath|dizzy|faint|symptom|feel|hurt|short/i,
    reply:
      "Thanks for telling me — I've flagged this for Dr. Nair. If it's severe, worsening, or you have chest pain or trouble breathing, please call 911 or go to the nearest ER now. Otherwise, keep an eye on it and log your vitals so we can see the trend.",
    author: 0,
  },
  {
    test: /bill|billing|insurance|cost|copay|claim|charge/i,
    reply:
      "For anything billing-related, our team can walk you through it. Your current plan is Blue Shield Trio HMO — most follow-ups are a $35 copay. I'll attach a note to your account so billing reaches out with specifics.",
    author: 2,
  },
  {
    test: /lab|result|test|blood/i,
    reply:
      "Your labs typically post within 2–3 business days after the draw. As soon as Dr. Okafor reviews them, we'll message you here with a summary — no need to check the portal.",
    author: 0,
  },
  {
    test: /thank|thanks|great|perfect/i,
    reply:
      "Always happy to help, Maya. Anything else on your mind — meds, appointments, or how you're feeling — just message us here.",
    author: 0,
  },
];

function craftReply(body: string) {
  const rule = RULES.find((r) => r.test.test(body));
  const canned = rule ?? {
    reply:
      "Thanks for reaching out. I've shared this with your care team — we typically respond within 2 hours during business hours (Mon–Fri, 8am–6pm PT). If this is urgent, please call the clinic line.",
    author: Math.floor(Math.random() * CARE_TEAM.length),
  };
  const member = CARE_TEAM[canned.author];
  return { reply: canned.reply, authorName: member.name, authorRole: member.role };
}

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text || text.length > 2000) {
      return Response.json({ error: "Message body required" }, { status: 400 });
    }

    const [sent] = await db
      .insert(messages)
      .values({
        sender: "patient",
        authorName: "Maya Chen",
        authorRole: "",
        body: text,
      })
      .returning();

    // Simulated care-team reply, scheduled ~55s out so the client can show
    // a typing indicator. The reply is persisted immediately so it survives reloads.
    const { reply, authorName, authorRole } = craftReply(text);
    const [replyRow] = await db
      .insert(messages)
      .values({
        sender: "care_team",
        authorName,
        authorRole,
        body: reply,
        createdAt: new Date(Date.now() + 55_000),
      })
      .returning();

    return Response.json(
      { sent: toMessage(sent), reply: toMessage(replyRow) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[messages:post]", err);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
