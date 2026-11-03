import { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import type { User } from "@supabase/supabase-js";
import { initial, readState, writeState, type State } from "./store";
import { cloudClient, loadCloud, saveCloud, SaveConflict } from "./cloud";
type Cache = { state: State; revision: number; dirty: boolean };
export type SyncStatus =
  "guest" | "loading" | "saved" | "pending" | "saving" | "error" | "conflict";
export function useLearningState() {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [user, U] = useState<User | null>(null);
  const [status, Status] = useState<SyncStatus>("loading");
  const [error, E] = useState("");
  const [hasGuest, HG] = useState(false);
  const scope = useRef({ id: null as string | null, epoch: 0 });
  const current = useRef(state);
  const revision = useRef(0);
  const dirty = useRef(false);
  const baseline = useRef("");
  const writable = useRef(false);
  const conflict = useRef(false);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef(Promise.resolve());
  const cacheKey = (id: string) => "dco-academy-account-" + id;
  function cache(id: string, value: Cache) {
    queue.current = queue.current
      .catch(() => {})
      .then(() => set(cacheKey(id), value));
    return queue.current;
  }
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  async function saveNow() {
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
  }
  async function activate(nextUser: User | null) {
    cancel();
    const epoch = ++scope.current.epoch;
    scope.current.id = nextUser?.id || null;
    setReady(false);
    U(nextUser);
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
      HG(
        Boolean(
          guest.completed.length ||
          guest.stories.length ||
          guest.attempts.length ||
          Object.keys(guest.notes).length,
        ),
      );
      let value = guest;
      if (nextUser) {
        const local = await get<Cache>(cacheKey(nextUser.id));
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
            value = remote?.state || initial;
            revision.current = remote?.revision || 0;
            Status("saved");
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
      setState(value);
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
    current.current = state;
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
      queue.current = queue.current
        .catch(() => {})
        .then(() => writeState(state))
        .then(() => E(""))
        .catch(() =>
          E("Could not save on this device. Export a backup before leaving."),
        );
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
        setState(value);
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
  async function signOut() {
    cancel();
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
