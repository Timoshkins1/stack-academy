export const suits = { s: "♠", h: "♥", d: "♦", c: "♣" } as const;
export type Card = string;
const ranks = "23456789TJQKA";
export const handNames = [
  "Старшая карта",
  "Пара",
  "Две пары",
  "Тройка",
  "Стрит",
  "Флеш",
  "Фулл-хаус",
  "Каре",
  "Стрит-флеш",
];
function rank(c: Card) {
  return ranks.indexOf(c[0]) + 2;
}
export function validateCards(cards: Card[], count?: number) {
  if (
    (count !== undefined && cards.length !== count) ||
    new Set(cards).size !== cards.length ||
    cards.some((c) => !/^[2-9TJQKA][shdc]$/.test(c))
  )
    throw new Error("Нужны уникальные карты в формате As, Th, 2c.");
}
function five(cards: Card[]) {
  const values = cards.map(rank).sort((a, b) => b - a);
  const groups = [...new Set(values)]
    .map((v) => [values.filter((x) => x === v).length, v])
    .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const flush = cards.every((c) => c[1] === cards[0][1]);
  const unique = [...new Set(values)];
  const straight =
    unique.length === 5
      ? unique[0] - unique[4] === 4
        ? unique[0]
        : unique.join(",") === "14,5,4,3,2"
          ? 5
          : 0
      : 0;
  if (flush && straight) return [8, straight];
  if (groups[0][0] === 4) return [7, groups[0][1], groups[1][1]];
  if (groups[0][0] === 3 && groups[1][0] === 2)
    return [6, groups[0][1], groups[1][1]];
  if (flush) return [5, ...values];
  if (straight) return [4, straight];
  if (groups[0][0] === 3) return [3, ...groups.map((g) => g[1])];
  if (groups[0][0] === 2 && groups[1][0] === 2)
    return [2, ...groups.map((g) => g[1])];
  if (groups[0][0] === 2) return [1, ...groups.map((g) => g[1])];
  return [0, ...values];
}
export function compareRank(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
export function evaluate(cards: Card[]) {
  validateCards(cards);
  if (cards.length < 5 || cards.length > 7)
    throw new Error("Нужно от пяти до семи карт.");
  let best: number[] = [];
  let bestCards: Card[] = [];
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const selected = [cards[a], cards[b], cards[c], cards[d], cards[e]],
              score = five(selected);
            if (!best.length || compareRank(score, best) > 0) {
              best = score;
              bestCards = selected;
            }
          }
  return { score: best, cards: bestCards, name: handNames[best[0]] };
}
export function showdown(board: Card[], a: Card[], b: Card[]) {
  validateCards([...board, ...a, ...b], 9);
  validateCards(board, 5);
  validateCards(a, 2);
  validateCards(b, 2);
  const A = evaluate([...board, ...a]),
    B = evaluate([...board, ...b]);
  return { a: A, b: B, winner: compareRank(A.score, B.score) };
}
function positive(...n: number[]) {
  if (n.some((v) => !Number.isFinite(v) || v <= 0))
    throw new Error("Введите положительные числа.");
}
export function potOdds(potBeforeBet: number, bet: number) {
  positive(potBeforeBet, bet);
  return bet / (potBeforeBet + 2 * bet);
}
export function callEV(potBeforeBet: number, bet: number, equity: number) {
  positive(potBeforeBet, bet);
  if (!Number.isFinite(equity) || equity < 0 || equity > 1)
    throw new Error("Equity должна быть от 0 до 1.");
  return equity * (potBeforeBet + 2 * bet) - bet;
}
export function bluffThreshold(pot: number, bet: number) {
  positive(pot, bet);
  return bet / (pot + bet);
}
export function mdf(pot: number, bet: number) {
  return 1 - bluffThreshold(pot, bet);
}
export function stackBB(stack: number, bb: number) {
  positive(stack, bb);
  return stack / bb;
}
export function improvement(outs: number, streets: 1 | 2) {
  if (!Number.isInteger(outs) || outs < 0 || outs > 46)
    throw new Error("Ауты: целое число от 0 до 46.");
  return streets === 1
    ? outs / 46
    : 1 - ((47 - outs) / 47) * ((46 - outs) / 46);
}
export function minRaise(current: number, lastFullRaise: number) {
  positive(current, lastFullRaise);
  return current + lastFullRaise;
}
export function bettingReopened(
  actedAt: number | null,
  current: number,
  lastFullRaise: number,
) {
  return actedAt === null || current - actedAt >= lastFullRaise;
}
export function raiseState(
  current: number,
  lastFullRaise: number,
  raiseTo: number,
) {
  positive(current, lastFullRaise, raiseTo);
  if (raiseTo <= current)
    throw new Error("Новая ставка должна превышать текущую.");
  const full = raiseTo - current >= lastFullRaise;
  return {
    full,
    lastFullRaise: full ? raiseTo - current : lastFullRaise,
    current: raiseTo,
  };
}
export function positions(players: number) {
  const map: Record<number, string[]> = {
    3: ["BTN", "SB", "BB"],
    4: ["CO", "BTN", "SB", "BB"],
    5: ["HJ", "CO", "BTN", "SB", "BB"],
    6: ["UTG", "HJ", "CO", "BTN", "SB", "BB"],
  };
  if (!map[players]) throw new Error("От 3 до 6 игроков.");
  return map[players];
}
export function actionOrder(
  players: number,
  street: "preflop" | "postflop",
  folded: string[] = [],
) {
  const p = positions(players),
    order = street === "preflop" ? p : [...p.slice(-2), ...p.slice(0, -2)];
  return order.filter((x) => !folded.includes(x));
}
export function twoBoards(
  street: "preflop" | "flop" | "turn" | "river",
  used: number,
  initiator: boolean,
) {
  if (!initiator) return "Запрос доступен инициатору олл-ина.";
  if (used >= 2) return "Лимит двух использований исчерпан.";
  return {
    preflop: "Дважды открываются флоп, тёрн и ривер.",
    flop: "Общий флоп сохраняется. Дважды открываются тёрн и ривер.",
    turn: "Общие флоп и тёрн сохраняются. Дважды открывается только ривер.",
    river: "Все улицы открыты: повторно открывать нечего.",
  }[street];
}
