export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="muse-checkout-restyle relative w-full bg-white small:min-h-screen">
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
