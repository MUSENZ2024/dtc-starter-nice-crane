"use client"

import {
  addCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { FormEvent, useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { getAddressLines } from "./helpers"

type AddressMode =
  | { type: "add"; address?: undefined }
  | { type: "edit"; address: HttpTypes.StoreCustomerAddress }

export default function MuseAddresses({
  customer,
  region,
}: {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}) {
  const [mode, setMode] = useState<AddressMode | null>(null)
  const [removeAddress, setRemoveAddress] =
    useState<HttpTypes.StoreCustomerAddress | null>(null)

  return (
    <div data-testid="addresses-page-wrapper">
      <div className="mb-[26px] flex gap-2 text-xs text-muse-text-light">
        <span>Home</span>
        <span>/</span>
        <span>Addresses</span>
      </div>
      <div className="mb-7">
        <h1 className="muse-page-title">Addresses</h1>
        <p className="muse-page-sub">
          Manage saved shipping and billing addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
        {customer.addresses?.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={() => setMode({ type: "edit", address })}
            onRemove={() => setRemoveAddress(address)}
          />
        ))}
        <button
          type="button"
          onClick={() => setMode({ type: "add" })}
          className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-muse-border bg-white text-muse-text-muted shadow-[0_1px_8px_rgba(0,0,0,0.02)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muse-cream-deep text-2xl text-muse-black">
            +
          </span>
          <strong>Add new address</strong>
        </button>
      </div>

      {mode && (
        <AddressModal
          mode={mode}
          customer={customer}
          region={region}
          onClose={() => setMode(null)}
        />
      )}
      {removeAddress && (
        <RemoveModal
          address={removeAddress}
          onClose={() => setRemoveAddress(null)}
        />
      )}
    </div>
  )
}

function AddressCard({
  address,
  onEdit,
  onRemove,
}: {
  address: HttpTypes.StoreCustomerAddress
  onEdit: () => void
  onRemove: () => void
}) {
  const lines = getAddressLines(address)

  const setDefault = async () => {
    const formData = new FormData()
    formData.set("addressId", address.id)
    formData.set("first_name", address.first_name || "")
    formData.set("last_name", address.last_name || "")
    formData.set("company", address.company || "")
    formData.set("address_1", address.address_1 || "")
    formData.set("address_2", address.address_2 || "")
    formData.set("city", address.city || "")
    formData.set("postal_code", address.postal_code || "")
    formData.set("province", address.province || "")
    formData.set("country_code", address.country_code || "nz")
    formData.set("phone", address.phone || "")
    formData.set("is_default_shipping", "on")
    await updateCustomerAddress({}, formData)
  }

  return (
    <article
      className={`muse-address-card min-h-[180px] p-[22px] ${
        address.is_default_shipping ? "border-[#BBDDBC]" : ""
      }`}
    >
      <div className="mb-3.5 flex justify-between gap-3.5">
        <h3 className="text-base font-black text-muse-black">
          {address.first_name} {address.last_name}
        </h3>
        {address.is_default_shipping && (
          <span className="h-fit rounded-full border border-[#C7E6D0] bg-[#EBF5EE] px-2.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.08em] text-muse-green">
            Default shipping
          </span>
        )}
      </div>
      <p className="text-sm leading-6 text-muse-text-muted">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      {address.phone && (
        <p className="mt-3 text-sm text-muse-text-muted">{address.phone}</p>
      )}
      <div className="mt-[18px] flex flex-wrap gap-4 border-t border-muse-border pt-3.5">
        <button type="button" onClick={onEdit} className="muse-link-orange text-xs uppercase tracking-[0.08em]">
          Edit
        </button>
        {!address.is_default_shipping && (
          <button
            type="button"
            onClick={setDefault}
            className="muse-link-orange text-xs uppercase tracking-[0.08em]"
          >
            Set as default
          </button>
        )}
        <button type="button" onClick={onRemove} className="muse-link-orange text-xs uppercase tracking-[0.08em]">
          Remove
        </button>
      </div>
    </article>
  )
}

function AddressModal({
  mode,
  customer,
  region,
  onClose,
}: {
  mode: AddressMode
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
  onClose: () => void
}) {
  const address = mode.address
  const action = mode.type === "add" ? addCustomerAddress : updateCustomerAddress
  const [state, formAction] = useActionState(action, {
    success: false,
    error: null,
  })

  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [onClose, state.success])

  const stopSubmitWhenCountryMissing = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget)
    if (!data.get("country_code")) {
      event.preventDefault()
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-muse-black/50 p-5">
      <div className="max-h-[92vh] w-full max-w-[620px] overflow-auto rounded-[22px] bg-white p-7 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
        <div className="mb-[22px] flex items-start justify-between gap-4">
          <div>
            <div className="muse-eyebrow">Address</div>
            <h2 className="text-[22px] font-black tracking-normal text-muse-black">
              Add or edit address
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-muse-cream text-2xl text-muse-text-muted"
          >
            ×
          </button>
        </div>

        <form
          action={formAction}
          onSubmit={stopSubmitWhenCountryMissing}
          className="muse-auth-form mt-0"
        >
          {address?.id && <input type="hidden" name="addressId" value={address.id} />}
          <div className="muse-field-row">
            <Field name="first_name" label="First name" defaultValue={address?.first_name || customer.first_name || "Alex"} required />
            <Field name="last_name" label="Last name" defaultValue={address?.last_name || customer.last_name || "Chen"} required />
          </div>
          <Field name="company" label="Company (optional)" placeholder="Company" defaultValue={address?.company || ""} />
          <Field name="address_1" label="Address line 1" defaultValue={address?.address_1 || ""} placeholder="12 Ponsonby Road" required />
          <Field name="address_2" label="Address line 2 (optional)" defaultValue={address?.address_2 || ""} placeholder="Apartment, suite, unit" />
          <div className="muse-field-row">
            <Field name="city" label="City" defaultValue={address?.city || ""} placeholder="Auckland" required />
            <Field name="postal_code" label="Postcode" defaultValue={address?.postal_code || ""} placeholder="1011" required />
          </div>
          <div className="muse-field-row">
            <Field name="province" label="Region" defaultValue={address?.province || ""} placeholder="Auckland" />
            <div className="muse-field">
              <label htmlFor="address-country">Country</label>
              <select
                id="address-country"
                name="country_code"
                defaultValue={address?.country_code || "nz"}
                className="muse-input"
                required
              >
                {region.countries?.map((country) => (
                  <option key={country.id} value={country.iso_2}>
                    {country.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Field name="phone" label="Phone" defaultValue={address?.phone || customer.phone || ""} placeholder="+64 21 555 0102" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muse-text-muted">
            <input
              type="checkbox"
              name="is_default_shipping"
              defaultChecked={address?.is_default_shipping || false}
              className="h-[18px] w-[18px] accent-muse-black"
            />
            Use as default shipping address
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muse-text-muted">
            <input
              type="checkbox"
              name="is_default_billing"
              defaultChecked={address?.is_default_billing || false}
              className="h-[18px] w-[18px] accent-muse-black"
            />
            Use as default billing address
          </label>
          {state.error && <div className="muse-alert muse-alert-error">{state.error}</div>}
          <PendingButton>Save address</PendingButton>
        </form>
      </div>
    </div>
  )
}

function RemoveModal({
  address,
  onClose,
}: {
  address: HttpTypes.StoreCustomerAddress
  onClose: () => void
}) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-muse-black/50 p-5">
      <div className="w-full max-w-[460px] rounded-[22px] bg-white p-7 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
        <div className="mb-[22px] flex items-start justify-between gap-4">
          <div>
            <div className="muse-eyebrow">Remove</div>
            <h2 className="text-[22px] font-black tracking-normal text-muse-black">
              Remove this address?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-muse-cream text-2xl text-muse-text-muted"
          >
            ×
          </button>
        </div>
        <p className="text-sm leading-6 text-muse-text-muted">
          This removes the saved address from your account. Existing orders keep
          their original delivery details.
        </p>
        <div className="mt-[22px] grid gap-3 small:grid-cols-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="muse-btn-danger"
          >
            Remove address
          </button>
          <button type="button" onClick={onClose} className="muse-btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  required = false,
}: {
  name: string
  label: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="muse-field">
      <label htmlFor={`address-${name}`}>{label}</label>
      <input
        id={`address-${name}`}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="muse-input"
      />
    </div>
  )
}

function PendingButton({ children }: { children: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className="muse-btn-primary w-full">
      {children}
    </button>
  )
}
