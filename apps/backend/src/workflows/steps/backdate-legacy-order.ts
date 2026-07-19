import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type Input = {
  order_id: string
  created_at: string
}

export const backdateLegacyOrderStep = createStep(
  "backdate-legacy-order",
  async ({ order_id, created_at }: Input, { container }) => {
    const manager = container.resolve(ContainerRegistrationKeys.MANAGER) as {
      getConnection(): {
        execute<T>(sql: string, params: unknown[]): Promise<T[]>
      }
    }
    await manager.getConnection().execute(
      `update "order" set created_at = ? where id = ?`,
      [created_at, order_id]
    )
    return new StepResponse({ order_id, created_at })
  }
)
