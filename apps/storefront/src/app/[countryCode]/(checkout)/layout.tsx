export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-muse-cream small:min-h-screen">
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
