import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary, getRecords } from '../services/api'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { SkeletonCard } from '../components/Skeleton'
import { formatINR } from '../utils/formatCurrency'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

function getUser() { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } }
const IC = '#10b981', EC = '#f43f5e'

function computeStats(records) {
  const income = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + parseFloat(r.amount), 0)
  const expenses = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + parseFloat(r.amount), 0)
  const catMap = {}, monthMap = {}
  records.forEach(r => { const k = r.category+'||'+r.type; if(!catMap[k]) catMap[k]={category:r.category,type:r.type,total:0}; catMap[k].total+=parseFloat(r.amount) })
  records.forEach(r => { const m=(r.date||'').slice(0,7),k=m+'||'+r.type; if(!monthMap[k]) monthMap[k]={month:m,type:r.type,total:0}; monthMap[k].total+=parseFloat(r.amount) })
  return { totalIncome:income, totalExpenses:expenses, netBalance:income-expenses, categoryTotals:Object.values(catMap).sort((a,b)=>b.total-a.total), monthlySummary:Object.values(monthMap).sort((a,b)=>b.month.localeCompare(a.month)), recentTransactions:records.slice(0,5) }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const isAdmin = user.roles?.includes('ROLE_ADMIN')
  const username = user.username || ''
  const firstName = username ? username.charAt(0).toUpperCase()+username.slice(1) : 'there'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      if (isAdmin) {
        const res = await getDashboardSummary()
        const d = res.data
        setStats({ totalIncome:parseFloat(d.totalIncome||0), totalExpenses:parseFloat(d.totalExpenses||0), netBalance:parseFloat(d.netBalance||0), categoryTotals:d.categoryTotals||[], monthlySummary:d.monthlySummary||[], recentTransactions:d.recentTransactions||[] })
      } else {
        const res = await getRecords(0, 200, 'date', 'desc')
        const all = res.data.content || []
        const own = all.filter(r => r.username === username)
        console.log('[Dashboard] user='+username+' api='+all.length+' own='+own.length)
        setStats(computeStats(own))
      }
    } catch(e) {
      setError(e.response?.status===403 ? 'Access denied.' : (e.response?.data?.message||'Failed to load'))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const income = stats?.totalIncome||0, expenses = stats?.totalExpenses||0, net = stats?.netBalance||0
  const isEmpty = !loading && !error && income===0 && expenses===0
  const ratio = income+expenses>0 ? Math.round(income/(income+expenses)*100) : 0
  const pieData = [{name:'Income',value:income,fill:IC},{name:'Expense',value:expenses,fill:EC}].filter(d=>d.value>0)

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hi, {firstName} </h1>
            <p className="text-slate-400 text-sm mt-0.5">{isAdmin?'Global overview':'Your personal overview'}  {new Date().toLocaleDateString('en-IN',{dateStyle:'long'})}</p>
          </div>
          {isAdmin && <span className="badge badge-admin px-3 py-1 text-xs">ADMIN</span>}
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4">{error} <button onClick={load} className="underline ml-2 text-xs">Retry</button></div>}
        {loading && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>}
        {!loading && !error && isEmpty && (
          <div className="card flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4"></div>
            <h2 className="text-lg font-bold text-slate-700 mb-1">No financial data yet</h2>
            <p className="text-slate-400 text-sm mb-6">Start tracking your income and expenses.</p>
            <button onClick={()=>navigate('/records')} className="btn-primary">+ Add your first record</button>
          </div>
        )}
        {stats && !isEmpty && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Income" value={formatINR(income)} sub="All time earnings" color="green" icon=""/>
              <StatCard label="Total Expenses" value={formatINR(expenses)} sub="All time spending" color="red" icon=""/>
              <StatCard label="Net Balance" value={formatINR(net)} sub={net>=0?'Surplus':'Deficit'} color={net>=0?'blue':'red'} icon={net>=0?'':'!'}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card"><h2 className="text-sm font-bold text-slate-700 mb-4">Spending by Category</h2>
                {!stats.categoryTotals?.length ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div> : (
                  <ResponsiveContainer width="100%" height={220}><BarChart data={stats.categoryTotals} margin={{top:0,right:0,left:-10,bottom:0}}>
                    <XAxis dataKey="category" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} tickFormatter={v=>'₹'+(v/1000).toFixed(0)+'k'}/>
                    <Tooltip formatter={v=>[formatINR(v),'Total']} contentStyle={{fontSize:12,borderRadius:12,border:'1px solid #e2e8f0'}} cursor={{fill:'#f1f5f9'}}/>
                    <Bar dataKey="total" radius={[6,6,0,0]} maxBarSize={44}>{stats.categoryTotals.map((e,i)=><Cell key={i} fill={e.type==='INCOME'?IC:EC}/>)}</Bar>
                  </BarChart></ResponsiveContainer>
                )}
              </div>
              <div className="card"><h2 className="text-sm font-bold text-slate-700 mb-4">Income vs Expense</h2>
                {!pieData.length ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data</div> : (
                  <ResponsiveContainer width="100%" height={220}><PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={4}>{pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Pie>
                    <Tooltip formatter={v=>formatINR(v)} contentStyle={{fontSize:12,borderRadius:12,border:'1px solid #e2e8f0'}}/>
                    <Legend iconType="circle" iconSize={8} formatter={v=><span className="text-xs text-slate-600">{v}</span>}/>
                  </PieChart></ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-4"><h2 className="text-sm font-bold text-slate-700">Recent Transactions</h2><button onClick={()=>navigate('/records')} className="text-xs text-brand-600 hover:text-brand-800 font-medium">View all </button></div>
              {!stats.recentTransactions?.length ? <p className="text-slate-400 text-sm py-4 text-center">No transactions yet</p> : (
                <div className="space-y-1">{stats.recentTransactions.map((tx,i)=>(
                  <div key={tx.id||i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 '+(tx.type==='INCOME'?'bg-income-light text-income':'bg-expense-light text-expense')}>{tx.type==='INCOME'?'':''}</div>
                      <div><p className="text-sm font-semibold text-slate-700">{tx.category}</p><p className="text-xs text-slate-400">{tx.date}</p></div>
                    </div>
                    <span className={'text-sm font-bold '+(tx.type==='INCOME'?'text-income-text':'text-expense-text')}>{tx.type==='INCOME'?'+':''}{formatINR(tx.amount)}</span>
                  </div>
                ))}</div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}