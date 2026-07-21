import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { ABANDONED_CART_MODULE } from "../../modules/abandoned-cart";
import AbandonedCartModuleService from "../../modules/abandoned-cart/service";
import {
  renderAbandonedCartEmail,
  type AbandonedCartSequenceNumber,
  type AbandonedCartSnapshot,
} from "../../lib/abandoned-cart-email";

export const sendAbandonedCartEmailEventStep = createStep(
  "send-abandoned-cart-email-event",
  async ({ event_id }: { event_id: string }, { container }) => {
    const service: AbandonedCartModuleService = container.resolve(
      ABANDONED_CART_MODULE,
    );
    const notificationModule = container.resolve(Modules.NOTIFICATION);
    const query = container.resolve("query");
    const event = await service.retrieveAbandonedCartEmailEvent(event_id);
    const campaign = await service.retrieveAbandonedCartCampaign(
      event.campaign_id,
    );

    if (campaign.status !== "active" || event.status !== "scheduled") {
      return new StepResponse({
        sent: false,
        cart_id: event.cart_id,
        campaign_id: campaign.id,
        cart_metadata: {},
      });
    }

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "completed_at", "metadata"],
      filters: { id: event.cart_id },
    });
    if (!carts[0] || carts[0].completed_at) {
      const now = new Date();
      await service.updateAbandonedCartEmailEvents({
        id: event.id,
        status: "cancelled",
        cancelled_at: now,
      });
      await service.updateAbandonedCartCampaigns({
        id: campaign.id,
        status: "cancelled",
        last_email_status: "cancelled",
      });
      return new StepResponse({
        sent: false,
        cart_id: event.cart_id,
        campaign_id: campaign.id,
        cart_metadata: {},
      });
    }

    await service.updateAbandonedCartEmailEvents({
      id: event.id,
      status: "sending",
      error_message: null,
    });
    await service.updateAbandonedCartCampaigns({
      id: campaign.id,
      last_email_status: "sending",
    });

    try {
      const html = await renderAbandonedCartEmail(
        campaign.snapshot as AbandonedCartSnapshot,
        event.sequence_number as AbandonedCartSequenceNumber,
        event.tracking_token,
      );
      const notifications = await notificationModule.createNotifications({
        to: campaign.email,
        from: process.env.MUSE_EMAIL_FROM || "orders@musenz.com",
        channel: "email",
        content: { subject: event.subject, html },
      });
      const now = new Date();
      const notification = Array.isArray(notifications)
        ? notifications[0]
        : notifications;
      await service.updateAbandonedCartEmailEvents({
        id: event.id,
        status: "sent",
        sent_at: now,
        provider_notification_id:
          notification &&
          typeof notification === "object" &&
          "id" in notification
            ? String(notification.id)
            : null,
      });
      await service.updateAbandonedCartCampaigns({
        id: campaign.id,
        last_email_status: "sent",
        first_email_sent_at: campaign.first_email_sent_at || now,
        last_email_sent_at: now,
      });
      return new StepResponse({
        sent: true,
        cart_id: event.cart_id,
        campaign_id: campaign.id,
        cart_metadata: carts[0].metadata || {},
      });
    } catch (error) {
      const now = new Date();
      const message = error instanceof Error ? error.message : String(error);
      await service.updateAbandonedCartEmailEvents({
        id: event.id,
        status: "failed",
        failed_at: now,
        error_message: message,
      });
      await service.updateAbandonedCartCampaigns({
        id: campaign.id,
        last_email_status: "failed",
      });
      throw error;
    }
  },
);
