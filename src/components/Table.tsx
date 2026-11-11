import { suits, positions } from "../lib/poker";
export function PlayingCard({
  card,
  small = false,
  back = false,
}: {
  card?: string;
  small?: boolean;
  back?: boolean;
}) {
  if (back || !card)
    return (
      <span
        className={`playing-card card-back ${small ? "small" : ""}`}
        aria-label="Закрытая карта"
      >
        <span>♠</span>
      </span>
    );
  const suit = suits[card[1] as keyof typeof suits],
    value = card[0] === "T" ? "10" : card[0];
  return (
    <span
      className={`playing-card suit-${card[1]} ${small ? "small" : ""}`}
      aria-label={`${value}${suit}`}
    >
      <b>
        {value}
        <span>{suit}</span>
      </b>
      <em>{suit}</em>
      <b className="corner">
        {value}
        <span>{suit}</span>
      </b>
    </span>
  );
}
export function Chips({ gold = false }: { gold?: boolean }) {
  return (
    <span className={`chips ${gold ? "gold-chips" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
export default function Table({
  board = ["Ac", "8d", "3s"],
  hero = ["Ah", "Qh"],
  villain = [],
  players = 6,
  position = "BTN",
  stack = 50,
  pot = 600,
  decorative = false,
  opponentStack,
}: {
  board?: string[];
  hero?: string[];
  villain?: string[];
  players?: number;
  position?: string;
  stack?: number;
  pot?: number;
  decorative?: boolean;
  opponentStack?: number;
}) {
  const seats = positions(players),
    heroIndex = seats.indexOf(position),
    safeIndex = heroIndex < 0 ? seats.indexOf("BTN") : heroIndex;
  return (
    <div
      className={`table-scene ${decorative ? "table-decorative" : ""}`}
      role="img"
      aria-label={`Учебный стол, ${players} игроков. Ваша позиция ${position}, стек ${stack} BB. Банк ${pot}. Борд ${board.join(" ") || "не открыт"}`}
    >
      <div className="table-rail">
        <div className="felt">
          <span className="felt-wordmark">
            СТЭК <span>ACADEMY</span>
          </span>
          <div className="board">
            {board.length ? (
              board.map((c) => <PlayingCard key={c} card={c} small />)
            ) : (
              <span className="preflop-label">Префлоп</span>
            )}
          </div>
          <span className="pot-label">
            Банк <b>{pot.toLocaleString("ru-RU")}</b>
          </span>
          <div className="pot-chips">
            <Chips />
            <Chips gold />
          </div>
        </div>
      </div>
      {!decorative &&
        seats.map((p, i) => {
          const angle = ((i - safeIndex) * 2 * Math.PI) / players + Math.PI / 2;
          const isHero = i === safeIndex;
          return (
            <div
              key={p}
              className={`seat ${isHero ? "hero-seat" : ""}`}
              style={{
                left: `${50 + 43 * Math.cos(angle)}%`,
                top: `${49 + 42 * Math.sin(angle)}%`,
              }}
            >
              <span className="seat-avatar">{isHero ? "Вы" : p}</span>
              <span>
                {p === "BTN" && <i className="dealer">D</i>}
                {p}{" "}
                <b>
                  {isHero ? stack : p === "BB" ? (opponentStack ?? stack) : 50}{" "}
                  BB
                </b>
              </span>
              {!isHero && villain.length > 0 && p === "BB" && (
                <div className="seat-cards">
                  {villain.map((c) => (
                    <PlayingCard key={c} card={c} small />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      <div className="hero-cards">
        {hero.map((c) => (
          <PlayingCard key={c} card={c} />
        ))}
        {decorative && <span className="dealer">D</span>}
      </div>
      {decorative && (
        <>
          <div className="decor-chips">
            <Chips gold />
            <Chips />
            <Chips />
          </div>
          <span className="table-caption">Сначала понять. Затем сыграть.</span>
        </>
      )}
    </div>
  );
}
