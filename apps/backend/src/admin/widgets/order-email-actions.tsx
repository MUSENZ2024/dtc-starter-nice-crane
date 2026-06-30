import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, Drawer, Label, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type OrderEmailTemplateKey =
  | "order_edited"
  | "payment_reminder"
  | "payment_error"
  | "refund_update"
  | "order_cancelled"
  | "delivery_address_update"

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
