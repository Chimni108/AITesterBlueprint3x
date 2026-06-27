export default async function handler(req, res) {
  try {
    // req.url = /api/jira/rest/api/3/issue/SCRUM-5[?<vercel-injected-params>]
    // Split on '?' and take only the path — discard Vercel's injected route query params
    const cleanPath = (req.url || '').split('?')[0]
    const jiraRelativePath = cleanPath.replace(/^\/api\/jira/, '')
    const jiraUrl = `https://testlearn.atlassian.net${jiraRelativePath}`

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
    res.status(502).json({ error: 'JIRA proxy error', jiraUrl: null, details: err.message })
  }
}
