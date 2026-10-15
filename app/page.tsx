"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  AddCardModal,
  AddPlanModal,
  EditPlanModal,
  ForecastPanel,
  AddTransactionModal,
  CardStrip,
  DashboardPanels,
  DashboardTabs,
  Card,
  Transaction,
  Plan,
  Category,
} from "@/components/dashboard/sections";
export default function Home() {
  const [user, setUser] = useState({ name: "ผู้ใช้" });
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [modal, setModal] = useState<"transaction" | "card" | "plan" | "edit-plan" | null>(
    null,
  );
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [cardName, setCardName] = useState("");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [limit, setLimit] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [planName, setPlanName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [termCount, setTermCount] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [firstMonth, setFirstMonth] = useState("");
  const [paidTerms, setPaidTerms] = useState("0");
  const money = (value: number | string) =>
    "฿" + Number(value).toLocaleString("th-TH", { maximumFractionDigits: 2 });
  function resetModal() {
    setModal(null); setEditingPlan(null);
    setDescription(""); setAmount(""); setCategoryId(""); setCardName("");
    setBank(""); setLast4(""); setLimit(""); setStatementDay(""); setDueDay("");
    setPlanName(""); setPrincipal(""); setTermCount(""); setMonthlyAmount("");
    setFirstMonth(""); setPaidTerms("0");
  }
  useEffect(() => {
    const saved =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (saved) queueMicrotask(() => setUser(JSON.parse(saved)));
  }, []);
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const headers = { Authorization: "Bearer " + token };
    Promise.all(
      ["me", "cards", "transactions", "installment-plans", "categories"].map(
        (path) => fetch("/api/v1/" + path, { headers }),
      ),
    )
      .then(async (responses) => {
        if (responses.some((res) => res.status === 401)) {
          logout();
          return;
        }
        if (responses.some((res) => !res.ok))
          throw new Error("โหลดข้อมูลจาก API ไม่สำเร็จ");
        const data = await Promise.all(responses.map((res) => res.json()));
        setUser(data[0]);
        setCards(data[1].items);
        setTransactions(data[2].items);
        setPlans(data[3].items);
        setCategories(data[4].items);
        setCardId(data[1].items[0]?.cardId || "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"),
      )
      .finally(() => setLoading(false));
  }, []);
  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }
  async function addTransaction(event: FormEvent) {
    event.preventDefault();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        card_id: cardId,
        txn_date: new Date().toISOString().slice(0, 10),
        description,
        amount: Number(amount),
        txn_type: "PURCHASE",
        category_id: categoryId || null,
      }),
    });
    if (!res.ok) {
      setError("บันทึกรายการไม่สำเร็จ");
      return;
    }
    const item = await res.json();
    setTransactions((current) => [item, ...current]);
    setDescription("");
    setAmount("");
    resetModal();
    window.location.reload();
  }
  async function addCard(event: FormEvent) {
    event.preventDefault();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        name: cardName,
        bank,
        last4,
        credit_limit: Number(limit),
        statement_day: Number(statementDay),
        due_day: Number(dueDay),
        color: "blue",
      }),
    });
    if (!res.ok) {
      setError("เพิ่มบัตรไม่สำเร็จ");
      return;
    }
    const card = await res.json();
    setCards((current) => [card, ...current]);
    setCardName("");
    setBank("");
    setLast4("");
    setLimit("");
    setStatementDay("");
    setDueDay("");
    resetModal();
    window.location.reload();
  }
  async function addPlan(event: FormEvent) {
    event.preventDefault();
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/installment-plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        card_id: cardId,
        item_name: planName,
        principal: principal ? Number(principal) : null,
        term_count: Number(termCount),
        monthly_amount: Number(principal) / Number(termCount),
        first_statement_month: firstMonth,
        paid_terms: Number(paidTerms),
      }),
    });
    if (!res.ok) {
      setError("เพิ่มรายการผ่อนไม่สำเร็จ");
      return;
    }
    const plan = await res.json();
    setPlans((current) => [plan, ...current]);
    setPlanName("");
    setPrincipal("");
    setTermCount("");
    setMonthlyAmount("");
    setFirstMonth("");
    setPaidTerms("0");
    resetModal();
    window.location.reload();
  }
  async function updatePlan(event: FormEvent) {
    event.preventDefault();
    if (!editingPlan) return;
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/installment-plans/" + editingPlan.planId, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        item_name: planName,
        monthly_amount: Number(monthlyAmount),
      }),
    });
    if (!res.ok) {
      setError("แก้ไขรายการผ่อนไม่สำเร็จ");
      return;
    }
    const updated = await res.json();
    setPlans((current) =>
      current.map((item) =>
        item.planId === editingPlan.planId ? { ...item, ...updated, itemName: planName, monthlyAmount: Number(monthlyAmount) } : item,
      ),
    ); resetModal();
  }
  async function deletePlan(plan: Plan) {
    if (!window.confirm("ต้องการลบรายการผ่อนนี้และงวดทั้งหมดหรือไม่")) return;
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/installment-plans/" + plan.planId, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) {
      setError("ลบรายการผ่อนไม่สำเร็จ");
      return;
    }
    setPlans((current) =>
      current.filter((item) => item.planId !== plan.planId),
    );
  }
  async function unpayPlan(plan: Plan) {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch(
      "/api/v1/installment-plans/" + plan.planId + "/unpay",
      { method: "POST", headers: { Authorization: "Bearer " + token } },
    );
    if (!res.ok) {
      setError("ยกเลิกงวดล่าสุดไม่สำเร็จ");
      return;
    }
    setPlans((current) =>
      current.map((item) =>
        item.planId === plan.planId
          ? {
              ...item,
              paid_terms: Math.max(0, item.paid_terms - 1),
              remaining_terms: item.remaining_terms + 1,
              remaining_balance:
                item.remaining_balance + Number(item.monthlyAmount),
            }
          : item,
      ),
    );
  }
  async function payPlan(plan: Plan) {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch(
      "/api/v1/installment-plans/" + plan.planId + "/pay",
      { method: "POST", headers: { Authorization: "Bearer " + token } },
    );
    if (!res.ok) {
      setError("จ่ายงวดไม่สำเร็จ");
      return;
    }
    setPlans((current) =>
      current.map((item) =>
        item.planId === plan.planId
          ? {
              ...item,
              paid_terms: item.paid_terms + 1,
              remaining_terms: Math.max(0, item.remaining_terms - 1),
              remaining_balance: Math.max(
                0,
                item.remaining_balance - Number(item.monthlyAmount),
              ),
            }
          : item,
      ),
    );
  }
  async function deleteTransaction(item: Transaction) {
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่")) return;
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const res = await fetch("/api/v1/transactions/" + item.txnId, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) {
      setError("ลบรายการไม่สำเร็จ");
      return;
    }
    setTransactions((current) =>
      current.filter((entry) => entry.txnId !== item.txnId),
    );
  }
  if (loading)
    return (
      <main className="app-page">
        <p>กำลังโหลดข้อมูลจาก API…</p>
      </main>
    );
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter((item) => (item.statementMonth ?? item.txnDate).slice(0, 7) === monthKey);
  const selectedCardId = activeCard >= 0 ? cards[activeCard]?.cardId : undefined;
  const visibleTransactions = selectedCardId
    ? monthlyTransactions.filter((item) => item.cardId === selectedCardId)
    : monthlyTransactions;
  const visiblePlans = selectedCardId
    ? plans.filter((item) => item.cardId === selectedCardId)
    : plans;
  const visibleCards = selectedCardId
    ? cards.filter((item) => item.cardId === selectedCardId)
    : cards;
  const overallTotal = monthlyTransactions
    .filter((item) => item.status !== "VOID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const total = visibleTransactions
    .filter((item) => item.status !== "VOID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const installmentTotal = visiblePlans.reduce(
    (sum, item) => sum + Number(item.remaining_balance),
    0,
  );
  const monthlyInstallment = visiblePlans
    .filter((item) => item.remaining_terms > 0)
    .reduce((sum, item) => sum + Number(item.monthlyAmount), 0);
  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">CARD BOOK</p>
          <h1>สมุดบัตรเครดิต</h1>
          <p className="lede">จดรายการใช้จ่ายและรายการผ่อน แยกรายบัตร</p>
        </div>
        <div className="user-actions">
          เข้าสู่ระบบเป็น <b>{user.name}</b>
          <button className="outline-button" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
      </header>
      {error && <p className="form-message">{error}</p>}
      <CardStrip
        cards={cards}
        transactions={monthlyTransactions}
        total={overallTotal}
        activeCard={activeCard}
        setActiveCard={setActiveCard}
        money={money}
        openAddCard={() => setModal("card")}
      />
      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <DashboardPanels
        activeTab={activeTab}
        cards={cards}
        transactions={visibleTransactions}
        plans={visiblePlans}
        total={total}
        monthlyInstallment={monthlyInstallment}
        installmentTotal={installmentTotal}
        money={money}
        openAdd={() => setModal("transaction")}
        openAddCard={() => setModal("card")}
        openAddPlan={() => setModal("plan")}
        onEditPlan={(plan) => { setEditingPlan(plan); setPlanName(plan.itemName); setMonthlyAmount(String(plan.monthlyAmount)); setModal("edit-plan"); }}
        onDeletePlan={deletePlan}
        onUnpayPlan={unpayPlan}
        onPayPlan={payPlan}
        onDeleteTransaction={deleteTransaction}
      />
      <ForecastPanel plans={visiblePlans} cards={visibleCards} money={money} />
      {modal === "transaction" && (
        <AddTransactionModal
          cards={cards}
          categories={categories}
          cardId={cardId}
          setCardId={setCardId}
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          close={resetModal}
          submit={addTransaction}
        />
      )}
      {modal === "card" && (
        <AddCardModal
          close={resetModal}
          submit={addCard}
          name={cardName}
          setName={setCardName}
          bank={bank}
          setBank={setBank}
          last4={last4}
          setLast4={setLast4}
          limit={limit}
          setLimit={setLimit}
          statementDay={statementDay}
          setStatementDay={setStatementDay}
          dueDay={dueDay}
          setDueDay={setDueDay}
        />
      )}
      {modal === "plan" && (
        <AddPlanModal
          cards={cards}
          cardId={cardId}
          setCardId={setCardId}
          itemName={planName}
          setItemName={setPlanName}
          principal={principal}
          setPrincipal={setPrincipal}
          termCount={termCount}
          setTermCount={setTermCount}
          monthlyAmount={monthlyAmount}
          setMonthlyAmount={setMonthlyAmount}
          firstMonth={firstMonth}
          setFirstMonth={setFirstMonth}
          paidTerms={paidTerms}
          setPaidTerms={setPaidTerms}
          close={resetModal}
          submit={addPlan}
        />
      )}
      {modal === "edit-plan" && editingPlan && <EditPlanModal plan={editingPlan} itemName={planName} setItemName={setPlanName} monthlyAmount={monthlyAmount} setMonthlyAmount={setMonthlyAmount} close={resetModal} submit={updatePlan} />}
    </main>
  );
}
