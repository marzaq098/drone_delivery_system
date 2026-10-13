const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function getTimestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function buildPassword(shortcode, passkey, timestamp) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

function parseCallbackItems(items = []) {
  const byName = new Map(items.map((it) => [it.Name, it.Value]))
  return {
    amount: Number(byName.get('Amount') ?? 0),
    transactionId: byName.get('MpesaReceiptNumber') || null,
    phoneNumber: String(byName.get('PhoneNumber') || ''),
  }
}

async function getAccessToken() {
  const key = requireEnv('MPESA_CONSUMER_KEY')
  const secret = requireEnv('MPESA_CONSUMER_SECRET')
  const auth = Buffer.from(`${key}:${secret}`).toString('base64')
  const url = `${SANDBOX_BASE}/oauth/v1/generate?grant_type=client_credentials`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Daraja token request failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.access_token
}

async function initiateSTKPush(phone, amount, orderId) {
  const token = await getAccessToken()
  const shortcode = requireEnv('MPESA_SHORTCODE')
  const passkey = requireEnv('MPESA_PASSKEY')
  const callbackUrl = requireEnv('MPESA_CALLBACK_URL')
  const timestamp = getTimestamp()
  const password = buildPassword(shortcode, passkey, timestamp)

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(Number(amount)),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: String(orderId),
    TransactionDesc: `Quantum Drop order ${orderId}`,
  }

  const res = await fetch(`${SANDBOX_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || 'STK push failed')
  }
  return data
}

function handleCallback(data) {
  const cb = data?.Body?.stkCallback
  if (!cb) {
    throw new Error('Invalid callback payload')
  }
  const parsed = parseCallbackItems(cb.CallbackMetadata?.Item || [])
  return {
    merchantRequestId: cb.MerchantRequestID || null,
    checkoutRequestId: cb.CheckoutRequestID || null,
    resultCode: Number(cb.ResultCode ?? -1),
    resultDesc: cb.ResultDesc || 'Unknown',
    ...parsed,
    status: Number(cb.ResultCode) === 0 ? 'PAID' : 'FAILED',
  }
}

module.exports = {
  getAccessToken,
  initiateSTKPush,
  handleCallback,
}

