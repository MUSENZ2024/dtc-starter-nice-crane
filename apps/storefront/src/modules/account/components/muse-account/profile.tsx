"use client"

import { updateCustomer } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { LockIcon, UserIcon } from "./icons"

type State = {
  success: boolean
  error: string | null
}

async function updateProfile(
  _currentState: State,
  formData: FormData
): Promise<State> {
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const phone = formData.get("phone") as string

  try {
    await updateCustomer({
      first_name: firstName,
      last_name: lastName,
      phone,
    })
  } catch (error) {
    return { success: false, error: String(error) }
  }

  return { success: true, error: null }
}

export default function MuseProfile({
  customer,
}: {
  customer: HttpTypes.StoreCustomer
}) {
  const [state, formAction] = useActionState(updateProfile, {
    success: false,
    error: null,
  })

  return (
    <div data-testid="profile-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Profile</span>
      </div>
      <div className="mb-7">
        <h1 className="muse-page-title">Profile</h1>
        <p className="muse-page-sub">
          Manage the details saved to your MUSE account.
        </p>
      </div>

      <div className="grid gap-[18px]">
        <form action={formAction} className="muse-panel">
          <div className="muse-panel-head">
            <h2 className="muse-panel-title">
              <UserIcon />
              Personal information
            </h2>
          </div>
          <div className="grid gap-4">
            <div className="muse-field-row">
              <div className="muse-field">
                <label htmlFor="first-name">First name</label>
                <input
                  id="first-name"
                  name="first_name"
                  defaultValue={customer.first_name || ""}
                  className="muse-input"
                />
              </div>
              <div className="muse-field">
                <label htmlFor="last-name">Last name</label>
                <input
                  id="last-name"
                  name="last_name"
                  defaultValue={customer.last_name || ""}
                  className="muse-input"
                />
              </div>
            </div>
            <div className="muse-field-row">
              <div className="muse-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  defaultValue={customer.phone || ""}
                  placeholder="+64 21 555 0102"
                  className="muse-input"
                />
              </div>
              <div className="muse-field">
                <label htmlFor="email-readonly">Email address</label>
                <input
                  id="email-readonly"
                  value={customer.email}
                  readOnly
                  className="muse-input bg-muse-cream-warm"
                />
              </div>
            </div>
          </div>
          <p className="muse-fine mt-3">
            Email is shown as read-only because the current storefront code does not
            support customer email changes.
          </p>
          {state.error && (
            <div className="muse-alert muse-alert-error mt-4">{state.error}</div>
          )}
          {state.success && (
            <div className="muse-alert muse-alert-success mt-4">Saved changes.</div>
          )}
          <PendingButton />
        </form>

        <div className="muse-panel">
          <div className="muse-panel-head">
            <h2 className="muse-panel-title">
              <LockIcon />
              Security
            </h2>
          </div>
          <div className="grid gap-5 border-t border-muse-border pt-[18px] small:grid-cols-[1fr_auto] small:items-center">
            <div>
              <strong>Password</strong>
              <p className="muse-fine">
                Password changes are handled through the reset email flow.
              </p>
            </div>
            <LocalizedClientLink
              href="/account/forgot-password"
              className="muse-btn-secondary"
            >
              Send reset link
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

function PendingButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="muse-btn-primary mt-5 w-full small:w-fit"
    >
      Save changes
    </button>
  )
}
