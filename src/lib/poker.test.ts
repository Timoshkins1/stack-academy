import { describe, it, expect } from "vitest";
import {
  evaluate,
  showdown,
  potOdds,
  callEV,
  improvement,
  minRaise,
  raiseState,
  bettingReopened,
  actionOrder,
  positions,
  bluffThreshold,
  mdf,
  stackBB,
  twoBoards,
} from "./poker";
describe("Лучшая пятёрка из семи", () => {
  it("фулл-хаус старше двух пар, пример из START", () => {
    const r = showdown(
      ["As", "Kd", "7c", "7h", "2s"],
      ["Ah", "Qc"],
      ["Kc", "Kh"],
    );
    expect(r.winner).toBe(-1);
    expect(r.b.name).toBe("Фулл-хаус");
  });
  it("кикер решает равенство пары", () => {
    expect(
      showdown(["Ac", "7d", "7h", "4s", "2c"], ["Ah", "Kc"], ["Ad", "Qc"])
        .winner,
    ).toBe(1);
  });
  it("роял-флеш на борде делят все", () => {
    expect(
      showdown(["As", "Ks", "Qs", "Js", "Ts"], ["2h", "3d"], ["9c", "9d"])
        .winner,
    ).toBe(0);
  });
  it("общий стрит даёт сплит без использования личных карт", () => {
    expect(
      showdown(["9s", "8c", "7d", "6h", "5s"], ["Ac", "Kd"], ["Qc", "Jd"])
        .winner,
    ).toBe(0);
  });
  it("туз — младший в колесе, но не в Q-K-A-2-3", () => {
    expect(evaluate(["As", "2c", "3d", "4h", "5s", "Kd", "Qd"]).score).toEqual([
      4, 5,
    ]);
    expect(evaluate(["Qs", "Kc", "Ad", "2h", "3s"]).name).toBe("Старшая карта");
  });
  it("выбирает старший фулл-хаус из двух троек", () => {
    expect(evaluate(["As", "Ac", "Ad", "Kh", "Ks", "Kd", "2c"]).score).toEqual([
      6, 14, 13,
    ]);
  });
  it("у флеша учитывает пятый кикер", () => {
    expect(
      showdown(["As", "Qs", "9s", "4s", "2d"], ["8s", "3c"], ["7s", "Kd"])
        .winner,
    ).toBe(1);
  });
  it("каре на борде сравнивает личный кикер", () => {
    expect(
      showdown(["8s", "8h", "8d", "8c", "2s"], ["Ah", "3c"], ["Kh", "Qd"])
        .winner,
    ).toBe(1);
  });
  it("три пары: выбирает две старшие и лучший кикер", () => {
    expect(evaluate(["As", "Ah", "Ks", "Kh", "Qs", "Qh", "2d"]).score).toEqual([
      2, 14, 13, 12,
    ]);
  });
  it("отклоняет дубли и неверные карты", () => {
    expect(() => evaluate(["As", "As", "Kd", "Qh", "Tc"])).toThrow();
    expect(() => evaluate(["1s", "2c", "3d", "4h", "5s"])).toThrow();
  });
  it("все категории имеют ожидаемый порядок", () => {
    const hands = [
      ["As", "Kd", "9h", "7c", "2d"],
      ["As", "Ah", "9d", "7c", "2d"],
      ["As", "Ah", "9d", "9c", "2d"],
      ["As", "Ah", "Ad", "7c", "2d"],
      ["2s", "3h", "4d", "5c", "6d"],
      ["As", "Js", "9s", "7s", "2s"],
      ["As", "Ah", "Ad", "7c", "7d"],
      ["As", "Ah", "Ad", "Ac", "2d"],
      ["9s", "Ts", "Js", "Qs", "Ks"],
    ];
    hands.forEach((h, i) => expect(evaluate(h).score[0]).toBe(i));
  });
});
describe("Математика с явными допущениями", () => {
  it("pot odds: банк указан до ставки", () => {
    expect(potOdds(1000, 500)).toBe(0.25);
    expect(potOdds(2000, 1000)).toBe(0.25);
  });
  it("EV колла без будущих ставок", () => {
    expect(callEV(1000, 500, 0.3)).toBe(100);
    expect(callEV(1000, 500, 0.25)).toBe(0);
    expect(callEV(1000, 500, 0)).toBe(-500);
  });
  it("отличает порог блефа от порога колла", () => {
    expect(bluffThreshold(1000, 500)).toBeCloseTo(1 / 3);
    expect(bluffThreshold(2000, 3000)).toBe(0.6);
    expect(mdf(1000, 1500)).toBe(0.4);
  });
  it("9 чистых аутов: одна улица с тёрна или две с флопа", () => {
    expect(improvement(9, 1)).toBeCloseTo(9 / 46);
    expect(improvement(9, 2)).toBeCloseTo(0.349676, 5);
  });
  it("стеки в BB и защита от неверных вводных", () => {
    expect(stackBB(30000, 3000)).toBe(10);
    expect(() => potOdds(0, 500)).toThrow();
    expect(() => callEV(1000, 500, 1.2)).toThrow();
    expect(() => improvement(47, 1)).toThrow();
  });
});
describe("Торговля и процедура", () => {
  it("минимум зависит от последнего полного шага", () => {
    expect(minRaise(500, 300)).toBe(800);
    expect(minRaise(600, 400)).toBe(1000);
  });
  it("короткий олл-ин не обновляет полный шаг", () => {
    expect(raiseState(600, 400, 750)).toEqual({
      full: false,
      current: 750,
      lastFullRaise: 400,
    });
    expect(bettingReopened(600, 750, 400)).toBe(false);
    expect(bettingReopened(null, 750, 400)).toBe(true);
  });
  it("несколько коротких олл-инов могут совокупно открыть торговлю", () => {
    expect(bettingReopened(100, 200, 100)).toBe(true);
    expect(bettingReopened(125, 200, 100)).toBe(false);
    expect(minRaise(200, 100)).toBe(300);
  });
  it("полный рейз меняет шаг", () => {
    expect(raiseState(600, 400, 1100)).toEqual({
      full: true,
      current: 1100,
      lastFullRaise: 500,
    });
  });
  it.each([3, 4, 5, 6])("порядок действий для %i мест", (n) => {
    const p = positions(n);
    expect(actionOrder(n, "preflop")[0]).toBe(p[0]);
    expect(actionOrder(n, "postflop")[0]).toBe("SB");
    expect(actionOrder(n, "postflop", ["SB"])[0]).toBe("BB");
    expect(new Set(p).size).toBe(n);
  });
  it("2 Boards: только нераскрытые улицы и два использования", () => {
    expect(twoBoards("turn", 0, true)).toContain("только ривер");
    expect(twoBoards("flop", 1, true)).toContain("тёрн и ривер");
    expect(twoBoards("turn", 2, true)).toContain("исчерпан");
    expect(twoBoards("turn", 0, false)).toContain("инициатору");
  });
});
