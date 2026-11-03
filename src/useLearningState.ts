import { useEffect, useRef, useState, type SetStateAction } from "react";
import { get, set } from "idb-keyval";
import type { User } from "@supabase/supabase-js";
import {
  initial,
  hasLearningProgress,
  stagePending,
  readPending,
  clearPending,
  parseImport,
  readState,
  writeState,
  type State,
} from "./store";
import { cloudClient, loadCloud, saveCloud, SaveConflict } from "./cloud";
type Cache = { state: State; revision: number; dirty: boolean };
export type SyncStatus =
  "guest" | "loading" | "saved" | "pending" | "saving" | "error" | "conflict";
export function syncLabel(status: SyncStatus, account: boolean, error = "") {
  if (error && status !== "conflict") return "Saving needs attention";
  if (status === "loading") return "Opening saved progress";
  if (status === "conflict") return "Review saved copies";
  if (status === "error") return "Saving needs attention";
  if (status === "saving")
    return account ? "Saving to your account" : "Saving on this device";
  if (status === "pending")
    return account ? "Waiting to save to account" : "Saving on this device";
  return account ? "Saved to your account" : "Saved on this device";
}
export function useLearningState() {
  const [state, setReactState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [user, U] = useState<User | null>(null);
  const [status, Status] = useState<SyncStatus>("loading");
  const [error, E] = useState("");
  const [hasGuest, HG] = useState(false);
  const scope = useRef({ id: null as string | null, epoch: 0 });
  const current = useRef(state);
  const activeUser = useRef<User | null>(null);
  const localPending = useRef(0);
  const recoveryReady = useRef(false);
  const statusRef = useRef<SyncStatus>("loading");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const revision = useRef(0);
  const dirty = useRef(false);
  const baseline = useRef("");
  const writable = useRef(false);
  const conflict = useRef(false);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef(Promise.resolve());
  const cacheKey = (id: string) => "dco-academy-account-" + id;
  function setState(update: SetStateAction<State>) {
    const next =
      typeof update === "function" ? update(current.current) : update;
    const id = scope.current.id;
    if (id) dirty.current = true;
    recoveryReady.current =
      stagePending(
        id ? cacheKey(id) : "dco-academy-v1",
        id ? { state: next, revision: revision.current, dirty: true } : next,
      ) !== null;
    current.current = next;
    setReactState(next);
  }
  function cache(id: string, value: Cache) {
    recoveryReady.current = stagePending(cacheKey(id), value) !== null;
    localPending.current++;
    queue.current = queue.current
      .catch(() => {})
      .then(() => set(cacheKey(id), value))
      .then(() => clearPending(cacheKey(id), value))
      .finally(() => {
        localPending.current--;
      });
    return queue.current;
  }
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  const savingTask = useRef<Promise<boolean | undefined> | null>(null);
  function saveNow(): Promise<boolean | undefined> {
    if (savingTask.current) return savingTask.current;
    const task = persistNow().finally(() => {
      if (savingTask.current === task) savingTask.current = null;
    });
    savingTask.current = task;
    return task;
  }
  async function persistNow() {
    const { id, epoch } = scope.current;
    if (
      !id ||
      !dirty.current ||
      !writable.current ||
      conflict.current ||
      saving.current
    )
      return;
    cancel();
    saving.current = true;
    Status("saving");
    const snapshot = current.current;
    const json = JSON.stringify(snapshot);
    let success = false;
    try {
      const next = await saveCloud(id, snapshot, revision.current);
      if (scope.current.epoch !== epoch) return;
      revision.current = next;
      dirty.current = JSON.stringify(current.current) !== json;
      await cache(id, {
        state: current.current,
        revision: next,
        dirty: dirty.current,
      });
      E("");
      Status(dirty.current ? "pending" : "saved");
      success = true;
    } catch (e) {
      if (scope.current.epoch !== epoch) return;
      if (e instanceof SaveConflict) {
        conflict.current = true;
        Status("conflict");
        E("Another device saved a newer copy. Choose which copy to keep.");
      } else {
        Status("error");
        E(
          "Saved on this device, but the account save failed. Check your connection and try again.",
        );
      }
    } finally {
      saving.current = false;
      if (success && dirty.current && scope.current.epoch === epoch)
        timer.current = setTimeout(() => void saveNow(), 1000);
    }
    return success;
  }
  async function activate(nextUser: User | null) {
    cancel();
    const epoch = ++scope.current.epoch;
    scope.current.id = nextUser?.id || null;
    setReady(false);
    U(nextUser);
    activeUser.current = nextUser;
    Status("loading");
    E("");
    writable.current = false;
    conflict.current = false;
    revision.current = 0;
    dirty.current = false;
    try {
      await queue.current.catch(() => {});
      const guest = await readState();
      if (scope.current.epoch !== epoch) return;
      const guestProgress = hasLearningProgress(guest);
      HG(guestProgress);
      let value = guest;
      if (nextUser) {
        const pending = readPending<Cache>(cacheKey(nextUser.id));
        const local = pending
          ? { ...pending, state: parseImport(JSON.stringify(pending.state)) }
          : await get<Cache>(cacheKey(nextUser.id));
        if (scope.current.epoch !== epoch) return;
        let remote;
        try {
          remote = await loadCloud(nextUser.id);
          if (scope.current.epoch !== epoch) return;
          writable.current = true;
        } catch {
          if (scope.current.epoch !== epoch) return;
          value = local?.state || initial;
          revision.current = local?.revision || 0;
          dirty.current = local?.dirty || false;
          Status("error");
          E(
            "Could not load your account. Local changes will stay on this device until you reconnect.",
          );
        }
        if (writable.current) {
          if (local?.dirty) {
            value = local.state;
            revision.current = local.revision;
            dirty.current = true;
            if ((remote?.revision || 0) !== local.revision) {
              conflict.current = true;
              Status("conflict");
              E(
                "Another device saved a newer copy. Choose which copy to keep.",
              );
            } else Status("pending");
          } else {
            const bringGuest = !remote && !local && guestProgress;
            value = remote?.state || (bringGuest ? guest : initial);
            revision.current = remote?.revision || 0;
            dirty.current = bringGuest;
            Status(bringGuest ? "pending" : "saved");
          }
          await cache(nextUser.id, {
            state: value,
            revision: revision.current,
            dirty: dirty.current,
          });
        }
      } else Status("guest");
      if (scope.current.epoch !== epoch) return;
      current.current = value;
      baseline.current = JSON.stringify(value);
      setReactState(value);
      setReady(true);
      if (nextUser && dirty.current && !conflict.current && writable.current)
        timer.current = setTimeout(() => void saveNow(), 1000);
    } catch {
      if (scope.current.epoch === epoch) {
        E("Could not open saved data. Export a backup before leaving.");
        Status("error");
        setReady(true);
      }
    }
  }
  useEffect(() => {
    let alive = true;
    let initialResolved = false;
    const load = async () => {
      if (!cloudClient) {
        if (alive) await activate(null);
        return;
      }
      const { data, error } = await cloudClient.auth.getSession();
      initialResolved = true;
      if (alive) {
        await activate(error ? null : data.session?.user || null);
        if (error)
          E("Could not restore your sign-in. Sign in again to reconnect.");
      }
    };
    void load();
    const subscription = cloudClient?.auth.onAuthStateChange(
      (_event, session) => {
        if (!initialResolved) return;
        const id = session?.user.id || null;
        if (id !== scope.current.id)
          setTimeout(() => {
            if (alive) void activate(session?.user || null);
          }, 0);
      },
    );
    return () => {
      alive = false;
      cancel();
      subscription?.data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const json = JSON.stringify(state);
    if (json === baseline.current) return;
    baseline.current = json;
    const { id } = scope.current;
    if (id) {
      dirty.current = true;
      void cache(id, { state, revision: revision.current, dirty: true }).catch(
        () => {
          E(
            "The local backup could not be saved. Export a copy before leaving.",
          );
        },
      );
      if (!conflict.current) {
        Status(writable.current ? "pending" : "error");
        cancel();
        if (writable.current)
          timer.current = setTimeout(() => void saveNow(), 1200);
      }
    } else {
      const epoch = scope.current.epoch;
      localPending.current++;
      Status("saving");
      queue.current = queue.current
        .catch(() => {})
        .then(() => writeState(state))
        .then(() => {
          if (scope.current.epoch === epoch) {
            E("");
            Status("guest");
          }
        })
        .catch(() => {
          if (scope.current.epoch === epoch) {
            E("Could not save on this device. Export a backup before leaving.");
            Status("error");
          }
        })
        .finally(() => {
          localPending.current--;
        });
    }
  }, [state, ready]);
  async function resolve(useRemote: boolean) {
    const { id, epoch } = scope.current;
    if (!id) return;
    try {
      const remote = await loadCloud(id);
      if (scope.current.epoch !== epoch) return;
      revision.current = remote?.revision || 0;
      conflict.current = false;
      writable.current = true;
      if (useRemote) {
        await set("dco-academy-recovery-" + id, current.current);
        const value = remote?.state || initial;
        dirty.current = false;
        current.current = value;
        baseline.current = JSON.stringify(value);
        setReactState(value);
        await cache(id, {
          state: value,
          revision: revision.current,
          dirty: false,
        });
        E("");
        Status("saved");
      } else {
        dirty.current = true;
        E("");
        await saveNow();
      }
    } catch {
      E("Could not reconnect. Your local copy is still available.");
      Status("error");
    }
  }
  async function importGuest() {
    const guest = await readState();
    setState({ ...guest });
  }
  useEffect(() => {
    const beforeLeave = (event: BeforeUnloadEvent) => {
      if (localPending.current > 0 && !recoveryReady.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const online = () => {
      if (activeUser.current && !saving.current && !conflict.current)
        void activate(activeUser.current);
    };
    const focus = async () => {
      const { id, epoch } = scope.current;
      if (
        !id ||
        saving.current ||
        dirty.current ||
        statusRef.current !== "saved"
      )
        return;
      try {
        const remote = await loadCloud(id);
        if (
          scope.current.epoch !== epoch ||
          saving.current ||
          dirty.current ||
          !remote ||
          remote.revision === revision.current
        )
          return;
        revision.current = remote.revision;
        current.current = remote.state;
        baseline.current = JSON.stringify(remote.state);
        setReactState(remote.state);
        await cache(id, { ...remote, dirty: false });
      } catch {
        /* Keep the last saved copy available when a background refresh fails. */
      }
    };
    window.addEventListener("beforeunload", beforeLeave);
    window.addEventListener("online", online);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("beforeunload", beforeLeave);
      window.removeEventListener("online", online);
      window.removeEventListener("focus", focus);
    };
  }, []);
  async function signOut() {
    cancel();
    const saved = await saveNow();
    if (saved && dirty.current) await saveNow();
    await queue.current.catch(() => {});
    const { error } = await cloudClient!.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
  return {
    state,
    setState,
    ready,
    error,
    user,
    status,
    hasGuest,
    configured: Boolean(cloudClient),
    saveNow,
    reconnect: () => activate(user),
    resolve,
    importGuest,
    signOut,
  };
}
export type LearningStore = ReturnType<typeof useLearningState>;
