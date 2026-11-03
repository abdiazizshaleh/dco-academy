import { useState } from "react";
import { Cloud, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { cloudClient } from "./cloud";
import { syncLabel, type LearningStore } from "./useLearningState";
export function CloudAccount({ store }: { store: LearningStore }) {
  const [mode, M] = useState<"signin" | "signup" | "reset">("signin");
  const [email, E] = useState("");
  const [password, P] = useState("");
  const [busy, B] = useState(false);
  const [message, T] = useState("");
  const [passwordReset, PR] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cloudClient) return;
    B(true);
    T("");
    try {
      const redirect = location.origin + import.meta.env.BASE_URL;
      if (passwordReset) {
        const { error } = await cloudClient.auth.updateUser({ password });
        if (error) throw error;
        PR(false);
        P("");
        T("Password updated.");
      } else if (mode === "signup") {
        const { data, error } = await cloudClient.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        if (!data.session)
          T("Check your email to confirm the account, then sign in here.");
      } else if (mode === "reset") {
        const { error } = await cloudClient.auth.resetPasswordForEmail(email, {
          redirectTo: redirect,
        });
        if (error) throw error;
        T(
          "If this email has an account, a password reset link is on its way. Open it here, then choose “Set a new password.”",
        );
      } else {
        const { error } = await cloudClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        P("");
      }
    } catch (e) {
      T(
        e instanceof Error
          ? e.message === "Invalid login credentials"
            ? "That email and password didn’t match. Try again or use Forgot password."
            : e.message === "Email not confirmed"
              ? "Open the confirmation link in your email, then sign in here."
              : e.message
          : "Could not complete that request. Try again.",
      );
    } finally {
      B(false);
    }
  }
  return (
    <section className="cloud-account">
      <div className="cloud-account-title">
        <Cloud size={21} />
        <div>
          <h3>Save across devices</h3>
          <p>
            Sign in to save progress, notes, stories, and study plans to your
            account.
          </p>
        </div>
      </div>
      {!store.configured ? (
        <p className="callout">
          Account storage is not configured in this build. You can still save on
          this device and export backups.
        </p>
      ) : store.user ? (
        <>
          <div className="cloud-user">
            <CheckCircle2 size={19} />
            <div>
              <b>{store.user.email}</b>
              <small>{syncLabel(store.status, true, store.error)}</small>
            </div>
          </div>
          {store.status === "conflict" ? (
            <div className="callout">
              <p>
                There’s a newer copy from another device. Your work on this
                device has been kept.
              </p>
              <div className="toolbar wrap">
                <button
                  className="button primary"
                  onClick={() => void store.resolve(true)}
                >
                  Use the account copy
                </button>
                <button
                  className="button secondary"
                  onClick={() => void store.resolve(false)}
                >
                  Keep this device’s copy
                </button>
              </div>
            </div>
          ) : (
            <div className="toolbar wrap">
              <button
                className="button secondary"
                disabled={
                  store.status === "saving" || store.status === "loading"
                }
                onClick={() =>
                  void (store.status === "error"
                    ? store.reconnect()
                    : store.saveNow())
                }
              >
                <RefreshCw size={15} />
                {store.status === "error" ? "Reconnect" : "Save now"}
              </button>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    await store.signOut();
                  } catch {
                    T("Could not sign out. Try again.");
                  }
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
          {store.hasGuest && (
            <details>
              <summary>Bring in this browser’s earlier progress</summary>
              <p>
                This replaces this account’s progress with the work you did in
                this browser while signed out. Export a backup first to keep the
                current account copy.
              </p>
              <button
                className="button secondary"
                onClick={() => void store.importGuest()}
              >
                Use this browser’s earlier progress
              </button>
            </details>
          )}
          <button
            className="text-button spaced"
            onClick={() => PR(!passwordReset)}
          >
            Set a new password
          </button>
          {passwordReset && (
            <form onSubmit={submit}>
              <label>
                New password
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => P(e.target.value)}
                />
              </label>
              <button className="button primary" disabled={busy}>
                Update password
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <div className="tabs">
            <button
              className={mode === "signin" ? "selected" : ""}
              onClick={() => {
                M("signin");
                T("");
              }}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "selected" : ""}
              onClick={() => {
                M("signup");
                T("");
              }}
            >
              Create account
            </button>
          </div>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => E(e.target.value)}
              />
            </label>
            {mode !== "reset" && (
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={mode === "signup" ? 12 : 1}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => P(e.target.value)}
                />
              </label>
            )}
            {mode === "signup" && (
              <p className="muted small-text">
                Use at least 12 characters for your password.
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
            </button>
            {mode !== "signup" && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  M(mode === "reset" ? "signin" : "reset");
                  T("");
                }}
              >
                {mode === "reset" ? "Back to sign in" : "Forgot password?"}
              </button>
            )}
          </form>
          <p className="muted small-text">
            Your progress and notes are private to your account. If this is a
            new account, your work in this browser comes with you.
          </p>
        </>
      )}
      {message && (
        <p className="callout" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
