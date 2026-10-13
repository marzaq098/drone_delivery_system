require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const http = require('http')
const { WebSocketServer } = require('ws')
const { initiateSTKPush, handleCallback } = require('./services/mpesaService')
const {
  upsertOrder,
  createPayment,
  findPaymentByCheckoutRequestId,
  updatePayment,
  getOrder,
} = require('./store/paymentStore')

const PORT = Number(process.env.PORT || 5000)

const app = express()
app.set('trust proxy', true)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  })
)
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/track/drone' })

const JWT_SECRET = process.env.JWT_SECRET || 'qdd-dev-secret'
const users = []
const vendors = [
  { id: 'r-skyline', name: 'Skyline Burgers', type: 'food' },
  { id: 'r-nebula', name: 'Nebula Pizza Lab', type: 'food' },
  { id: 'r-orbit', name: 'Orbit Juices', type: 'food' },
  { id: 'r-mama', name: 'Mama K Kitchen', type: 'food' },
  { id: 'g-qdd', name: 'QDD Fresh Hub', type: 'grocery' },
  { id: 'p-quantumcare', name: 'QuantumCare Pharmacy', type: 'pharmacy' },
]
const products = [
  { id: 'r-skyline:b1', vendorId: 'r-skyline', name: 'Quantum Smash Burger', price: 890, category: 'food' },
  { id: 'r-nebula:p1', vendorId: 'r-nebula', name: 'Ion Pepperoni', price: 1180, category: 'food' },
  { id: 'r-orbit:j1', vendorId: 'r-orbit', name: 'Mango Pulse', price: 260, category: 'food' },
  { id: 'r-mama:l1', vendorId: 'r-mama', name: 'Nyama Choma Box', price: 950, category: 'food' },
  { id: 'g:gv1', vendorId: 'g-qdd', name: 'Hydroponic lettuce mix', price: 320, category: 'grocery' },
  { id: 'g:dy1', vendorId: 'g-qdd', name: 'Farm yoghurt 500ml', price: 210, category: 'grocery' },
  { id: 'p:pp1', vendorId: 'p-quantumcare', name: 'Paracetamol 500mg', price: 120, category: 'pharmacy' },
  { id: 'p:cf2', vendorId: 'p-quantumcare', name: 'Cough syrup (codeine)', price: 890, category: 'pharmacy' },
]

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex')
}

function createJwt(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  })
}

function authRequired(req, res, next) {
  const raw = req.headers.authorization || ''
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function normalizeKenyanPhone(phone) {
  const p = String(phone || '').replace(/[^\d]/g, '')
  if (p.startsWith('254') && p.length === 12) return p
  if (p.startsWith('0') && p.length === 10) return `254${p.slice(1)}`
  return p
}

app.get('/health', (_req, res) => {
  res.json({ status: 'OK' })
})

function processMpesaCallback(req, res) {
  try {
    const callback = handleCallback(req.body)
    const payment = findPaymentByCheckoutRequestId(callback.checkoutRequestId)
    if (payment) {
      updatePayment(payment.id, {
        status: callback.status,
        transaction_id: callback.transactionId,
        result_code: callback.resultCode,
        result_desc: callback.resultDesc,
        amount: callback.amount || payment.amount,
        phone_number: callback.phoneNumber || payment.phone_number,
        callback_payload: req.body,
      })
      upsertOrder(payment.order_id, {
        payment_status: callback.status === 'PAID' ? 'PAID' : 'FAILED',
      })
    }
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return res.status(400).json({ ResultCode: 1, ResultDesc: error.message || 'Invalid callback' })
  }
}

app.post('/register', (req, res) => {
  const { fullName, name, email, password, role } = req.body || {}
  const resolvedName = (fullName || name || '').trim()
  if (!resolvedName || !email || !password) return res.status(400).json({ error: 'Missing required fields' })
  const existing = users.find((u) => u.email === String(email).toLowerCase())
  if (existing) return res.status(409).json({ error: 'Email already registered' })
  const user = {
    id: `u_${Date.now().toString(36)}`,
    fullName: resolvedName,
    email: String(email).toLowerCase(),
    passwordHash: hashPassword(password),
    role: role || 'customer',
  }
  users.push(user)
  const token = createJwt(user)
  return res.json({
    ok: true,
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  })
})

app.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = users.find((u) => u.email === String(email).toLowerCase())
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const token = createJwt(user)
  return res.json({
    ok: true,
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  })
})

app.get('/products', (_req, res) => {
  return res.json(products)
})
app.get('/vendors', (_req, res) => {
  return res.json(vendors)
})
const vendorProductsHandler = (req, res) => {
  return res.json(products.filter((p) => p.vendorId === req.params.id))
}
app.get('/vendors/:id/products', vendorProductsHandler)

const createOrderHandler = (req, res) => {
  const { order_id, user_id, items, total_price, delivery_location } = req.body || {}
  if (!order_id || !Array.isArray(items) || !Number.isFinite(Number(total_price))) {
    return res.status(400).json({ error: 'Invalid order payload' })
  }
  const order = upsertOrder(order_id, {
    user_id: user_id || req.user.sub,
    items,
    total_price: Number(total_price),
    delivery_location: delivery_location || null,
    order_status: 'CREATED',
    payment_status: 'PENDING',
  })
  return res.status(201).json({ ok: true, order })
}
app.post('/orders', authRequired, createOrderHandler)

app.post('/payments/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body || {}
    const normalizedPhone = normalizeKenyanPhone(phone)
    if (!/^2547\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format. Use 07... or 2547...' })
    }
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }
    if (!orderId) return res.status(400).json({ error: 'orderId is required' })

    upsertOrder(orderId, { payment_status: 'PENDING' })
    const stk = await initiateSTKPush(normalizedPhone, parsedAmount, orderId)
    const payment = createPayment({
      order_id: String(orderId),
      amount: Math.round(parsedAmount),
      status: 'PENDING',
      checkout_request_id: stk.CheckoutRequestID,
      merchant_request_id: stk.MerchantRequestID,
      phone_number: normalizedPhone,
      request_payload: req.body,
      response_payload: stk,
    })

    return res.json({
      ok: true,
      message: 'STK Push sent. Check your phone to complete payment.',
      paymentId: payment.id,
      checkoutRequestId: stk.CheckoutRequestID,
      merchantRequestId: stk.MerchantRequestID,
      customerMessage: stk.CustomerMessage,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to initiate STK push' })
  }
})

app.post('/payments/mpesa/callback', processMpesaCallback)

const orderPaymentHandler = (req, res) => {
  const order = getOrder(req.params.orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  return res.json(order)
}
app.get('/payments/order/:orderId', orderPaymentHandler)

wss.on('connection', (ws) => {
  let tick = null
  ws.on('message', (raw) => {
    let msg = null
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      msg = null
    }
    if (!msg || msg.type !== 'subscribe') return
    const startedAt = Date.now()
    if (tick) clearInterval(tick)
    tick = setInterval(() => {
      const t = ((Date.now() - startedAt) % 45000) / 45000
      ws.send(
        JSON.stringify({
          type: 'telemetry',
          payload: {
            droneId: msg.payload?.droneId || 'DRN-0001',
            latitude: -1.295 + t * 0.01,
            longitude: 36.8 + t * 0.02,
            speed: 32 + Math.round(6 * Math.sin(t * Math.PI * 4)),
            battery: Math.max(12, 95 - Math.round(t * 50)),
            status: t > 0.97 ? 'DELIVERED' : 'IN_TRANSIT',
          },
        })
      )
    }, 1200)
  })
  ws.on('close', () => {
    if (tick) clearInterval(tick)
  })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})

