import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Flag,
  GraduationCap,
  House,
  Layers3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Spade,
  Target,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { courses, allLessons, quizFor, type Lesson } from "./content";
import {
  categories,
  exerciseFor,
  categoryForLesson,
} from "./content/exercises";
import {
  loadStore,
  STORAGE_KEY,
  newProfile,
  downloadJSON,
  validateStore,
  remainingTime,
  type Profile,
  type Answer,
  type Store,
} from "./lib/storage";
import type { Question } from "./content/quiz";
import Table from "./components/Table";
import QuestionCard from "./components/QuestionCard";
type Route = {
  page: "home" | "course" | "lesson" | "trainer" | "report";
  id?: string;
};
function parseRoute(): Route {
  const [page, id] = location.hash.slice(1).split("/");
  return ["home", "course", "lesson", "trainer", "report"].includes(page)
    ? { page: page as Route["page"], id }
    : { page: "home" };
}
const go = (page: Route["page"], id?: string) => {
  location.hash = `${page}${id ? "/" + id : ""}`;
};
const fmt = (n: number) => String(n).padStart(2, "0");
const percent = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 100) : 0;
const navItems = [
  { page: "home", label: "Главная", icon: House },
  { page: "course", label: "Мои курсы", icon: BookOpen },
  { page: "trainer", label: "Тренажёры", icon: Spade },
  { page: "report", label: "Мой прогресс", icon: ChartNoAxesColumnIncreasing },
] as const;
function Brand() {
  return (
    <span className="brand">
      <Layers3 size={33} strokeWidth={1.7} />
      <span>
        СТЭК<small>ACADEMY</small>
      </span>
    </span>
  );
}
export default function App() {
  const [loaded] = useState(loadStore),
    [store, setStore] = useState<Store>(loaded.data),
    [blocked, setBlocked] = useState(!!loaded.error),
    [storageError, setStorageError] = useState(loaded.error),
    [route, setRoute] = useState<Route>(parseRoute),
    [settings, setSettings] = useState(false),
    [profilesOpen, setProfilesOpen] = useState(false),
    [toast, setToast] = useState(""),
    [offline, setOffline] = useState(!navigator.onLine),
    [cacheReady, setCacheReady] = useState(false);
  const profile = store.profiles.find((p) => p.id === store.active)!;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  useEffect(() => {
    function onHash() {
      setRoute(parseRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (blocked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError("");
    } catch {
      setStorageError(
        "Браузер не сохранил прогресс. Скачайте резервную копию JSON и освободите место.",
      );
    }
  }, [store, blocked]);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setCacheReady(true));
    }
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  function update(fn: (p: Profile) => Profile) {
    setStore((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === s.active ? fn(p) : p)),
    }));
  }
  function openLesson(id: string) {
    update((p) => ({ ...p, lastLesson: id }));
    go("lesson", id);
  }
  function saveAnswer(
    question: Question,
    choice: number,
    key: string,
    kind: Answer["kind"],
    lessonId?: string,
  ) {
    update((p) =>
      p.answers[key]
        ? p
        : {
            ...p,
            answers: {
              ...p.answers,
              [key]: {
                choice,
                correct: choice === question.correct,
                topic: question.topic,
                date: new Date().toISOString(),
                kind,
                lessonId,
              },
            },
          },
    );
  }
  const completed = Object.keys(profile.completed).length;
  const course = courses.find((c) => c.id === route.id) || courses[0];
  const lesson = allLessons.find((l) => l.id === route.id);
  const pageTitle =
    route.page === "home"
      ? "Учебное пространство"
      : route.page === "course"
        ? "Программа обучения"
        : route.page === "lesson"
          ? "Занятие"
          : route.page === "trainer"
            ? "Практика решений"
            : "Ваши результаты";
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
          document.getElementById("main-content")?.scrollIntoView();
        }}
      >
        Перейти к содержимому
      </a>
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => go("home")}
          aria-label="СТЭК ACADEMY, главная"
        >
          <Brand />
        </button>
        <div className="sidebar-divider" />
        <span className="sidebar-label">Обучение</span>
        <nav aria-label="Основная навигация">
          {navItems.map((n) => (
            <button
              key={n.page}
              className={`nav-item ${route.page === n.page || (route.page === "lesson" && n.page === "course") ? "active" : ""}`}
              onClick={() =>
                go(n.page, n.page === "course" ? "start" : undefined)
              }
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {n.page === "course" && <small>3</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <GraduationCap size={24} />
          <h3>Важны решения.</h3>
          <p>Не результат одной раздачи, а понимание игры.</p>
        </div>
        <button className="settings-link" onClick={() => setSettings(true)}>
          <Settings2 size={18} /> Данные и настройки
        </button>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          {offline
            ? "Без интернета"
            : cacheReady
              ? "Готово к работе офлайн"
              : "Прогресс на устройстве"}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-context">
            <span className="mobile-brand">СТЭК</span>
            <span className="desktop-context">{pageTitle}</span>
          </span>
          <div className="topbar-right">
            <button
              className="icon-button mobile-settings"
              aria-label="Данные и настройки"
              onClick={() => setSettings(true)}
            >
              <Settings2 size={18} />
            </button>
            <span className="local-status">
              <ShieldCheck size={15} /> Только на этом устройстве
            </span>
            <button
              className="profile-button"
              onClick={() => setProfilesOpen(true)}
              aria-label="Переключить ученика"
            >
              <span className="avatar">
                <UserRound size={17} />
              </span>
              <span>{profile.name}</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            {storageError}{" "}
            <button onClick={() => setSettings(true)}>Открыть данные</button>
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={`main-content page-${route.page}`}
        >
          {route.page === "home" && (
            <Home
              profile={profile}
              openLesson={openLesson}
              completed={completed}
            />
          )}
          {route.page === "course" && (
            <Course
              key={course.id + profile.id}
              course={course}
              profile={profile}
              openLesson={openLesson}
              saveAnswer={saveAnswer}
            />
          )}
          {route.page === "lesson" &&
            (lesson ? (
              <LessonPage
                key={lesson.id + profile.id}
                lesson={lesson}
                profile={profile}
                update={update}
                openLesson={openLesson}
                saveAnswer={saveAnswer}
                notify={notify}
              />
            ) : (
              <div className="empty-state">
                <h1>Урок не найден</h1>
                <button
                  className="primary"
                  onClick={() => go("course", "start")}
                >
                  К программе
                </button>
              </div>
            ))}
          {route.page === "trainer" && (
            <Trainer
              key={profile.id}
              profile={profile}
              initialCategory={route.id}
              saveAnswer={saveAnswer}
            />
          )}
          {route.page === "report" && (
            <Report key={profile.id} profile={profile} notify={notify} />
          )}
        </main>
        <footer className="page-footer">
          <span>
            СТЭК ACADEMY <span className="footer-separator">/</span> Школа
            спортивного покера
          </span>
          <span>Учебные фишки без денежной стоимости</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {navItems.map((n) => (
          <button
            key={n.page}
            className={
              route.page === n.page ||
              (route.page === "lesson" && n.page === "course")
                ? "active"
                : ""
            }
            onClick={() =>
              go(n.page, n.page === "course" ? "start" : undefined)
            }
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {profilesOpen && (
        <ProfileDialog
          store={store}
          setStore={setStore}
          close={() => setProfilesOpen(false)}
          notify={notify}
        />
      )}
      {settings && (
        <SettingsDialog
          store={store}
          setStore={setStore}
          close={() => setSettings(false)}
          notify={notify}
          unblock={() => {
            setBlocked(false);
            setStorageError("");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Home({
  profile,
  openLesson,
  completed,
}: {
  profile: Profile;
  openLesson: (id: string) => void;
  completed: number;
}) {
  const current =
      allLessons.find((l) => l.id === profile.lastLesson) || allLessons[0],
    course = courses.find((c) => c.lessons.some((l) => l.id === current.id))!;
  const started = Object.keys(profile.answers).length > 0 || completed > 0;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="greeting">Добро пожаловать в СТЭК ACADEMY</div>
          <h1>Игра начинается с понимания.</h1>
          <p>Изучайте теорию. Принимайте решения. Находите свою игру.</p>
        </div>
        <span className="heading-stamp">
          <span>30</span> уроков
          <br />
          одна система
        </span>
      </div>
      <section className="continue-panel">
        <div className="continue-copy">
          <div className="lesson-kicker">
            <span className="tiny-tag">{course.name}</span>
            <span>
              {started ? "Продолжить обучение" : "Ваш первый шаг"}
              <span className="dot-sep">·</span> Урок {fmt(current.number)}
            </span>
          </div>
          <h2>{current.title}</h2>
          <p>{current.goal}</p>
          <div className="continue-actions">
            <button className="primary" onClick={() => openLesson(current.id)}>
              {started ? "Продолжить урок" : "Начать обучение"}
              <ArrowRight size={19} />
            </button>
            <span>
              <Clock size={15} />
              60 минут
            </span>
          </div>
          <div className="hero-meta">
            <span className="mini-line" />
            Теория, разборы и практика в каждом занятии
          </div>
        </div>
        <Table decorative board={["Ac", "8d", "3s"]} hero={["Ah", "Qh"]} />
      </section>
      <section className="courses-section">
        <div className="section-heading">
          <h2>Ваша программа</h2>
          <span>{completed} из 30 уроков пройдено</span>
        </div>
        <div className="course-grid">
          {courses.map((c, i) => {
            const done = c.lessons.filter(
              (l) => profile.completed[l.id],
            ).length;
            return (
              <button
                key={c.id}
                className={`course-card course-${c.color}`}
                onClick={() => go("course", c.id)}
              >
                <div className="course-card-top">
                  <span className="level">
                    <span className="level-bars">
                      {[0, 1, 2].map((b) => (
                        <i key={b} className={b <= i ? "filled" : ""} />
                      ))}
                    </span>
                    {c.level}
                  </span>
                  <ArrowUpRight size={21} />
                </div>
                <div className="course-title">
                  {c.name}
                  <span>{["01", "02", "03"][i]}</span>
                </div>
                <h3>{c.label}</h3>
                <p>{c.description}</p>
                <div className="course-details">
                  <span>{c.lessons.length} уроков</span>
                  <span>
                    <Clock size={13} />
                    {c.hours} часов
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    style={{ width: `${(done / c.lessons.length) * 100}%` }}
                  />
                </div>
                <div className="course-progress">
                  <span>
                    {done
                      ? `${done} из ${c.lessons.length} пройдено`
                      : "Ещё не начат"}
                  </span>
                  <b>{percent(done, c.lessons.length)}%</b>
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="practice-strip">
        <span className="practice-icon">
          <Target size={27} />
        </span>
        <div>
          <h3>Закрепите за столом</h3>
          <p>Комбинации, математика и решения в учебных раздачах.</p>
        </div>
        <button className="secondary" onClick={() => go("trainer")}>
          К тренажёрам
          <ArrowRight size={17} />
        </button>
      </section>
      <div className="privacy-line">
        <ShieldCheck size={16} />
        <span>
          Ваш прогресс остаётся здесь. Без регистрации и синхронизации.
        </span>
        <button
          onClick={() =>
            downloadJSON({
              version: 1,
              active: profile.id,
              profiles: [profile],
            })
          }
        >
          Сохранить копию
          <Download size={13} />
        </button>
      </div>
    </>
  );
}
type SaveAnswer = (
  q: Question,
  choice: number,
  key: string,
  kind: Answer["kind"],
  lessonId?: string,
) => void;
function Course({
  course,
  profile,
  openLesson,
  saveAnswer,
}: {
  course: (typeof courses)[number];
  profile: Profile;
  openLesson: (id: string) => void;
  saveAnswer: SaveAnswer;
}) {
  const [search, setSearch] = useState(""),
    [exam, setExam] = useState(false);
  const filtered = course.lessons.filter((l) =>
    (l.title + " " + l.terms + " " + l.theory)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const done = course.lessons.filter((l) => profile.completed[l.id]).length;
  const examQuestions = course.lessons.flatMap((l) => quizFor(l).slice(0, 2));
  return (
    <>
      <button className="back-link" onClick={() => go("home")}>
        <ChevronLeft size={17} />
        Все курсы
      </button>
      <div className="page-heading">
        <div>
          <div className="greeting">
            {course.level} уровень · {course.hours} часов
          </div>
          <h1>
            {course.name}
            <span className="title-sub">{course.label}</span>
          </h1>
          <p>{course.description}</p>
        </div>
        <span className="course-counter">
          <b>{done}</b> / {course.lessons.length}
          <small>уроков завершено</small>
        </span>
      </div>
      <div className="course-tabs" role="tablist" aria-label="Курс">
        {courses.map((c) => (
          <button
            role="tab"
            aria-selected={c.id === course.id}
            className={c.id === course.id ? "selected" : ""}
            key={c.id}
            onClick={() => go("course", c.id)}
          >
            {c.name}
            <span>{c.lessons.length}</span>
          </button>
        ))}
      </div>
      <div className="section-heading lessons-heading">
        <h2>{exam ? "Итоговый тест курса" : "От теории к решениям"}</h2>
        <button className="text-button" onClick={() => setExam(!exam)}>
          {exam ? "Вернуться к урокам" : "Итоговый тест"}
          <Flag size={16} />
        </button>
      </div>
      {!exam ? (
        <>
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              name="topic"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Найти урок или термин"
              aria-label="Поиск по темам"
            />
            <span>{filtered.length} уроков</span>
          </label>
          <div className="lesson-list">
            {filtered.map((l) => (
              <button
                key={l.id}
                className="lesson-row"
                onClick={() => openLesson(l.id)}
              >
                <span
                  className={`lesson-index ${profile.completed[l.id] ? "done" : ""}`}
                >
                  {profile.completed[l.id] ? (
                    <Check size={19} />
                  ) : (
                    fmt(l.number)
                  )}
                </span>
                <div>
                  <h3>{l.title}</h3>
                  <p>{l.goal}</p>
                </div>
                <span className="lesson-duration">
                  <Clock size={14} />
                  60 мин
                </span>
                <span className="lesson-row-status">
                  {profile.completed[l.id]
                    ? "Изучено"
                    : profile.lastLesson === l.id &&
                        Object.keys(profile.answers).length
                      ? "Продолжить"
                      : "Открыть"}
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
            {!filtered.length && (
              <div className="empty-state">
                Уроки не найдены. Попробуйте другой термин.
              </div>
            )}
          </div>
          <div className="course-bottom-note">
            <BookOpen size={19} />
            <p>
              Программа перенесена из учебника {course.name}. Во всех уроках
              доступны теория, словарь, разборы, практика и проверка.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="content-note">
            Дополнительный автоматический тест: {examQuestions.length} вопросов.
            Результаты сохраняются отдельно от проверок уроков. Практическая
            аттестация из учебника проводится с преподавателем.
          </p>
          {examQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              number={i + 1}
              question={q}
              answer={profile.answers[`exam-${q.id}`]}
              onAnswer={(choice) =>
                saveAnswer(q, choice, `exam-${q.id}`, "exam", q.id.slice(0, -3))
              }
            />
          ))}
          <button className="primary" onClick={() => go("report")}>
            Посмотреть результат
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </>
  );
}
const lessonTabs = ["Теория", "Термины", "Раздачи", "Практика", "Проверка"];
function LessonPage({
  lesson,
  profile,
  update,
  openLesson,
  saveAnswer,
  notify,
}: {
  lesson: Lesson;
  profile: Profile;
  update: (fn: (p: Profile) => Profile) => void;
  openLesson: (id: string) => void;
  saveAnswer: SaveAnswer;
  notify: (m: string) => void;
}) {
  const [tab, setTab] = useState(0),
    [now, setNow] = useState(Date.now()),
    [hand, setHand] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const course = courses.find((c) =>
      c.lessons.some((l) => l.id === lesson.id),
    )!,
    timer = profile.timers[lesson.id] || {
      remaining: 3600,
      runningSince: null,
    },
    remaining = remainingTime(timer, now),
    elapsed = 3600 - remaining;
  const stages = [
      { name: "Повторение", end: 300 },
      { name: "Теория", end: 1500 },
      { name: "Разбор", end: 2400 },
      { name: "Практика", end: 3300 },
      { name: "Проверка", end: 3600 },
    ],
    stage = stages.findIndex((s) => elapsed < s.end);
  const questions = quizFor(lesson),
    answered = questions.filter((q) => profile.answers[q.id]).length;
  const category = categoryForLesson(lesson.id),
    baseExercise = exerciseFor(category, hand),
    exercise =
      hand < 2
        ? {
            ...baseExercise,
            ...questions[hand],
            id: `case-${hand}`,
            hero: [],
            board: [],
            villain: [],
          }
        : baseExercise,
    exerciseKey = `lesson-${lesson.id}-${exercise.id}`;
  const next = course.lessons[lesson.number];
  function toggleTimer() {
    const t = Date.now();
    update((p) => ({
      ...p,
      timers: {
        ...p.timers,
        [lesson.id]: {
          remaining: remainingTime(timer, t),
          runningSince: timer.runningSince ? null : t,
        },
      },
    }));
    setNow(t);
  }
  function complete() {
    update((p) => ({
      ...p,
      completed: { ...p.completed, [lesson.id]: new Date().toISOString() },
      timers: {
        ...p.timers,
        [lesson.id]: { remaining: remainingTime(timer), runningSince: null },
      },
    }));
    notify("Занятие завершено. Результат сохранён на устройстве.");
    go("report");
  }
  return (
    <>
      <button className="back-link" onClick={() => go("course", course.id)}>
        <ChevronLeft size={17} />
        {course.name} / Программа курса
      </button>
      <div className="lesson-page-heading">
        <div>
          <div className="lesson-kicker">
            <span className="tiny-tag">{course.name}</span>
            <span>
              Урок {fmt(lesson.number)} из {course.lessons.length}
            </span>
            {profile.completed[lesson.id] && (
              <span className="completed-tag">
                <Check size={13} />
                Изучено
              </span>
            )}
          </div>
          <h1>{lesson.title}</h1>
          <p>{lesson.goal}</p>
        </div>
      </div>
      <div className="lesson-layout">
        <div className="lesson-main">
          <div className="lesson-tabs" role="tablist" aria-label="Раздел урока">
            {lessonTabs.map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === i}
                className={tab === i ? "selected" : ""}
                onClick={() => setTab(i)}
              >
                {t}
                {i === 4 && <small>{answered}/3</small>}
              </button>
            ))}
          </div>
          <div
            className="lesson-content"
            role="tabpanel"
            aria-label={lessonTabs[tab]}
          >
            {tab === 0 && (
              <>
                <span className="content-source">
                  Из учебника {course.name}
                </span>
                <h2>Разобраться в главном</h2>
                <div className="theory-text">
                  {lesson.theory
                    .split(/(?<=[.!?])\s+(?=[А-ЯA-Z])/)
                    .reduce<string[]>((acc, s, i) => {
                      if (i % 3 === 0) acc.push(s);
                      else acc[acc.length - 1] += " " + s;
                      return acc;
                    }, [])
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
                <aside className="teaching-note">
                  <GraduationCap size={22} />
                  <div>
                    <h3>Замечание преподавателя</h3>
                    <p>{lesson.notes}</p>
                  </div>
                </aside>
                <h3>После занятия</h3>
                <p>{lesson.homework}</p>
                <button className="secondary" onClick={() => setTab(1)}>
                  К терминам
                  <ArrowRight size={17} />
                </button>
              </>
            )}
            {tab === 1 && (
              <>
                <h2>Говорим на одном языке</h2>
                <div className="terms-list">
                  {lesson.terms
                    .split(/(?<=\.)\s+(?=[А-ЯA-Z])/)
                    .map((term, i) => {
                      const parts = term.split(" — ");
                      return (
                        <div key={i}>
                          <h3>{parts[0]}</h3>
                          <p>{parts.slice(1).join(" — ")}</p>
                        </div>
                      );
                    })}
                </div>
                <button className="secondary" onClick={() => setTab(2)}>
                  К раздачам
                  <ArrowRight size={17} />
                </button>
              </>
            )}
            {tab === 2 && (
              <>
                <span className="content-source">
                  Учебный разбор 1 / Из учебника
                </span>
                <h2>Ситуация и решение</h2>
                <div className="hand-text">{lesson.hand}</div>
                <h3>Проверьте объяснение</h3>
                <p>{lesson.answer}</p>
                <hr />
                <span className="content-source">
                  Учебный разбор 2 / Дополнительное упражнение
                </span>
                <h3>{exercise.prompt}</h3>
                {exercise.hero.length > 0 && <Table {...exercise} />}
                <details className="solution-details">
                  <summary>Показать разбор</summary>
                  <p>{exercise.explanation}</p>
                </details>
                <div className="inline-actions">
                  <button
                    className="text-button"
                    onClick={() => setHand((h) => (h + 1) % 3)}
                  >
                    Другой пример
                    <RotateCcw size={15} />
                  </button>
                  <button className="secondary" onClick={() => setTab(3)}>
                    Попробовать самостоятельно
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
            {tab === 3 && (
              <>
                <h2>От объяснения к действию</h2>
                <p>{lesson.practice}</p>
                <span className="content-source">
                  Дополнительное упражнение {hand + 1} / 3
                </span>
                {exercise.hero.length > 0 && <Table {...exercise} />}
                <QuestionCard
                  question={exercise}
                  answer={profile.answers[exerciseKey]}
                  onAnswer={(choice) =>
                    saveAnswer(
                      exercise,
                      choice,
                      exerciseKey,
                      "practice",
                      lesson.id,
                    )
                  }
                />
                <div className="inline-actions">
                  <button
                    className="secondary"
                    onClick={() => setHand((h) => (h + 1) % 3)}
                  >
                    Следующая ситуация
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => go("trainer", category)}
                  >
                    Все тренажёры
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </>
            )}
            {tab === 4 && (
              <>
                <h2>Проверим понимание</h2>
                <p className="content-note">
                  3 дополнительных вопроса с автоматической проверкой.
                  Сохраняется первый ответ, чтобы результат отражал
                  самостоятельное решение.
                </p>
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    number={i + 1}
                    question={q}
                    answer={profile.answers[q.id]}
                    onAnswer={(choice) =>
                      saveAnswer(q, choice, q.id, "quiz", lesson.id)
                    }
                  />
                ))}
                <details className="solution-details">
                  <summary>5 открытых вопросов из учебника</summary>
                  <p>{lesson.questions}</p>
                </details>
                <div className="finish-lesson">
                  <p>
                    {answered < 3
                      ? "Ответьте на все три вопроса, чтобы завершить занятие."
                      : "Проверка пройдена. Ошибки попадут в рекомендации."}
                  </p>
                  <button
                    className="primary"
                    disabled={answered < 3}
                    onClick={complete}
                  >
                    <Check size={18} />
                    Завершить занятие
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="lesson-pagination">
            <button
              disabled={lesson.number === 1}
              onClick={() => openLesson(course.lessons[lesson.number - 2].id)}
            >
              <ChevronLeft size={16} />
              Предыдущий урок
            </button>
            {next ? (
              <button onClick={() => openLesson(next.id)}>
                Следующий урок
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => go("course", course.id)}>
                К итоговому тесту
                <Flag size={16} />
              </button>
            )}
          </div>
        </div>
        <aside className="lesson-aside">
          <div className="timer-card">
            <div className="section-heading">
              <h3>Время занятия</h3>
              <Clock size={17} />
            </div>
            <div
              className={`timer-value ${remaining === 0 ? "timer-finished" : ""}`}
              aria-live="off"
            >
              {fmt(Math.floor(remaining / 60))}
              <span>:</span>
              {fmt(remaining % 60)}
            </div>
            <div className="timer-buttons">
              <button
                className="secondary"
                onClick={toggleTimer}
                disabled={remaining === 0}
              >
                {timer.runningSince && remaining > 0 ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}{" "}
                {timer.runningSince && remaining > 0
                  ? "Пауза"
                  : remaining === 3600
                    ? "Начать"
                    : "Продолжить"}
              </button>
              <button
                className="icon-button"
                aria-label="Сбросить таймер"
                onClick={() => {
                  update((p) => ({
                    ...p,
                    timers: {
                      ...p.timers,
                      [lesson.id]: { remaining: 3600, runningSince: null },
                    },
                  }));
                  setNow(Date.now());
                }}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            {remaining === 0 && (
              <p role="status">
                60 минут завершены. Можно закончить проверку в своём темпе.
              </p>
            )}
            <div className="stage-list">
              {stages.map((s, i) => (
                <div
                  key={s.name}
                  className={stage === i ? "current-stage" : ""}
                >
                  <span>
                    {stage > i || remaining === 0 ? <Check size={13} /> : <i />}
                    {s.name}
                  </span>
                  <small>{[5, 20, 15, 15, 5][i]} мин</small>
                </div>
              ))}
            </div>
          </div>
          <div className="aside-note">
            <ShieldCheck size={18} />
            <p>
              Ответы и таймер сохраняются автоматически в профиле «
              {profile.name}».
            </p>
          </div>
          <p className="content-source">
            Экзаменационный тайминг может отличаться: смотрите условия урока.
          </p>
        </aside>
      </div>
    </>
  );
}
function Trainer({
  profile,
  initialCategory,
  saveAnswer,
}: {
  profile: Profile;
  initialCategory?: string;
  saveAnswer: SaveAnswer;
}) {
  const [category, setCategory] = useState(
      categories.some((c) => c.id === initialCategory)
        ? initialCategory!
        : "guided",
    ),
    [index, setIndex] = useState(0),
    [players, setPlayers] = useState(6);
  const exercise = exerciseFor(category, index, players),
    key = `trainer-${exercise.id}`,
    answer = profile.answers[key];
  const total = Object.values(profile.answers).filter(
    (a) => a.kind === "practice",
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="greeting">Спокойная практика без риска</div>
          <h1>Решение за вами.</h1>
          <p>Сначала выберите действие. Затем сравните ход мысли с разбором.</p>
        </div>
        <span className="course-counter">
          <b>{total}</b>
          <small>задач выполнено</small>
        </span>
      </div>
      <div className="trainer-layout">
        <aside className="trainer-categories" aria-label="Тип тренажёра">
          {categories.map((c, i) => (
            <button
              key={c.id}
              className={category === c.id ? "selected" : ""}
              onClick={() => {
                setCategory(c.id);
                setIndex(0);
              }}
            >
              <span className="category-symbol">
                {["▶", "♠", "↻", "↗", "A", "%", "♣", "⚑", "Ⅱ"][i]}
              </span>
              <span>
                <b>{c.name}</b>
                <small>{c.sub}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </aside>
        <section className="trainer-stage">
          <div className="trainer-toolbar">
            <span className="tiny-tag">
              {categories.find((c) => c.id === category)?.name}
            </span>
            <span>
              {category === "guided" ? "Шаг" : "Ситуация"} {index + 1} из{" "}
              {category === "math" ? 6 : category === "guided" ? 5 : 3}
            </span>
            {category === "order" && (
              <label>
                Мест{" "}
                <select
                  aria-label="Число игроков"
                  value={players}
                  onChange={(e) => setPlayers(Number(e.target.value))}
                >
                  {[3, 4, 5, 6].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <Table {...exercise} />
          <div className="table-facts">
            <span>
              Позиция <b>{exercise.position}</b>
            </span>
            <span>
              Стек <b>{exercise.stack} BB</b>
            </span>
            <span>
              Блайнды <b>{exercise.blinds}</b>
            </span>
          </div>
          <p className="trainer-context">{exercise.context}</p>
          <QuestionCard
            question={exercise}
            answer={answer}
            onAnswer={(choice) => saveAnswer(exercise, choice, key, "practice")}
          />
          <div className="inline-actions">
            <span className="content-source">
              Дополнительное учебное упражнение
            </span>
            <button
              className="primary"
              disabled={!answer}
              onClick={() =>
                setIndex(
                  (i) =>
                    (i + 1) %
                    (category === "math" ? 6 : category === "guided" ? 5 : 3),
                )
              }
            >
              {index ===
              (category === "math" ? 5 : category === "guided" ? 4 : 2)
                ? "К началу подборки"
                : category === "guided"
                  ? "Следующий шаг"
                  : "Следующая ситуация"}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
function Report({
  profile,
  notify,
}: {
  profile: Profile;
  notify: (m: string) => void;
}) {
  const [courseId, setCourseId] = useState(profile.lastLesson.split("-")[0]),
    [scope, setScope] = useState<"course" | "lesson">("course"),
    [screenshot, setScreenshot] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("report-capture", screenshot);
    return () => document.body.classList.remove("report-capture");
  }, [screenshot]);
  const course = courses.find((c) => c.id === courseId) || courses[0],
    lesson =
      course.lessons.find((l) => l.id === profile.lastLesson) ||
      course.lessons[0];
  const answers = Object.values(profile.answers).filter((a) =>
    scope === "lesson"
      ? a.lessonId === lesson.id
      : a.lessonId?.startsWith(course.id + "-"),
  );
  const completed = course.lessons.filter(
      (l) => profile.completed[l.id],
    ).length,
    correct = answers.filter((a) => a.correct).length;
  const errors = [
    ...new Set(answers.filter((a) => !a.correct).map((a) => a.topic)),
  ];
  const exam = Object.values(profile.answers).filter(
      (a) => a.kind === "exam" && a.lessonId?.startsWith(course.id + "-"),
    ),
    examTotal = course.lessons.length * 2;
  const latest =
    answers
      .map((a) => a.date)
      .sort()
      .at(-1) || profile.completed[lesson.id];
  const date = latest
    ? new Date(latest).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  const recommendations = errors.length
    ? errors.slice(0, 3)
    : answers.length
      ? ["Закрепите материал в тренажёре и объясните решение своими словами."]
      : ["Начните первый урок и ответьте на контрольные вопросы."];
  const title = scope === "lesson" ? lesson.title : `Курс ${course.name}`;
  const text = `СТЭК ACADEMY\n${profile.name}\n${date}\n${title}\nВыполнено задач: ${answers.length}\nВерных: ${correct} (${percent(correct, answers.length)}%)\nУроков курса завершено: ${completed}/${course.lessons.length}\nПовторить: ${recommendations.join("; ")}\nУчебные фишки без денежной стоимости.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      notify("Отчёт скопирован");
    } catch {
      notify("Копирование недоступно. Выделите текст отчёта на экране.");
    }
  }
  return (
    <div className={screenshot ? "screenshot-mode" : ""}>
      {!screenshot && (
        <>
          <div className="page-heading">
            <div>
              <div className="greeting">
                Понимание важнее результата раздачи
              </div>
              <h1>Ваш прогресс в игре.</h1>
              <p>
                Отдельный отчёт для «{profile.name}». Можно отправить обычным
                скриншотом.
              </p>
            </div>
          </div>
          <div className="report-controls">
            <label>
              Курс
              <select
                value={course.id}
                onChange={(e) => setCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="segmented">
              <button
                className={scope === "course" ? "selected" : ""}
                onClick={() => setScope("course")}
              >
                По курсу
              </button>
              <button
                className={scope === "lesson" ? "selected" : ""}
                onClick={() => setScope("lesson")}
              >
                Последний урок
              </button>
            </div>
          </div>
        </>
      )}
      <section className="report-card" aria-label="Отчёт ученика">
        <div className="report-brand">
          <Brand />
          <span>Карта обучения</span>
        </div>
        <div className="report-person">
          <span className="report-avatar">
            <UserRound size={31} />
          </span>
          <div>
            <h2>{profile.name}</h2>
            <span>{date}</span>
          </div>
          <span className="report-course-tag">{course.name}</span>
        </div>
        <h3 className="report-title">{title}</h3>
        <div className="report-score">
          <div
            className="score-ring"
            style={
              {
                "--score": `${percent(correct, answers.length)}%`,
              } as React.CSSProperties
            }
          >
            <span>
              <b>
                {percent(correct, answers.length)}
                <small>%</small>
              </b>
              верных ответов
            </span>
          </div>
          <div className="report-metrics">
            <div>
              <b>{answers.length}</b>
              <span>задач выполнено</span>
            </div>
            <div>
              <b>{correct}</b>
              <span>правильных решений</span>
            </div>
            <div>
              <b>
                {completed}
                <small> / {course.lessons.length}</small>
              </b>
              <span>уроков курса завершено</span>
            </div>
          </div>
        </div>
        <div className="report-section">
          <h3>{errors.length ? "Темы для повторения" : "Следующий шаг"}</h3>
          {recommendations.map((r, i) => (
            <p key={r}>
              <span>{fmt(i + 1)}</span>
              {r}
            </p>
          ))}
        </div>
        <div className="report-exam">
          <Flag size={18} />
          <span>Итоговый тест курса</span>
          <b>
            {exam.length
              ? `${exam.filter((a) => a.correct).length} верных из ${exam.length} · ${exam.length}/${examTotal} выполнено`
              : "Ещё не начат"}
          </b>
        </div>
        <div className="report-footnote">
          <ShieldCheck size={15} />
          Результат учебных заданий. Прогресс хранится на этом устройстве.
        </div>
      </section>
      <div className="report-actions">
        <button
          className="primary"
          onClick={() => {
            setScreenshot(!screenshot);
            window.scrollTo(0, 0);
          }}
        >
          {screenshot ? (
            <X size={17} />
          ) : (
            <ChartNoAxesColumnIncreasing size={17} />
          )}{" "}
          {screenshot ? "Вернуться" : "Экран для скриншота"}
        </button>
        <button className="secondary" onClick={copy}>
          <Copy size={17} />
          Скопировать отчёт
        </button>
      </div>
      {!screenshot && (
        <p className="report-disclaimer">
          Сохраняйте резервную копию в настройках: при очистке данных браузера
          результаты могут пропасть. Свободная практика в тренажёре учитывается
          отдельно; в этот отчёт входят задания выбранного курса.
        </p>
      )}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Закрыть">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function ProfileDialog({
  store,
  setStore,
  close,
  notify,
}: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  close: () => void;
  notify: (m: string) => void;
}) {
  const [name, setName] = useState("");
  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (store.profiles.length >= 50) {
      notify("Можно создать до 50 локальных профилей.");
      return;
    }
    if (
      store.profiles.some(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      notify("Такой псевдоним уже есть. Выберите его из списка.");
      return;
    }
    const p = newProfile(name);
    setStore((s) => ({ ...s, active: p.id, profiles: [...s.profiles, p] }));
    close();
  }
  return (
    <Modal title="Кто сегодня учится?" close={close}>
      <p>
        Только псевдоним или номер ученика. У каждого — свой прогресс на этом
        устройстве.
      </p>
      <div className="profiles-list">
        {store.profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setStore((s) => ({ ...s, active: p.id }));
              close();
            }}
          >
            <span className="avatar">
              <UserRound size={18} />
            </span>
            <span>
              {p.name}
              <small>{Object.keys(p.completed).length} уроков завершено</small>
            </span>
            {store.active === p.id ? (
              <Check size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        ))}
      </div>
      <form onSubmit={add}>
        <label className="field-label" htmlFor="nickname">
          Новый псевдоним
        </label>
        <div className="profile-form">
          <input
            id="nickname"
            name="nickname"
            autoComplete="off"
            spellCheck={false}
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Ученик 2"
            required
          />
          <button className="primary" disabled={!name.trim()}>
            <Plus size={18} />
            Добавить
          </button>
        </div>
      </form>
      <p className="content-note">
        Без аккаунта, пароля и синхронизации. Не вводите телефон или e-mail.
      </p>
    </Modal>
  );
}
function SettingsDialog({
  store,
  setStore,
  close,
  notify,
  unblock,
}: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  close: () => void;
  notify: (m: string) => void;
  unblock: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false),
    [pending, setPending] = useState<Store | null>(null),
    [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  async function read(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 5_000_000)
        throw new Error("Размер файла не должен превышать 5 МБ.");
      setPending(validateStore(JSON.parse(await file.text())));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось прочитать файл.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  return (
    <Modal title="Данные на этом устройстве" close={close}>
      <div className="settings-intro">
        <ShieldCheck size={25} />
        <p>
          Результаты не уходят в облако. Очистка браузера удаляет локальный
          прогресс. Резервная копия поможет его восстановить.
        </p>
      </div>
      <button
        className="settings-action"
        onClick={() => {
          downloadJSON(store);
          notify("Резервная копия подготовлена");
        }}
      >
        <Download size={21} />
        <span>
          <b>Экспорт прогресса</b>
          <small>Все псевдонимы, ответы и таймеры в JSON</small>
        </span>
        <ChevronRight size={17} />
      </button>
      <button
        className="settings-action"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={21} />
        <span>
          <b>Восстановить из файла</b>
          <small>Импорт резервной копии JSON</small>
        </span>
        <ChevronRight size={17} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => read(e.target.files?.[0])}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <div className="confirmation">
          <p>
            В файле {pending.profiles.length} профилей. Импорт заменит текущие
            данные на этом устройстве.
          </p>
          <button
            className="primary"
            onClick={() => {
              setStore(pending);
              unblock();
              setPending(null);
              notify("Прогресс восстановлен");
            }}
          >
            Заменить данные
          </button>
          <button className="text-button" onClick={() => setPending(null)}>
            Отмена
          </button>
        </div>
      )}
      <div className="settings-divider" />
      <button
        className="settings-action danger"
        onClick={() => setConfirmReset(true)}
      >
        <RotateCcw size={20} />
        <span>
          <b>Сбросить активного ученика</b>
          <small>
            {store.profiles.find((p) => p.id === store.active)?.name}
          </small>
        </span>
      </button>
      {confirmReset && (
        <div className="confirmation">
          <p>
            Удалить ответы, таймеры и отметки уроков активного ученика? Сначала
            сохраните копию, если хотите вернуть их позже.
          </p>
          <button
            className="danger-button"
            onClick={() => {
              setStore((s) => ({
                ...s,
                profiles: s.profiles.map((p) =>
                  p.id === s.active
                    ? {
                        ...p,
                        completed: {},
                        answers: {},
                        timers: {},
                        lastLesson: "start-01",
                      }
                    : p,
                ),
              }));
              unblock();
              setConfirmReset(false);
              notify("Прогресс активного ученика сброшен");
            }}
          >
            Сбросить прогресс
          </button>
          <button
            className="text-button"
            onClick={() => setConfirmReset(false)}
          >
            Отмена
          </button>
        </div>
      )}
      <p className="content-note">
        Офлайн-режим доступен после полной первой загрузки собранного приложения
        по HTTPS или на localhost. Установить приложение можно через меню
        браузера.
      </p>
    </Modal>
  );
}
