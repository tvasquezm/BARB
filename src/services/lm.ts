export async function callLMStudio(messages: any[], lmBase: string, lmModel: string, maxTokens = 1500, timeout = 90000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(`${lmBase.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: lmModel || 'local-model', messages, temperature: 0.1, max_tokens: maxTokens, stream: false }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    return resp
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export default { callLMStudio }
