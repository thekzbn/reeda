/*
 * Reeda - a reading environment for PDFs.
 * Copyright (C) 2026 Quing (thekzbn)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Sign in to Reeda" },
      { name: "description", content: "Create your Reeda account to read and organise your PDFs." },
      { property: "og:title", content: "Sign in to Reeda" },
      {
        property: "og:description",
        content: "Create your Reeda account to read and organise your PDFs.",
      },
    ],
  }),
  component: AuthPage,
});

type Method = "providers" | "email" | "phone";

function AuthPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("providers");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function withProvider(provider: "google" | "microsoft" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("That sign-in did not complete. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("That sign-in did not complete. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight">Reeda</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Create an account to keep your reading in one place.
        </p>

        <div className="mt-8 space-y-2">
          <Button
            className="squircle h-11 w-full justify-center text-[15px]"
            disabled={busy}
            onClick={() => void withProvider("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="squircle h-11 w-full justify-center text-[15px]"
            disabled={busy}
            onClick={() => void withProvider("microsoft")}
          >
            Continue with Microsoft
          </Button>
          <Button
            variant="outline"
            className="squircle h-11 w-full justify-center text-[15px]"
            disabled={busy}
            onClick={() => void withProvider("apple")}
          >
            Continue with Apple
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-6">
          <div className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={
                method === "email"
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Use email
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={
                method === "phone"
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Use phone
            </button>
          </div>

          {method === "email" ? <EmailForm /> : null}
          {method === "phone" ? <PhoneForm /> : null}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function EmailForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          toast.error(readableAuthError(error.message));
          return;
        }
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(readableAuthError(error.message));
          return;
        }
        navigate({ to: "/", replace: true });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="squircle h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="squircle h-11"
        />
      </div>
      <Button type="submit" disabled={busy} className="squircle h-11 w-full">
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "I already have an account" : "I need an account"}
      </button>
    </form>
  );
}

function PhoneForm() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        toast.error(readableAuthError(error.message));
        return;
      }
      setSent(true);
      toast.success("We sent you a code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
      if (error) {
        toast.error(readableAuthError(error.message));
        return;
      }
      navigate({ to: "/", replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sent ? verify : sendCode} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-normal text-muted-foreground">
          Phone number
        </Label>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="+44 7700 900000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="squircle h-11"
        />
      </div>
      {sent ? (
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-sm font-normal text-muted-foreground">
            Code
          </Label>
          <Input
            id="code"
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="squircle h-11"
          />
        </div>
      ) : null}
      <Button type="submit" disabled={busy} className="squircle h-11 w-full">
        {sent ? "Verify code" : "Send code"}
      </Button>
    </form>
  );
}

function readableAuthError(message: string) {
  const lowered = message.toLowerCase();
  if (lowered.includes("invalid login")) return "That email and password do not match.";
  if (lowered.includes("already registered")) return "An account already exists for that email.";
  if (lowered.includes("password")) return "Please choose a password with at least 8 characters.";
  if (lowered.includes("phone") || lowered.includes("sms"))
    return "Phone sign-in is not available right now. Please use another method.";
  if (lowered.includes("token") || lowered.includes("otp")) return "That code was not correct.";
  return "Something went wrong. Please try again.";
}
