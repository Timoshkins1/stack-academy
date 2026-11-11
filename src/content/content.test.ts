import { describe, it, expect } from "vitest";
import { courses, allLessons, quizFor } from "./index";
import { categories, exerciseFor } from "./exercises";
import { validateCards } from "../lib/poker";
describe("Целостность учебной программы", () => {
  it("ровно 30 уроков из трёх PDF", () => {
    expect(courses.map((c) => c.lessons.length)).toEqual([8, 12, 10]);
    expect(new Set(allLessons.map((l) => l.id)).size).toBe(30);
  });
  it.each(allLessons)("$id: теория, термины и вопросы доступны", (l) => {
    expect(l.duration).toBe(60);
    for (const field of [
      "goal",
      "theory",
      "terms",
      "hand",
      "practice",
      "answer",
      "homework",
      "notes",
      "questions",
    ] as const)
      expect(l[field].length).toBeGreaterThan(15);
    expect(quizFor(l)).toHaveLength(3);
    expect(
      quizFor(l).every(
        (q) => q.options.length === 3 && q.correct >= 0 && q.correct < 3,
      ),
    ).toBe(true);
  });
  it("дополнительные задачи не содержат повторяющихся карт", () => {
    for (const c of categories)
      for (let i = 0; i < 12; i++) {
        const e = exerciseFor(c.id, i);
        validateCards([...e.board, ...e.hero, ...e.villain]);
        expect(e.options[e.correct]).toBeTruthy();
        expect(e.explanation.length).toBeGreaterThan(20);
      }
  });
});
