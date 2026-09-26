import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startLive, type LiveState } from "./live";
import type { SupabaseClient } from "@supabase/supabase-js";

type Channel = {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

function makeDb() {
  const channel: Channel = {
    on: vi.fn(),
    subscribe: vi.fn()
  };
  const db = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn()
  };
  return { db: db as unknown as SupabaseClient, rawDb: db, channel };
}

/** Fire every `postgres_changes` callback registered via channel.on. */
function fireEvents(channel: Channel, times = 1) {
  const cbs = channel.on.mock.calls.map((c) => c[2] as () => void);
  for (let i = 0; i < times; i++) for (const cb of cbs) cb();
}

function emitStatus(channel: Channel, status: string) {
  const cb = channel.subscribe.mock.calls[0][0] as (status: string) => void;
  cb(status);
}

function stateTracker<T>() {
  let state: LiveState<T> = { status: "loading" };
  const onState = (update: (prev: LiveState<T>) => LiveState<T>) => {
    state = update(state);
  };
  return { onState, get: () => state };
}

describe("startLive", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("loads once and becomes ready", async () => {
    const { db } = makeDb();
    const t = stateTracker<number>();
    const load = vi.fn().mockResolvedValue(42);
    const stop = startLive(db, load, t.onState, vi.fn(), "t");
    await vi.runAllTimersAsync();
    expect(t.get()).toEqual({ status: "ready", data: 42 });
    stop();
  });

  it("debounces a burst of events into exactly one reload", async () => {
    const { db, channel } = makeDb();
    const t = stateTracker<number>();
    let calls = 0;
    const load = vi.fn(async () => ++calls);
    const stop = startLive(db, load, t.onState, vi.fn(), "t");
    await vi.runAllTimersAsync();
    expect(calls).toBe(1);

    fireEvents(channel, 5);
    await vi.advanceTimersByTimeAsync(249);
    expect(calls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toBe(2);
    stop();
  });

  it("a failed reload keeps the ready data on screen", async () => {
    const { db, channel } = makeDb();
    const t = stateTracker<number>();
    let ok = true;
    const load = vi.fn(async () => {
      if (ok) return 1;
      throw new Error("nope");
    });
    const stop = startLive(db, load, t.onState, vi.fn(), "t");
    await vi.runAllTimersAsync();
    expect(t.get()).toEqual({ status: "ready", data: 1 });

    ok = false;
    fireEvents(channel);
    await vi.advanceTimersByTimeAsync(250);
    await vi.runAllTimersAsync();
    expect(t.get()).toEqual({ status: "ready", data: 1 });
    stop();
  });

  it("sets an error when the initial load fails", async () => {
    const { db } = makeDb();
    const t = stateTracker<number>();
    const load = vi.fn().mockRejectedValue(new Error("boom"));
    const stop = startLive(db, load, t.onState, vi.fn(), "t");
    await vi.runAllTimersAsync();
    expect(t.get()).toEqual({ status: "error", message: "boom" });
    stop();
  });

  it("ignores an older refresh resolving after a newer one", async () => {
    const { db, channel } = makeDb();
    const t = stateTracker<number>();
    const resolvers: Array<(v: number) => void> = [];
    const load = vi.fn(() => new Promise<number>((res) => resolvers.push(res)));
    const stop = startLive(db, load, t.onState, vi.fn(), "t");

    fireEvents(channel);
    await vi.advanceTimersByTimeAsync(250);
    expect(resolvers.length).toBe(2);

    resolvers[1](200);
    await Promise.resolve();
    resolvers[0](100);
    await Promise.resolve();
    expect(t.get()).toEqual({ status: "ready", data: 200 });
    stop();
  });

  it("reloads on a re-SUBSCRIBED but not on the first SUBSCRIBED", async () => {
    const { db, channel } = makeDb();
    const t = stateTracker<number>();
    let calls = 0;
    const load = vi.fn(async () => ++calls);
    const onLive = vi.fn();
    const stop = startLive(db, load, t.onState, onLive, "t");
    await vi.runAllTimersAsync();
    expect(calls).toBe(1);

    emitStatus(channel, "SUBSCRIBED");
    expect(onLive).toHaveBeenCalledWith("live");
    await vi.advanceTimersByTimeAsync(250);
    expect(calls).toBe(1);

    emitStatus(channel, "SUBSCRIBED");
    await vi.advanceTimersByTimeAsync(250);
    expect(calls).toBe(2);
    stop();
  });

  it("stays connecting through a status that arrives before the first SUBSCRIBED", () => {
    const { db, channel } = makeDb();
    const onLive = vi.fn();
    const stop = startLive(db, vi.fn().mockResolvedValue(1), vi.fn(), onLive, "t");
    emitStatus(channel, "CHANNEL_ERROR");
    expect(onLive).not.toHaveBeenCalled();
    stop();
  });

  it.each(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"])(
    "goes offline on %s after having been subscribed, and back to live on a re-SUBSCRIBED",
    (status) => {
      const { db, channel } = makeDb();
      const onLive = vi.fn();
      const stop = startLive(db, vi.fn().mockResolvedValue(1), vi.fn(), onLive, "t");

      emitStatus(channel, "SUBSCRIBED");
      expect(onLive).toHaveBeenLastCalledWith("live");

      emitStatus(channel, status);
      expect(onLive).toHaveBeenLastCalledWith("offline");

      emitStatus(channel, "SUBSCRIBED");
      expect(onLive).toHaveBeenLastCalledWith("live");
      stop();
    }
  );

  it("cleanup removes the channel, cancels pending timers and ignores late promises", async () => {
    const { db, rawDb, channel } = makeDb();
    let resolve!: (v: number) => void;
    const load = vi.fn(() => new Promise<number>((res) => (resolve = res)));
    const onState = vi.fn();
    const stop = startLive(db, load, onState, vi.fn(), "t");

    stop();
    expect(rawDb.removeChannel).toHaveBeenCalledWith(channel);

    resolve(1);
    await Promise.resolve();
    expect(onState).not.toHaveBeenCalled();

    fireEvents(channel);
    await vi.advanceTimersByTimeAsync(300);
    expect(onState).not.toHaveBeenCalled();
  });

  it("ignores a status from a channel that has already been stopped", () => {
    const { db, channel } = makeDb();
    const onLive = vi.fn();
    const stop = startLive(db, vi.fn().mockResolvedValue(1), vi.fn(), onLive, "t");

    emitStatus(channel, "SUBSCRIBED");
    stop();
    onLive.mockClear();
    emitStatus(channel, "CLOSED");
    expect(onLive).not.toHaveBeenCalled();
  });
});
