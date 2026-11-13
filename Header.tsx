import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

/** The Fourth Code mark: four gold tally bars. */
export function Tallies() {
  return (
    <span className="tallies" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export async function Header() {
  let email: string | null = null;
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Tallies />
          <span>
            FOURTH CODE
            <small>KEEP MOVING.</small>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/">Browse Gyms</Link>
          <Link href="/host">Host</Link>
          <Link href="/bookings">My Bookings</Link>
          {email ? (
            <>
              <span className="nav-email">{email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="btn btn-gold btn-small">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
