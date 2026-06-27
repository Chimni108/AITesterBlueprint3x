export default async function handler(req, res) {
  try {
    // req.query.path holds the catch-all segments: ['rest','api','3','issue','SCRUM-5']
    const pathSegments = req.query.path
    const jiraPath = Array.isArray(pathSegments)
      ? pathSegments.join('/')
      : (pathSegments || '')

    // Build JIRA query string from req.query, excluding the 'path' route parameter
    // (Vercel injects route params into req.query alongside real query params)
    const { path: _ignored, ...realQueryParams } = req.query
    const qs = new URLSearchParams(realQueryParams).toString()

    const jiraUrl = `https://testlearn.atlassian.net/${jiraPath}${qs ? '?' + qs : ''}`

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check',
    }

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization
    }

    const fetchOptions = { method: req.method, headers }

    if (!['GET', 'HEAD'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const response = await fetch(jiraUrl, fetchOptions)
    const text = await response.text()
    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)
    res.status(response.status).end(text)
  } catch (err) {
    res.status(502).json({ error: 'JIRA proxy error', details: err.message })
  }
}
