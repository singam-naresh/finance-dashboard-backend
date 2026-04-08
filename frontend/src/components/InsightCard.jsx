/**
 * Smart insight strip — generates contextual tips from dashboard data.
 */
export default function InsightCard({ data }) {
  if (!data) return null

  const income   = parseFloat(data.totalIncome)
  const expenses = parseFloat(data.totalExpenses)
  const top      = data.categoryTotals?.[0]

  const insights = []

  if (top) {
    insights.push({
      icon: '📌',
      text: `Top category: <strong>${top.category}</strong> — ₹${Number(top.total).toLocaleString('en-IN')}`,
    })
  }

  if (income > 0 && expenses > 0) {
    const ratio = Math.round((expenses / income) * 100)
    if (ratio > 80) {
      insights.push({ icon: '⚠️', text: `You're spending <strong>${ratio}%</strong> of your income. Consider reducing expenses.` })
    } else {
      insights.push({ icon: '✅', text: `You're spending <strong>${ratio}%</strong> of income — healthy range.` })
    }
  }

  if (data.monthlySummary?.length >= 2) {
    const months = data.monthlySummary.filter((m) => m.type === 'EXPENSE')
    if (months.length >= 2) {
      const latest = parseFloat(months[0].total)
      const prev   = parseFloat(months[1].total)
      if (prev > 0) {
        const change = Math.round(((latest - prev) / prev) * 100)
        if (change > 0) {
          insights.push({ icon: '📈', text: `Expenses up <strong>${change}%</strong> vs last month.` })
        } else if (change < 0) {
          insights.push({ icon: '📉', text: `Expenses down <strong>${Math.abs(change)}%</strong> vs last month — great job!` })
        }
      }
    }
  }

  if (!insights.length) return null

  return (
    <div className="card py-4 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Smart Insights</p>
      {insights.map((ins, i) => (
        <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
          <span className="text-base shrink-0">{ins.icon}</span>
          <span dangerouslySetInnerHTML={{ __html: ins.text }} />
        </div>
      ))}
    </div>
  )
}
