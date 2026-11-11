import start from "./courses/start.json";
import core from "./courses/core.json";
import pro from "./courses/pro.json";
import { questionsFor } from "./quiz";
export type Lesson = (typeof start)[number];
export const courses = [
  {
    id: "start",
    name: "START",
    label: "Уверенный первый шаг",
    description: "От первой комбинации до самостоятельного турнира.",
    lessons: start,
    color: "green",
    level: "Начальный",
    hours: 8,
  },
  {
    id: "core",
    name: "CORE",
    label: "Логика каждого решения",
    description: "Диапазоны, математика и осмысленная стратегия.",
    lessons: core,
    color: "gold",
    level: "Средний",
    hours: 12,
  },
  {
    id: "pro",
    name: "PRO",
    label: "Глубина понимания",
    description: "Точные модели, адаптация и защита своей линии.",
    lessons: pro,
    color: "silver",
    level: "Продвинутый",
    hours: 10,
  },
];
export const allLessons = courses.flatMap((c) => c.lessons);
export const quizFor = (lesson: Lesson) =>
  questionsFor(lesson.id, lesson.title, lesson.goal);
