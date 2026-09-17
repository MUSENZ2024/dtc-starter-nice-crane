import { getRemainingItemQuantities, getShipmentItemQuantities } from "../shipment-email-items"

describe("shipment email items", () => {
  it("uses only the line items and quantities in the current fulfillment", () => {
    expect(Object.fromEntries(getShipmentItemQuantities([{ line_item_id: "local", quantity: 1 }]))).toEqual({ local: 1 })
  })

  it("shows an unshipped order line as still to come", () => {
    const remaining = getRemainingItemQuantities({
      orderItems: [{ id: "local", quantity: 1 }, { id: "standard", quantity: 1 }],
      fulfillments: [
        { id: "ful_local", shipped_at: "2026-09-17T08:00:00.000Z", items: [{ line_item_id: "local", quantity: 1 }] },
        { id: "ful_standard", shipped_at: null, items: [{ line_item_id: "standard", quantity: 1 }] },
      ],
      currentFulfillmentId: "ful_local",
    })
    expect(Object.fromEntries(remaining)).toEqual({ standard: 1 })
  })

  it("does not call an item remaining after its later shipment", () => {
    const remaining = getRemainingItemQuantities({
      orderItems: [{ id: "local", quantity: 1 }, { id: "standard", quantity: 1 }],
      fulfillments: [
        { id: "ful_local", shipped_at: "2026-09-17T08:00:00.000Z", items: [{ line_item_id: "local", quantity: 1 }] },
        { id: "ful_standard", shipped_at: null, items: [{ line_item_id: "standard", quantity: 1 }] },
      ],
      currentFulfillmentId: "ful_standard",
    })
    expect(Object.fromEntries(remaining)).toEqual({})
  })
})
