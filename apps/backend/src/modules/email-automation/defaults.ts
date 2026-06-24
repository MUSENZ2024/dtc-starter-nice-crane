export const ORDER_CONFIRMATION_TEMPLATE_KEY = "order_confirmation"

export const defaultOrderConfirmationTemplate = {
  key: ORDER_CONFIRMATION_TEMPLATE_KEY,
  name: "Order confirmation",
  subject: "Order #{{order_number}} confirmed — MUSE",
  enabled: true,
  delay_minutes: 0,
  html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;background:#f4f2ed;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <main style="max-width:560px;margin:0 auto;padding:32px 12px;">
      <section style="background:#ffffff;border-radius:8px;padding:40px 32px;">
        <p style="font-size:24px;font-weight:800;letter-spacing:.14em;margin:0 0 30px;">MUSE</p>
        <h1 style="font-size:34px;line-height:1.1;letter-spacing:-.04em;margin:0 0 20px;">You’re in.</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{customer_first_name}},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">We’ve received your order #{{order_number}}. We’ll email you once it has been dispatched with a tracking number.</p>
        <section style="background:#f7f6f2;border-radius:6px;margin:28px 0;padding:22px;">
          <p style="color:#707070;font-size:11px;font-weight:700;letter-spacing:.11em;margin:0 0 14px;">ORDER #{{order_number}}</p>
          {{order_items}}
          <p style="font-size:16px;font-weight:700;margin:16px 0 0;">Total {{order_total}}</p>
          <p style="color:#666666;font-size:13px;margin:8px 0 0;">Paid with {{payment_method}}</p>
        </section>
        {{personal_note}}
        <a href="{{tracking_url}}" style="display:block;background:#c8d241;border-radius:999px;color:#111111;font-size:13px;font-weight:800;letter-spacing:.08em;padding:14px 24px;text-align:center;text-decoration:none;">TRACK YOUR ORDER</a>
        <p style="color:#777777;font-size:12px;line-height:1.6;margin:28px 0 0;">Delivery updates are based on the latest carrier scan. If you need a hand, reply to this email and the MUSE team will help.</p>
      </section>
    </main>
  </body>
</html>`,
}

export const getOrderConfirmationTemplate = async (service: {
  listEmailTemplates: (filters: { key: string }) => Promise<Array<typeof defaultOrderConfirmationTemplate & { id?: string }>>
}) => {
  const templates = await service.listEmailTemplates({
    key: ORDER_CONFIRMATION_TEMPLATE_KEY,
  })

  return templates[0] || defaultOrderConfirmationTemplate
}
