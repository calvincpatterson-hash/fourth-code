"use client";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
      <button type="submit" className="btn btn-outline btn-small">
        Sign out
      </button>
    </form>
  );
}
