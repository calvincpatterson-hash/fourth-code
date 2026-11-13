"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("athlete");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Read by the handle_new_user() trigger in the SQL migration to
          // create the profiles row with the chosen role.
          data: { role, display_name: displayName, city: city || null },
        },
      });
      if (error) throw error;
      if (data.session) {
        router.push(role === "host" ? "/host" : "/");
        router.refresh();
      } else {
        setNotice(
          "Account created — check your email to confirm it, then log in.",
        );
        setBusy(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-up failed. If Supabase is not connected yet, that's expected in the scaffold.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card form-card">
        <p className="kicker">Join Fourth Code</p>
        <h2>Create your account</h2>
        <form className="stack" onSubmit={onSubmit}>
          {error && <p className="error-box">{error}</p>}
          {notice && <p className="notice-box">{notice}</p>}

          <div>
            <label>I am joining as a…</label>
            <div className="segmented" role="group" aria-label="Choose your role">
              <button
                type="button"
                className={role === "athlete" ? "active" : ""}
                onClick={() => setRole("athlete")}
              >
                Athlete
                <small>Find and book private gyms</small>
              </button>
              <button
                type="button"
                className={role === "host" ? "active" : ""}
                onClick={() => setRole("host")}
              >
                Host
                <small>List my garage / home gym</small>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="city">City (optional)</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kansas City"
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-gold" disabled={busy}>
            {busy ? "Creating account…" : "Sign up"}
          </button>
          <p className="muted">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
