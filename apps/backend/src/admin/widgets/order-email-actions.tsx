import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, Drawer, Label, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type OrderEmailTemplateKey =
  | "order_edited"
  | "order_invoice"
  | "order_payment_receipt"
  | "order_link"
  | "payment_reminder"
  | "payment_error"
  | "pending_payment_success"
  | "refund_update"
  | "order_cancelled"
  | "delivery_address_update"
  | "shipping_update"
  | "out_for_delivery"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up_by_customer"
  | "order_out_for_local_delivery"
  | "order_locally_delivered"
  | "order_missed_local_delivery"
  | "return_created"
  | "return_received"
  | "return_approved"
  | "return_declined"
  | "store_credit_issued"
  | "gift_card_created"
  | "customer_account_invite"
  | "customer_account_welcome"
  | "customer_password_reset"
  | "contact_customer"
  | "customer_email_change_confirmation"

type OrderEmailTemplate = {
  key: OrderEmailTemplateKey
  label: string
  subject: string
  description: string
}

const TEMPLATES: OrderEmailTemplate[] = [
  {
    key: "order_edited",
    label: "Order edited",
    subject: "MUSE NZ: Your order has been updated",
    description: "Tell the customer their order details have changed.",
  },
  {
    key: "order_invoice",
    label: "Order invoice",
    subject: "MUSE NZ: Invoice for your order",
    description: "Send the current invoice and order totals.",
  },
  {
    key: "order_payment_receipt",
    label: "Order payment receipt",
    subject: "MUSE NZ: Payment receipt for your order",
    description: "Confirm payment has been received.",
  },
  {
    key: "order_link",
    label: "Order link",
    subject: "MUSE NZ: Your order link",
    description: "Send a fresh order link or order status update.",
  },
  {
    key: "delivery_address_update",
    label: "Delivery or address update",
    subject: "MUSE NZ: Delivery update for your order",
    description: "Confirm a delivery method or address change.",
  },
  {
    key: "payment_reminder",
    label: "Payment reminder",
    subject: "MUSE NZ: Payment reminder for your order",
    description: "Nudge the customer when payment is still pending.",
  },
  {
    key: "payment_error",
    label: "Payment issue",
    subject: "MUSE NZ: Payment issue with your order",
    description: "Tell the customer payment could not be processed.",
  },
  {
    key: "pending_payment_success",
    label: "Pending payment success",
    subject: "MUSE NZ: Your payment has been processed",
    description: "Confirm a pending payment has cleared.",
  },
  {
    key: "refund_update",
    label: "Refund update",
    subject: "MUSE NZ: Refund update for your order",
    description: "Send an update about a refund.",
  },
  {
    key: "order_cancelled",
    label: "Order cancelled",
    subject: "MUSE NZ: Your order has been cancelled",
    description: "Confirm the order has been cancelled.",
  },
  {
    key: "shipping_update",
    label: "Shipping update",
    subject: "MUSE NZ: Shipping update for your order",
    description: "Send a general tracking or delivery update.",
  },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    subject: "MUSE NZ: Your order is out for delivery",
    description: "Tell the customer delivery is due soon.",
  },
  {
    key: "delivered",
    label: "Delivered",
    subject: "MUSE NZ: Your order has been delivered",
    description: "Confirm the order has been delivered.",
  },
  {
    key: "ready_for_pickup",
    label: "Ready for pickup",
    subject: "MUSE NZ: Your order is ready for pickup",
    description: "Tell the customer their order can be collected.",
  },
  {
    key: "picked_up_by_customer",
    label: "Picked up by customer",
    subject: "MUSE NZ: Your order has been picked up",
    description: "Confirm the customer has collected the order.",
  },
  {
    key: "order_out_for_local_delivery",
    label: "Order out for local delivery",
    subject: "MUSE NZ: Your order is out for local delivery",
    description: "Send a local-delivery dispatch update.",
  },
  {
    key: "order_locally_delivered",
    label: "Order locally delivered",
    subject: "MUSE NZ: Your order has been delivered",
    description: "Confirm a local delivery has been completed.",
  },
  {
    key: "order_missed_local_delivery",
    label: "Order missed local delivery",
    subject: "MUSE NZ: We missed you for delivery",
    description: "Tell the customer local delivery could not be completed.",
  },
  {
    key: "return_created",
    label: "Return created",
    subject: "MUSE NZ: Your return has been created",
    description: "Confirm a return has been opened.",
  },
  {
    key: "return_received",
    label: "Return received",
    subject: "MUSE NZ: We received your return",
    description: "Tell the customer their return has arrived.",
  },
  {
    key: "return_approved",
    label: "Return approved",
    subject: "MUSE NZ: Your return has been approved",
    description: "Approve a customer return request.",
  },
  {
    key: "return_declined",
    label: "Return declined",
    subject: "MUSE NZ: Return update for your order",
    description: "Decline or explain a return request.",
  },
  {
    key: "store_credit_issued",
    label: "Store credit issued",
    subject: "MUSE NZ: Store credit has been issued",
    description: "Tell the customer store credit is ready.",
  },
  {
    key: "gift_card_created",
    label: "Gift card created",
    subject: "MUSE NZ: Your gift card is ready",
    description: "Send a gift card notification.",
  },
  {
    key: "customer_account_invite",
    label: "Customer account invite",
    subject: "MUSE NZ: Create your MUSE account",
    description: "Invite a customer to create an account.",
  },
  {
    key: "customer_account_welcome",
    label: "Customer account welcome",
    subject: "MUSE NZ: Welcome to your MUSE account",
    description: "Welcome a customer after account activation.",
  },
  {
    key: "customer_password_reset",
    label: "Customer password reset",
    subject: "MUSE NZ: Reset your password",
    description: "Send a password reset support update.",
  },
  {
    key: "contact_customer",
    label: "Contact customer",
    subject: "MUSE NZ: Update about your order",
    description: "Send a flexible message about the order.",
  },
  {
    key: "customer_email_change_confirmation",
    label: "Email change confirmation",
    subject: "MUSE NZ: Email address updated",
    description: "Confirm the customer's email address was updated.",
  },
]

