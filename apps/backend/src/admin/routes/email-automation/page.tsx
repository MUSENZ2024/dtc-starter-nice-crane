import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Envelope } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type EmailTemplate = {
  id: string
  key: string
  name: string
  subject: string
  html: string
  enabled: boolean
  delay_minutes: number
}

const templateTokens = [
  "{{customer_first_name}}",
  "{{order_number}}",
  "{{order_items}}",
  "{{order_total}}",
  "{{payment_method}}",
  "{{tracking_url}}",
  "{{personal_note}}",
]

const EmailAutomationPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ["email-templates"],
    queryFn: () => sdk.client.fetch("/admin/email-templates"),
  })
  const template = data?.templates.find(
    (item) => item.key === "order_confirmation"
  )
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [delayMinutes, setDelayMinutes] = useState("0")

  useEffect(() => {
    if (!template) return
    setSubject(template.subject)
    setHtml(template.html)
    setEnabled(template.enabled)
    setDelayMinutes(String(template.delay_minutes))
  }, [template])

  const save = useMutation({
    mutationFn: () => {
      if (!template) throw new Error("Order confirmation template is not ready")
      return sdk.client.fetch(`/admin/email-templates/${template.key}`, {
        method: "POST",
        body: {
          subject,
          html,
          enabled,
          delay_minutes: Number(delayMinutes),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Email automation saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save email automation")
    },
  })

  if (isLoading || !template) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-subtle">
          Loading email automation…
        </Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="flex items-start justify-between p-6">
        <div className="flex flex-col gap-y-1">
          <Heading>Email automation</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Edit the live HTML used for automatic and manual Order Confirmation emails.
          </Text>
        </div>
        <Badge color={enabled ? "green" : "grey"}>
          {enabled ? "Auto send on" : "Auto send paused"}
        </Badge>
      </Container>

      <Container className="flex flex-col gap-y-6 p-6">
        <div className="flex items-center justify-between gap-x-4 rounded-lg border border-ui-border-base p-4">
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact" weight="plus">
              Send automatically when an order is placed
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Pausing keeps manual sending available. Any due automatic emails wait until you resume.
            </Text>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} dir="ltr" />
        </div>

        <div className="flex flex-col gap-y-2">
          <Text size="small" leading="compact" weight="plus">
            Delay before automatic send (minutes)
          </Text>
          <Input
            min="0"
            max="43200"
            type="number"
            value={delayMinutes}
            onChange={(event) => setDelayMinutes(event.target.value)}
          />
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Use 0 to send at the next scheduler run (normally within one minute). Delayed emails use the latest saved HTML at send time.
          </Text>
        </div>

        <div className="flex flex-col gap-y-2">
          <Text size="small" leading="compact" weight="plus">
            Subject line
          </Text>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </div>

        <div className="flex flex-col gap-y-2">
          <Text size="small" leading="compact" weight="plus">
            HTML template
          </Text>
          <Textarea
            className="min-h-[560px] font-mono text-xs"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            spellCheck={false}
          />
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            This is raw HTML. Use the placeholders below exactly as written.
          </Text>
        </div>

        <div className="rounded-lg bg-ui-bg-subtle p-4">
          <Text size="small" leading="compact" weight="plus">
            Available placeholders
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            {templateTokens.map((token) => (
              <code className="rounded bg-ui-bg-base px-2 py-1 text-xs" key={token}>
                {token}
              </code>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="small"
            disabled={save.isPending || !subject.trim() || !html.trim() || Number(delayMinutes) < 0}
            isLoading={save.isPending}
            onClick={() => save.mutate()}
          >
            Save changes
          </Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Email automation",
  icon: Envelope,
})

export default EmailAutomationPage
