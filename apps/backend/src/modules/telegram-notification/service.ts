import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  botToken: string
}

// Sends owner-facing alerts (new order, etc.) straight to a Telegram chat via
// the Bot API — no third-party SDK, just one HTTP call. Not used for
// customer-facing notifications; those stay on the "email" channel.
class TelegramNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "telegram-notification"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.botToken) {
      throw new Error(
        "botToken is required in the Telegram notification provider's options."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const chatId = notification.to
    const text =
      notification.content?.text ?? notification.content?.subject ?? "New notification"

    const response = await fetch(
      `https://api.telegram.org/bot${this.options_.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          // HTML mode, not Markdown: Medusa order IDs contain underscores
          // (e.g. "order_01H...") which Telegram's Markdown parser reads as
          // an unterminated italics delimiter and rejects the whole message
          // with a 400. HTML only needs &/</> escaped, which callers handle.
          parse_mode: "HTML",
        }),
      }
    )

    if (!response.ok) {
      const body = await response.text()
      this.logger_.error(`Telegram notification failed (${response.status}): ${body}`)
      throw new Error(`Failed to send Telegram notification: ${response.status}`)
    }

    const result = (await response.json()) as { result?: { message_id?: number } }
    return { id: result.result?.message_id ? String(result.result.message_id) : undefined }
  }
}

export default TelegramNotificationProviderService