const OrderEmailActions = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const [open, setOpen] = useState(false)
  const [templateKey, setTemplateKey] = useState<OrderEmailTemplateKey>("order_edited")
  const [note, setNote] = useState("")
  const selectedTemplate = TEMPLATES.find((template) => template.key === templateKey) || TEMPLATES[0]

  const sendEmail = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/orders/${order.id}/email-updates`, {
        method: "POST",
        body: {
          template_key: templateKey,
          note: note.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Email sent")
      setOpen(false)
      setNote("")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Email failed to send")
    },
  })

  return (
    <Container className="px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Order emails
          </Text>
          <Text size="small" leading="compact" className="mt-1 text-ui-fg-subtle">
            Send a customer update using MUSE email templates.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          Send email
        </Button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Send order email</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto p-4">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Template
              </Label>
              <Select value={templateKey} onValueChange={(value) => setTemplateKey(value as OrderEmailTemplateKey)}>
                <Select.Trigger>
                  <Select.Value placeholder="Select an email" />
                </Select.Trigger>
                <Select.Content>
                  {TEMPLATES.map((template) => (
                    <Select.Item key={template.key} value={template.key}>
                      {template.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {selectedTemplate.description}
              </Text>
            </div>

            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
              <Text size="small" leading="compact" weight="plus">
                Subject
              </Text>
              <Text size="small" leading="compact" className="mt-1 text-ui-fg-subtle">
                {selectedTemplate.subject}
              </Text>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Note to customer
              </Label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Example: We updated the size to M and your order total is unchanged."
                rows={6}
                maxLength={1200}
              />
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Optional. This appears inside the email as a note from MUSE.
              </Text>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={sendEmail.isPending}>
                  Cancel
                </Button>
              </Drawer.Close>
              <Button size="small" isLoading={sendEmail.isPending} onClick={() => sendEmail.mutate()}>
                Send email
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderEmailActions
