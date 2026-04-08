export function exportToCsv(rows, filename = 'records.csv') {
  if (!rows.length) return
  const headers = ['ID', 'Date', 'Category', 'Type', 'Amount', 'Description', 'User']
  const lines = rows.map((r) =>
    [r.id, r.date, r.category, r.type, r.amount, r.description ?? '', r.username].join(',')
  )
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
