import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/ayra/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AyraLogo } from "@/components/ayra/AyraLogo";
export const Route = createFileRoute("/auth")({
 head: () => ({ meta: [{ title: "Sign in — AYRA Cloud Workspace" }, { name: "description", content: "Sign in to sync your AYRA agents, modules and roadmap across devices." }, { property: "og:title", content: "Sign in — AYRA Cloud Workspace" }, { property: "og:description", content: "Your private AYRA workspace, across devices." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: AuthPage,
});
function AuthPage() {
 const { user } = useAccount();
 const navigate = Route.useNavigate();
 const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
 const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
 const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
 const social = async (provider: "google" | "lovable") => {
  setBusy(true); setError("");
  try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
   if (result.error) setError("Sign-in couldn't complete. Please try again.");
   else if (!result.redirected) await navigate({ to: "/" });
  } catch { setError("Sign-in couldn't complete. Please try again."); } finally { setBusy(false); }
 };
 const submit = async (event: React.FormEvent) => {
  event.preventDefault(); setBusy(true); setError(""); setMessage("");
  try {
   if (mode === "forgot") { const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (result.error) throw result.error; setMessage("If an account exists, a password reset link has been sent. Check your email."); }
   else if (mode === "signup") { const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } }); if (result.error) throw result.error; if (result.data.session) await navigate({ to: "/" }); else setMessage("Check your email to confirm your account, then sign in."); }
   else { const result = await supabase.auth.signInWithPassword({ email, password }); if (result.error) throw result.error; await navigate({ to: "/" }); }
  } catch { setError(mode === "signin" ? "Couldn't sign in. Check your email and password, and confirm your email if you just signed up." : "Couldn't complete this request. Please try again."); } finally { setBusy(false); }
 };
 if (user) return <div className="mx-auto max-w-md py-16 text-center"><AyraLogo className="mx-auto h-16 w-16" /><h1 className="mt-5 font-display text-xl">You're signed in</h1><p className="mt-3 text-sm text-muted-foreground">{user.email}</p><Button asChild className="mt-6"><Link to="/">Open workspace</Link></Button></div>;
 return <div className="mx-auto max-w-sm py-6"><AyraLogo className="h-12 w-12" /><h1 className="mt-5 font-display text-2xl text-primary">{mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in to AYRA"}</h1>
 <div className="mt-6 space-y-3">{mode !== "forgot" && <><Button variant="outline" disabled={busy} className="google-signin w-full normal-case" onClick={() => void social("google")}><svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button><Button variant="outline" disabled={busy} className="w-full normal-case" onClick={() => void social("lovable")}><LovableMark className="size-[18px]" />Continue with Lovable</Button><p className="py-2 text-center text-xs text-muted-foreground">or use email</p></>}
 <form onSubmit={e => void submit(e)} className="space-y-4"><div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>{mode !== "forgot" && <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></div>}<Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button></form>
 {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
 <div className="flex flex-wrap justify-between gap-2"><Button variant="link" className="px-0 text-xs" onClick={() => {setMode(mode === "signin" ? "signup" : "signin");setError("");setMessage("");}}>{mode === "signin" ? "Create account" : "Back to sign in"}</Button>{mode === "signin" && <Button variant="link" className="px-0 text-xs" onClick={() => setMode("forgot")}>Forgot password?</Button>}</div>
 </div></div>;
}
