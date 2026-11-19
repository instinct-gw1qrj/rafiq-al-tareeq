import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Msg = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) });

export const askTraveler = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messages: z.array(Msg).min(1).max(30), context: z.string().max(60000) }))
  .handler(async ({ data }) => {
    const { askGateway } = await import("./server/gateway");
    const system = `أنت "رفيق"، مساعد تطبيق رفيق الطريق للمسافرين في مصر. رد بالعامية المصرية المهذبة، باختصار وبخطوات مرقمة.
اعتمد أولاً على بيانات التطبيق التالية (الخطوط والأجرة والمواقف). لو المعلومة مش موجودة قل ذلك بوضوح واقترح على المستخدم يضيف اقتراح من التطبيق، ولا تخترع أسعاراً.
في الحالات الطبية الخطيرة انصح بالاتصال بالإسعاف 123 فوراً.
بيانات التطبيق:
${data.context}`;
    try {
      return { ok: true as const, text: await askGateway(system, data.messages) };
    } catch (e) {
      return { ok: false as const, text: e instanceof Error ? e.message : "تعذّر الوصول للمساعد" };
    }
  });

const StageSchema = z.object({
  from: z.string(), to: z.string(),
  vehicle: z.enum(["tuktuk", "service", "microbus", "bus", "train", "metro", "taxi"]),
  fare: z.number(), station: z.string(), note: z.string().nullable().optional(),
});
export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_route"), route: z.object({ scope: z.enum(["internal", "external"]), from: z.string(), to: z.string(), station: z.string(), stages: z.array(StageSchema).min(1), notes: z.array(z.string()) }) }),
  z.object({ type: z.literal("set_fare"), routeId: z.string(), stageId: z.string(), fare: z.number() }),
  z.object({ type: z.literal("delete_route"), routeId: z.string() }),
  z.object({ type: z.literal("add_note"), routeId: z.string(), note: z.string() }),
  z.object({ type: z.literal("set_stage_note"), routeId: z.string(), stageId: z.string(), note: z.string() }),
]);
export type AdminAction = z.infer<typeof ActionSchema>;

export const askAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ command: z.string().min(1).max(4000), routes: z.string().max(80000) }))
  .handler(async ({ data }) => {
    const { askGateway } = await import("./server/gateway");
    const system = `أنت مساعد إدارة تطبيق "رفيق الطريق" للمالكة د. شروق. حوّل أمرها إلى تعديلات على الخطوط.
أعد JSON فقط بدون أي نص آخر بالشكل: {"reply": "شرح قصير بالعربي لما ستفعله", "actions": [...]}
أنواع actions:
{"type":"add_route","route":{"scope":"internal|external","from":"","to":"","station":"","stages":[{"from":"","to":"","vehicle":"tuktuk|service|microbus|bus|train|metro|taxi","fare":0,"station":"","note":""}],"notes":[]}}
{"type":"set_fare","routeId":"","stageId":"","fare":0}
{"type":"delete_route","routeId":""}
{"type":"add_note","routeId":"","note":""}
{"type":"set_stage_note","routeId":"","stageId":"","note":""}
استخدم المعرّفات id الموجودة فقط. لو الأمر سؤال أو تلخيص اترك actions فارغة واكتب الإجابة في reply.
الخطوط الحالية (JSON):
${data.routes}`;
    try {
      const raw = await askGateway(system, [{ role: "user", content: data.command }]);
      const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const reply = typeof json.reply === "string" ? json.reply : "";
      const actions = (Array.isArray(json.actions) ? json.actions : [])
        .map((a: unknown) => ActionSchema.safeParse(a))
        .filter((r: { success: boolean }) => r.success)
        .map((r: { data: AdminAction }) => r.data) as AdminAction[];
      return { ok: true as const, reply, actions };
    } catch (e) {
      return { ok: false as const, reply: e instanceof Error ? e.message : "تعذّر فهم الأمر", actions: [] as AdminAction[] };
    }
  });
