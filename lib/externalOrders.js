/**
 * Mock bridge for external systems.
 * Real implementation should POST to backend endpoint: /external/orders
 */
export async function postExternalOrder(payload) {
  await new Promise((r) => setTimeout(r, 500))
  if (!payload || !payload.items) return { ok: false }
  return {
    ok: true,
    orderId: `EXT-${Date.now().toString().slice(-6)}`,
  }
}

