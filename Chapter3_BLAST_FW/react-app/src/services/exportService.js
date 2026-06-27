export function downloadMarkdown(testPlan, prefix = 'testplan') {
  const date = new Date().toISOString().split('T')[0]
  const filename = `${prefix}-${testPlan.jiraId}-${date}.md`
  const blob = new Blob([testPlan.rawMarkdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
