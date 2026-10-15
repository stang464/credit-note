"use client";
import { Card, Money, Transaction } from "./types";
export function CardStrip({
  cards,
  transactions,
  total,
  activeCard,
  setActiveCard,
  money,
  openAddCard,
}: {
  cards: Card[];
  transactions: Transaction[];
  total: number;
  activeCard: number;
  setActiveCard: (value: number) => void;
  money: Money;
  openAddCard: () => void;
}) {
  return (
    <section className="card-strip">
      <button
        className="card-tile all"
        onClick={() => setActiveCard(-1)}
        aria-pressed={activeCard === -1}
      >
        <b>ทุกบัตร</b>
        <span>ยอดใช้จ่ายรวม</span>
        <strong>{money(total)}</strong>
        <small>รอบเดือนปัจจุบัน</small>
      </button>
      {cards.map((card, i) => (
        <button
          key={card.cardId}
          className={`card-tile ${card.color ?? (i ? "violet" : "blue")}`}
          onClick={() => setActiveCard(i)}
          aria-pressed={activeCard === i}
        >
          <div>
            <b>{card.name}</b>
            <span>•••• {card.last4 ?? "----"}</span>
          </div>
          <small>{card.bank ?? "ไม่ระบุธนาคาร"}</small>
          <strong>
            {money(
              transactions
                .filter((t) => t.cardId === card.cardId)
                .reduce((s, t) => s + Number(t.amount), 0),
            )}
          </strong>
          <span>จากวงเงิน {money(card.creditLimit)}</span>
          <i>
            <em style={{ width: "25%" }} />
          </i>
        </button>
      ))}
      <button className="card-tile add-card" onClick={openAddCard}>
        ＋<b>เพิ่มบัตร</b>
        <span>เชื่อมต่อบัตรใหม่</span>
      </button>
    </section>
  );
}
