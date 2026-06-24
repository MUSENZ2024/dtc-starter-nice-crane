import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  FocusModal,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type OrderWidgetData = {
  id: string
  email?: string | null
}

type EmailResponse = {
  html: string
  recipient: string
  subject: string
}

const initialTemplate = "order_confirmation"

const OrderEmailWidget = ({ data }: { data: OrderWidgetData }) => {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState(initialTemplate)
  const [note, setNote] = useState("")
  const [preview, setPreview] = useState<EmailResponse | null>(null)

  const previewEmail = useMutation({
    mutationFn: () =>
      sdk.client.fetch<EmailResponse>(`/admin/orders/${data.id}/email/preview`, {
        method: "POST",
        body: { template, note: note.trim() || undefined },
      }),
    onSuccess: (response) => setPreview(response),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not create preview")
    },
  })

  const sendEmail = useMutation({
    mutationFn: () =>
      sdk.client.fetch<EmailResponse>(`/admin/orders/${data.id}/email/send`, {
        method: "POST",
        body: { template, note: note.trim() || undefined },
      }),
    onSuccess: (response) => {
      toast.success(`Email sent to ${response.recipient}`)
      setOpen(false)
      setPreview(null)
      setNote("")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not send email")
    },
  })

  const resetPreview = () => setPreview(null)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" weight="plus">
            Customer email
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Send an approved MUSE email for this order.
          </Text>
        </div>
        <Button size="small" onClick={() => setOpen(true)}>
          Send email
        </Button>
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary" disabled={sendEmail.isPending}>
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => previewEmail.mutate()}
                  isLoading={previewEmail.isPending}
                  disabled={sendEmail.isPending}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  onClick={() => sendEmail.mutate()}
                  isLoading={sendEmail.isPending}
                  disabled={!preview || previewEmail.isPending}
                >
                  Send email
                </Button>
              </div>
            </FocusModal.Header>

            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-6 py-6">
                <div className="flex flex-col gap-y-2">
                  <Text size="small" leading="compact" weight="plus">
                    Recipient
                  </Text>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {data.email || "The order’s customer email address"}
                  </Text>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Text size="small" leading="compact" weight="plus">
                    Approved template
                  </Text>
                  <Select
                    value={template}
                    onValueChange={(value) => {
                      setTemplate(value)
                      resetPreview()
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Choose a template" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="order_confirmation">
                        Order confirmation
                      </Select.Item>
                    </Select.Content>
                  </Select>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    Includes order number, products, customer name, total, and payment method.
                  </Text>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Text size="small" leading="compact" weight="plus">
                    Personal note (optional)
                  </Text>
                  <Textarea
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value)
                      resetPreview()
                    }}
                    placeholder="Add a short note for this customer…"
                    rows={4}
                  />
                </div>

                {preview ? (
                  <div className="flex flex-col gap-y-3">
                    <div className="flex flex-col gap-y-1">
                      <Text size="small" leading="compact" weight="plus">
                        Preview: {preview.subject}
                      </Text>
                      <Text size="small" leading="compact" className="text-ui-fg-subtle">
                        This will be sent to {preview.recipient} from orders@musenz.com.
                      </Text>
                    </div>
                    <iframe
                      className="h-[620px] w-full rounded-lg border border-ui-border-base bg-ui-bg-base"
                      sandbox=""
                      srcDoc={preview.html}
                      title="Order email preview"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-ui-border-base p-6">
                    <Text size="small" leading="compact" className="text-ui-fg-subtle">
                      Choose the template and select Preview before sending. Changing the note requires a fresh preview.
                    </Text>
                  </div>
                )}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderEmailWidget
