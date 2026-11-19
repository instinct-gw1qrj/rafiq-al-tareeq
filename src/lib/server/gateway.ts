import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const MODEL = "openai/gpt-6-astra";

/** Streams a Responses call through the Lovable AI Gateway and returns the final text. Server-only. */
export async function askGateway(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("خدمة المساعد غير مُفعّلة حالياً");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (res.status === 402) throw new Error("انتهى رصيد المساعد الذكي، يرجى شحن الرصيد.");
      if (res.status === 429) throw new Error("ضغط كبير على المساعد، حاول بعد قليل.");
      if (res.status === 403) throw new Error("المساعد غير متاح حالياً لهذا الحساب.");
      return res;
    },
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system,
    messages,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return await result.text;
}
