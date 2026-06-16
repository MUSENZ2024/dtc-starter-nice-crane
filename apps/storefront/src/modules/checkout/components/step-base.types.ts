import { HttpTypes } from "@medusajs/types"

export type StepKey = "contact" | "shipping" | "delivery" | "payment"

export type StepBaseProps = {
  cart: HttpTypes.StoreCart
  isActive: boolean
  isComplete: boolean
  stepNumber: number
  onComplete: () => void
  onEdit: () => void
}

export type StepHeaderProps = Pick<StepBaseProps, "isComplete" | "stepNumber"> & {
  title: string
  onEdit?: () => void
}
