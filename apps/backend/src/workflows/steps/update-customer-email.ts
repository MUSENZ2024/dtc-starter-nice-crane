import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"

type Input = { customerId: string; currentEmail: string; newEmail: string }

type Compensation = {
  providerIdentityId: string
  oldEmail: string
  customerId: string
}

export const updateCustomerEmailStep = createStep(
  "update-customer-email",
  async (input: Input, { container }) => {
    const customerModuleService = container.resolve(Modules.CUSTOMER)
    const authModuleService = container.resolve(Modules.AUTH)

    const existing = await customerModuleService.listCustomers({
      email: input.newEmail,
    })

    if (existing.some((customer) => customer.id !== input.customerId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This email is already in use."
      )
    }

    const [providerIdentity] = await authModuleService.listProviderIdentities({
      entity_id: input.currentEmail,
      provider: "emailpass",
    })

    if (!providerIdentity) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No login identity found for this account."
      )
    }

    await authModuleService.updateProviderIdentities({
      id: providerIdentity.id,
      entity_id: input.newEmail,
    })

    const customer = await customerModuleService.updateCustomers(
      input.customerId,
      { email: input.newEmail }
    )

    return new StepResponse(customer, {
      providerIdentityId: providerIdentity.id,
      oldEmail: input.currentEmail,
      customerId: input.customerId,
    })
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation) {
      return
    }

    const customerModuleService = container.resolve(Modules.CUSTOMER)
    const authModuleService = container.resolve(Modules.AUTH)

    await authModuleService.updateProviderIdentities({
      id: compensation.providerIdentityId,
      entity_id: compensation.oldEmail,
    })

    await customerModuleService.updateCustomers(compensation.customerId, {
      email: compensation.oldEmail,
    })
  }
)
