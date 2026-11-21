import type { Session } from "@supabase/supabase-js";
import { CloudUpload, LogOut, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/app/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toArabicDigits } from "@/lib/arabic";
import { fetchVisitorStats, publishAll } from "@/lib/cloud-sync";

const OWNER_EMAIL = "shoroukelbaz39@gmail.com";

function useOwner() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    void supabase.auth.getSession().then(({ data: d }) => setSession(d.session));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return setIsAdmin(false);
    void supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(data === true));
  }, [session]);
  return { session, isAdmin };
}

/** Owner sign-in to the cloud: publishes edits to every user and shows the real visitor count. */
export function OwnerCloud() {
  const { session, isAdmin } = useOwner();
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session)
    return (
      <form
        className="space-y-3 rounded-3xl border border-primary/30 bg-card p-5 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          setBusy(false);
          if (error) toast.error("البريد أو كلمة المرور غير صحيحة، أو الحساب لم يُفعّل بعد من رسالة البريد");
        }}
      >
        <h2 className="flex items-center gap-2 font-bold"><CloudUpload className="size-5 text-primary" /> دخول المالكة للنشر لكل المستخدمين</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">أول مرة: اضغطي «إنشاء حساب المالكة» وافتحي رسالة التفعيل على بريدك. بعدها تدخلي من أي موبايل.</p>
        <Field label="البريد"><Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /></Field>
        <Field label="كلمة المرور (٨ أحرف على الأقل)"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={busy || password.length < 8}>دخول</Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || password.length < 8}
            onClick={async () => {
              setBusy(true);
              const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: { emailRedirectTo: `${window.location.origin}/admin` },
              });
              setBusy(false);
              if (error) toast.error(error.message);
              else toast.success("اتبعتت رسالة تفعيل على بريدك — افتحيها ثم ادخلي");
            }}
          >
            إنشاء حساب المالكة
          </Button>
        </div>
      </form>
    );

  return (
    <div className="space-y-3 rounded-3xl border border-primary/30 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm"><span className="text-muted-foreground">داخلة بـ </span><span dir="ltr">{session.user.email}</span></p>
        <Button variant="ghost" size="sm" onClick={() => void supabase.auth.signOut()}><LogOut /> خروج</Button>
      </div>
      {isAdmin ? (
        <>
          <Button
            size="xl"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              if (!navigator.onLine) return toast.error("النشر محتاج إنترنت");
              setBusy(true);
              try {
                await publishAll();
                toast.success("اتنشرت الخطوط والأماكن والإعلانات لكل المستخدمين");
              } catch {
                toast.error("تعذّر النشر، حاولي تاني");
              } finally {
                setBusy(false);
              }
            }}
          >
            <CloudUpload /> انشري التعديلات لكل المستخدمين
          </Button>
          <p className="text-xs text-muted-foreground">بيوصل لأي حد يفتح التطبيق بنت، ويفضل عنده بعدها حتى من غير نت.</p>
        </>
      ) : (
        <p className="text-sm text-sos">الحساب ده مش حساب المالكة، أو البريد لسه ما اتفعّلش.</p>
      )}
    </div>
  );
}

export function CloudVisitors() {
  const { isAdmin } = useOwner();
  const [s, setS] = useState<Awaited<ReturnType<typeof fetchVisitorStats>>>(null);
  useEffect(() => {
    if (isAdmin) void fetchVisitorStats().then(setS).catch(() => setS(null));
  }, [isAdmin]);
  if (!isAdmin) return <p className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">لعرض عدد الزوار الحقيقي من كل الأجهزة، ادخلي بحساب المالكة من تبويب «المساعد الذكي».</p>;
  if (!s) return <p className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">جاري تحميل عدد الزوار…</p>;
  const items = [
    ["مستخدمين", s.devices],
    ["مرات الفتح", s.total_opens],
    ["زوار النهارده", s.today_devices],
    ["زوار آخر ٧ أيام", s.week_devices],
  ] as const;
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-3 flex items-center gap-2 font-bold"><Users className="size-5 text-primary" /> عداد الزوار (كل الأجهزة)</h2>
      <div className="grid grid-cols-2 gap-2 text-center">
        {items.map(([label, v]) => (
          <div key={label} className="rounded-2xl bg-primary-soft p-3"><p className="text-2xl font-bold text-primary">{toArabicDigits(Number(v))}</p><p className="text-xs">{label}</p></div>
        ))}
      </div>
    </div>
  );
}
