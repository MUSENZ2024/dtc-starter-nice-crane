import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Spinner } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  Input,
  Label,
  Switch,
  Text,
  toast
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

const TRACKING_FIELDS = [
  "id",
  "display_id",
  "fulfillments.id",
  "fulfillments.shipped_at",
  "fulfillments.canceled_at",
  "fulfillments.labels.id",
  "fulfillments.labels.tracking_number"
].join(",")

type OrderWithTracking = Omit<HttpTypes.AdminOrder, "fulfillments"> & {
  fulfillments?: (HttpTypes.AdminOrderFulfillment & {
    labels?: {
      id: string
      tracking_number: string
    }[]
  })[]
}

const OrderTrackingRecovery = ({
  data: order
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const queryClient = useQueryClient()
  const [selectedFulfillmentId, setSelectedFulfillmentId] = useState<
    string | null
  >(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [sendNotification, setSendNotification] = useState(true)
  const [trackingNumberError, setTrackingNumberError] = useState("")

  const trackingQuery = useQuery({
    queryKey: ["order-tracking-recovery", order.id],
    queryFn: () =>
      sdk.admin.order.retrieve(order.id, {
        fields: TRACKING_FIELDS
      })
  })

  const closeDrawer = () => {
    setSelectedFulfillmentId(null)
    setTrackingNumber("")
    setTrackingUrl("")
    setSendNotification(true)
    setTrackingNumberError("")
  }

  const attachTracking = useMutation({
    mutationFn: () =>
      sdk.client.fetch(
        `/admin/orders/${order.id}/fulfillments/${selectedFulfillmentId}/tracking`,
        {
          method: "POST",
          body: {
            tracking_number: trackingNumber.trim(),
            tracking_url: trackingUrl.trim() || undefined,
            send_notification: sendNotification
          }
        }
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["order-tracking-recovery", order.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ["orders", "detail", order.id]
        })
      ])
      toast.success(
        sendNotification
          ? "Tracking added and shipped email queued"
          : "Tracking added"
      )
      closeDrawer()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Tracking could not be added"
      )
    }
  })

  const handleSubmit = () => {
    if (!trackingNumber.trim()) {
      setTrackingNumberError("Tracking number is required.")
      return
    }

    attachTracking.mutate()
  }

  if (trackingQuery.isLoading) {
    return (
      <Container className="flex items-center gap-3 px-6 py-4">
        <Spinner className="animate-spin" />
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Checking shipment tracking…
        </Text>
      </Container>
    )
  }

  if (trackingQuery.isError) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Shipment tracking check failed
        </Text>
        <Text size="small" leading="compact" className="mt-1 text-ui-fg-subtle">
          Refresh the order page before updating this shipment.
        </Text>
      </Container>
    )
  }

  const trackedOrder = trackingQuery.data?.order as
    | OrderWithTracking
    | undefined
  const missingTracking = (trackedOrder?.fulfillments || []).filter(
    (fulfillment) =>
      Boolean(fulfillment.shipped_at) &&
      !fulfillment.canceled_at &&
      !fulfillment.labels?.some((label) => label.tracking_number?.trim())
  )

  if (!missingTracking.length) {
    return null
  }

  return (
    <Container className="px-6 py-4">
      <div className="flex flex-col gap-3">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Missing shipment tracking
          </Text>
          <Text
            size="small"
            leading="compact"
            className="mt-1 text-ui-fg-subtle"
          >
            This order was marked as shipped without a tracking number. Add it
            here to finish the shipment record and send the customer update.
          </Text>
        </div>

        {missingTracking.map((fulfillment, index) => (
          <div
            key={fulfillment.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3"
          >
            <div>
              <Text size="small" leading="compact" weight="plus">
                Fulfillment {index + 1}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                Shipped · tracking missing
              </Text>
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setSelectedFulfillmentId(fulfillment.id)}
            >
              Add tracking
            </Button>
          </div>
        ))}
      </div>

      <Drawer
        open={Boolean(selectedFulfillmentId)}
        onOpenChange={(open) => {
          if (!open && !attachTracking.isPending) {
            closeDrawer()
          }
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Add missing tracking</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto p-4">
            <div className="flex flex-col gap-y-2">
              <Label
                htmlFor="recovery-tracking-number"
                size="small"
                weight="plus"
              >
                Tracking number
              </Label>
              <Input
                id="recovery-tracking-number"
                value={trackingNumber}
                onChange={(event) => {
                  setTrackingNumber(event.target.value.toUpperCase())
                  setTrackingNumberError("")
                }}
                placeholder="e.g. EB857148677CN"
                autoComplete="off"
              />
              {trackingNumberError ? (
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-error"
                >
                  {trackingNumberError}
                </Text>
              ) : null}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="recovery-tracking-url" size="small" weight="plus">
                Carrier tracking URL
              </Label>
              <Input
                id="recovery-tracking-url"
                type="url"
                value={trackingUrl}
                onChange={(event) => setTrackingUrl(event.target.value)}
                placeholder="Optional"
                autoComplete="off"
              />
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                Leave blank to use the MUSE tracking page.
              </Text>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border-base p-3">
              <div>
                <Text size="small" leading="compact" weight="plus">
                  Send shipped email
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  Email the customer after tracking is saved.
                </Text>
              </div>
              <Switch
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={attachTracking.isPending}
                >
                  Cancel
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                isLoading={attachTracking.isPending}
                onClick={handleSubmit}
              >
                Save tracking
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details"
})

export default OrderTrackingRecovery
