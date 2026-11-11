import { describe, it, expect } from "vitest";
import {
  initialStore,
  newProfile,
  validateStore,
  remainingTime,
} from "./storage";
describe("Локальный прогресс", () => {
  it("экспорт и импорт сохраняют отдельные профили", () => {
    const s = initialStore(),
      p = newProfile("Ученик 2");
    s.profiles.push(p);
    s.profiles[0].completed["start-01"] = new Date().toISOString();
    const imported = validateStore(JSON.parse(JSON.stringify(s)));
    expect(imported.profiles[0].completed["start-01"]).toBeTruthy();
    expect(imported.profiles[1].completed).toEqual({});
  });
  it("отклоняет чужой формат, повторные ID и повреждённые результаты", () => {
    expect(() => validateStore({ profiles: [] })).toThrow();
    const s = initialStore();
    s.profiles.push(s.profiles[0]);
    expect(() => validateStore(s)).toThrow();
    const t = initialStore();
    t.profiles[0].answers.bad = {
      choice: -1,
      correct: true,
      topic: "x",
      date: "bad",
      kind: "quiz",
    };
    expect(() => validateStore(t)).toThrow();
  });
  it("таймер учитывает время вне страницы и останавливается на нуле", () => {
    expect(remainingTime({ remaining: 3600, runningSince: 1000 }, 61000)).toBe(
      3540,
    );
    expect(remainingTime({ remaining: 30, runningSince: 1000 }, 61000)).toBe(0);
    expect(remainingTime({ remaining: 100, runningSince: null }, 61000)).toBe(
      100,
    );
  });
});
