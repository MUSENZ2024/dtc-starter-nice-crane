import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

type Input = {
  source_order_id: string
}

export const assertLegacyOrderMissingStep = createStep(
  "assert-legacy-order-missing",
  async ({ source_order_id }: Input, { container }) => {
    const manager = container.resolve(ContainerRegistrationKeys.MANAGER) as {
      getConnection(): {
        execute<T>(sql: string, params: unknown[]): Promise<T[]>
      }
    }
    const existing = await manager.getConnection().execute<{ id: string }>(
      `select id from "order" where metadata ->> 'legacy_source' = ? and metadata ->> 'legacy_order_id' = ? limit 1`,
      ["squarespace", source_order_id]
    )

    if (existing.length) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Legacy order ${source_order_id} is already imported as ${existing[0].id}`
      )
    }

    return new StepResponse({ source_order_id })
  }
)
