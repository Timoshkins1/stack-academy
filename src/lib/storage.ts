export type Answer = {
  choice: number;
  correct: boolean;
  topic: string;
  date: string;
  lessonId?: string;
  kind: "quiz" | "practice" | "exam";
};
export type Timer = { remaining: number; runningSince: number | null };
export type Profile = {
  id: string;
  name: string;
  completed: Record<string, string>;
  answers: Record<string, Answer>;
  lastLesson: string;
  timers: Record<string, Timer>;
};
export type Store = { version: 1; active: string; profiles: Profile[] };
export const STORAGE_KEY = "stack-academy-v1";
export function newProfile(name: string): Profile {
  return {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 32) || "Ученик 1",
    completed: {},
    answers: {},
    lastLesson: "start-01",
    timers: {},
  };
}
export function initialStore(): Store {
  const p = newProfile("Ученик 1");
  return { version: 1, active: p.id, profiles: [p] };
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const date = (x: unknown) =>
  typeof x === "string" && Number.isFinite(Date.parse(x));
export function validateStore(x: unknown): Store {
  if (
    !object(x) ||
    x.version !== 1 ||
    typeof x.active !== "string" ||
    !Array.isArray(x.profiles) ||
    !x.profiles.length ||
    x.profiles.length > 50
  )
    throw new Error("Файл не соответствует формату СТЭК ACADEMY.");
  const ids = new Set<string>();
  for (const p of x.profiles) {
    if (
      !object(p) ||
      typeof p.id !== "string" ||
      p.id.length > 100 ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 32 ||
      typeof p.lastLesson !== "string" ||
      !object(p.completed) ||
      !object(p.answers) ||
      !object(p.timers)
    )
      throw new Error("Повреждён учебный профиль.");
    ids.add(p.id);
    if (Object.keys(p.answers).length > 10000)
      throw new Error("Слишком много результатов.");
    for (const [key, v] of Object.entries(p.completed))
      if (!/^(start|core|pro)-\d{2}$/.test(key) || !date(v))
        throw new Error("Повреждён список уроков.");
    for (const a of Object.values(p.answers))
      if (
        !object(a) ||
        !Number.isInteger(a.choice) ||
        (a.choice as number) < 0 ||
        (a.choice as number) > 20 ||
        typeof a.correct !== "boolean" ||
        typeof a.topic !== "string" ||
        a.topic.length > 300 ||
        !date(a.date) ||
        !["quiz", "practice", "exam"].includes(a.kind as string) ||
        (a.lessonId !== undefined && typeof a.lessonId !== "string")
      )
        throw new Error("Повреждён результат задания.");
    for (const t of Object.values(p.timers))
      if (
        !object(t) ||
        typeof t.remaining !== "number" ||
        !Number.isFinite(t.remaining) ||
        t.remaining < 0 ||
        t.remaining > 3600 ||
        (t.runningSince !== null &&
          (typeof t.runningSince !== "number" ||
            !Number.isFinite(t.runningSince) ||
            t.runningSince < 0))
      )
        throw new Error("Повреждён таймер.");
  }
  if (!ids.has(x.active)) throw new Error("Не найден активный профиль.");
  return x as Store;
}
export function loadStore(): { data: Store; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      data: raw ? validateStore(JSON.parse(raw)) : initialStore(),
      error: "",
    };
  } catch {
    return {
      data: initialStore(),
      error:
        "Не удалось прочитать сохранение. Старые данные не перезаписываются, пока вы не подтвердите сброс или импорт.",
    };
  }
}
export function remainingTime(timer: Timer, now = Date.now()) {
  return Math.max(
    0,
    timer.remaining -
      (timer.runningSince !== null
        ? Math.floor((now - timer.runningSince) / 1000)
        : 0),
  );
}
export function downloadJSON(store: Store) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(store, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `stack-academy-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
