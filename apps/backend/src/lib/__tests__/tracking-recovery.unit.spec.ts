import {
  PostAdminAttachTrackingSchema,
  PostAdminCreateTrackedShipmentSchema
} from "../../api/admin/orders/tracking-validators"

describe("shipment tracking validation", () => {
  it("blocks marking an order as shipped without tracking", () => {
    expect(() =>
      PostAdminCreateTrackedShipmentSchema.parse({
        items: [{ id: "ordli_123", quantity: 1 }],
        labels: []
      })
    ).toThrow("Add a tracking number")
  })

  it("blocks a blank tracking row", () => {
    expect(() =>
      PostAdminCreateTrackedShipmentSchema.parse({
        items: [{ id: "ordli_123", quantity: 1 }],
        labels: [{ tracking_number: "   " }]
      })
    ).toThrow("Enter a tracking number")
  })

  it("preserves the built-in shipment body when tracking is present", () => {
    const result = PostAdminCreateTrackedShipmentSchema.parse({
      items: [{ id: "ordli_123", quantity: 1 }],
      labels: [
        {
          tracking_number: "EB857148677CN",
          tracking_url: "https://example.com/track",
          label_url: "#"
        }
      ],
      no_notification: false
    })

    expect(result.items).toEqual([{ id: "ordli_123", quantity: 1 }])
    expect(result.labels[0].tracking_number).toBe("EB857148677CN")
  })

  it("defaults the recovery action to sending the shipped email", () => {
    const result = PostAdminAttachTrackingSchema.parse({
      tracking_number: "EB857148677CN"
    })

    expect(result.send_notification).toBe(true)
  })
})
