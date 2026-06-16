import { redirect } from "next/navigation"

export default async function ProtectedAccountFallback(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  redirect(`/${params.countryCode}/account`)
}
