export default async function handler(req, res) {
  const pathSegments = req.query.path
  const jiraPath = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '')

  // Preserve query string from original request
  const reqUrl = new URL(req.url, 'http://placeholder')
  const jiraUrl = `https://testlearn.atlassian.net/${jiraPath}${reqUrl.search}`

  const fetchOptions = {
    method: req.method,
    headers: {
      Authorization: req.headers['authorization'] || '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check',
    },
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = JSON.stringify(req.body)
  }

  try {
    const response = await fetch(jiraUrl, fetchOptions)
    const text = await response.text()
    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)
    res.status(response.status).end(text)
  } catch (err) {
    res.status(502).json({ error: 'JIRA proxy error', details: err.message })
  }
}
