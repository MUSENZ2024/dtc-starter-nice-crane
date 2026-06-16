"use client"

import {
  login,
  requestPasswordReset,
  resetPassword,
  signup,
} from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams } from "next/navigation"
import { FormEvent, ReactNode, useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  AlertIcon,
  CheckIcon,
  EnvelopeIcon,
  LockIcon,
  LoginIcon,
  UserPlusIcon,
} from "./icons"

type AuthCardProps = {
  eyebrow: string
  title: string
  subtitle: string
  wide?: boolean
  children: ReactNode
}

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  wide = false,
  children,
}: AuthCardProps) {
  return (
    <div className="muse-auth-wrap">
      <div className={`muse-auth-card ${wide ? "muse-auth-card-wide" : ""}`}>
        <div className="muse-eyebrow">{eyebrow}</div>
        <h1 className="muse-auth-title">{title}</h1>
        <p className="muse-auth-sub">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

function PasswordInput({
  id,
  name,
  label,
  placeholder,
  autoComplete,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  autoComplete: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="muse-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="muse-input pr-14"
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold uppercase tracking-[0.06em] text-muse-text-light"
        >
          Show
        </button>
      </div>
    </div>
  )
}

function PendingButton({
  children,
  className = "muse-btn-primary w-full",
}: {
  children: ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {children}
    </button>
  )
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error || typeof error !== "string") {
    return null
  }

  return <div className="muse-alert muse-alert-error">{error}</div>
}

export function MuseLoginForm() {
  const [message, formAction] = useActionState(login, null)
  const { countryCode } = useParams() as { countryCode: string }

  return (
    <AuthCard
      eyebrow="My Account"
      title="Welcome back"
      subtitle="Sign in to see your orders, saved delivery addresses, and profile details."
    >
      <form className="muse-auth-form" action={formAction}>
        <input type="hidden" name="country_code" value={countryCode} />
        <div className="muse-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="muse-input"
          />
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muse-text-muted">
            <input type="checkbox" className="h-[18px] w-[18px] accent-muse-black" />
            Keep me signed in
          </label>
          <LocalizedClientLink href="/account/forgot-password" className="muse-link-orange">
            Forgot password?
          </LocalizedClientLink>
        </div>
        <ErrorMessage error={message} />
        <PendingButton>
          <LoginIcon />
          Sign in
        </PendingButton>
        <p className="mt-2 text-center text-[13px] text-muse-text-muted">
          New to MUSE?{" "}
          <LocalizedClientLink href="/account/register" className="font-bold text-muse-orange">
            Create an account
          </LocalizedClientLink>
        </p>
      </form>
    </AuthCard>
  )
}

export function MuseRegisterForm() {
  const [message, formAction] = useActionState(
    signup as (
      currentState: unknown,
      formData: FormData
    ) => Promise<unknown>,
    null
  )
  const [clientError, setClientError] = useState<string | null>(null)
  const { countryCode } = useParams() as { countryCode: string }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget)

    if (data.get("password") !== data.get("confirm_password")) {
      event.preventDefault()
      setClientError("Passwords must match.")
    }
  }

  return (
    <AuthCard
      eyebrow="Join MUSE"
      title="Create your account"
      subtitle="Create an email/password customer account for faster checkout and order access."
      wide
    >
      <form className="muse-auth-form" action={formAction} onSubmit={handleSubmit}>
        <input type="hidden" name="country_code" value={countryCode} />
        <div className="muse-field-row">
          <div className="muse-field">
            <label htmlFor="reg-first">First name</label>
            <input
              id="reg-first"
              name="first_name"
              autoComplete="given-name"
              placeholder="Alex"
              required
              className="muse-input"
            />
          </div>
          <div className="muse-field">
            <label htmlFor="reg-last">Last name</label>
            <input
              id="reg-last"
              name="last_name"
              autoComplete="family-name"
              placeholder="Chen"
              required
              className="muse-input"
            />
          </div>
        </div>
        <div className="muse-field">
          <label htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="muse-input"
          />
        </div>
        <div className="muse-field">
          <label htmlFor="reg-phone">
            Phone <span className="text-muse-text-muted">(optional)</span>
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+64 21 555 0102"
            className="muse-input"
          />
        </div>
        <div className="muse-field-row">
          <PasswordInput
            id="reg-password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <PasswordInput
            id="reg-confirm"
            name="confirm_password"
            label="Confirm password"
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </div>
        <ErrorMessage error={clientError || message} />
        <PendingButton>
          <UserPlusIcon />
          Create account
        </PendingButton>
        <p className="text-center text-[11.5px] leading-[1.6] text-muse-text-light">
          By creating an account you agree to our{" "}
          <LocalizedClientLink href="/content/terms-of-use" className="text-muse-text-muted underline">
            Terms of Service
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink href="/content/privacy-policy" className="text-muse-text-muted underline">
            Privacy Policy
          </LocalizedClientLink>
          .
        </p>
        <p className="mt-2 text-center text-[13px] text-muse-text-muted">
          Already have an account?{" "}
          <LocalizedClientLink href="/account" className="font-bold text-muse-orange">
            Sign in
          </LocalizedClientLink>
        </p>
      </form>
    </AuthCard>
  )
}

export function MuseForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, {
    success: false,
    error: null,
  })

  return (
    <AuthCard
      eyebrow="Password Reset"
      title="Forgot password?"
      subtitle="Enter your email and we will send a reset link if an account exists."
    >
      <form className="muse-auth-form" action={formAction}>
        <div className="muse-field">
          <label htmlFor="forgot-email">Email address</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="muse-input"
          />
        </div>
        <ErrorMessage error={state.error} />
        <PendingButton>
          <EnvelopeIcon />
          Send reset link
        </PendingButton>
        {state.success && (
          <div className="muse-alert muse-alert-success">
            <CheckIcon />
            If that email is registered, reset instructions will arrive shortly.
          </div>
        )}
        <p className="mt-2 text-center text-[13px] text-muse-text-muted">
          <LocalizedClientLink href="/account" className="font-bold text-muse-orange">
            Back to sign in
          </LocalizedClientLink>
        </p>
      </form>
    </AuthCard>
  )
}

export function MuseResetPasswordForm({
  email,
  token,
}: {
  email?: string
  token?: string
}) {
  const [state, formAction] = useActionState(resetPassword, {
    success: false,
    error: null,
  })
  const hasResetLink = Boolean(email && token)
  const { countryCode } = useParams() as { countryCode: string }

  return (
    <AuthCard
      eyebrow="New Password"
      title="Reset your password"
      subtitle="Open this page from the reset email, then choose a new password."
    >
      <form className="muse-auth-form" action={formAction}>
        <input type="hidden" name="country_code" value={countryCode} />
        <input type="hidden" name="email" value={email ?? ""} />
        <input type="hidden" name="token" value={token ?? ""} />
        {hasResetLink ? (
          <div className="muse-alert muse-alert-warn">
            <AlertIcon />
            Reset link verified.
          </div>
        ) : (
          <div className="muse-alert muse-alert-error">
            <AlertIcon />
            Open this page from the reset email.
          </div>
        )}
        <PasswordInput
          id="reset-password"
          name="password"
          label="New password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <PasswordInput
          id="reset-confirm"
          name="confirm_password"
          label="Confirm new password"
          placeholder="Repeat password"
          autoComplete="new-password"
        />
        <ErrorMessage error={state.error} />
        <PendingButton>
          <LockIcon />
          Update password
        </PendingButton>
      </form>
    </AuthCard>
  )
}
