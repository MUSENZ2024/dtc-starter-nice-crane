import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { updateCustomerEmailWorkflow } from "../../../../../workflows/update-customer-email"

export const PostStoreCustomerEmailSchema = z.object({
  email: z.string().email(),
})

export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostStoreCustomerEmailSchema>>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerModuleService.retrieveCustomer(customerId)

  const { result } = await updateCustomerEmailWorkflow(req.scope).run({
    input: {
      customerId,
      currentEmail: customer.email,
      newEmail: req.validatedBody.email,
    },
  })

  res.json(result)
}
