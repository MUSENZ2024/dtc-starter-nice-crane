"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="inline-flex h-9 items-center rounded-full bg-[#C8D050] px-4 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
            href="/cart"
            data-testid="nav-cart-link"
          >{`Cart (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+14px)] right-0 w-[420px] overflow-hidden rounded-[28px] border border-black/10 bg-[#F4F2ED] text-[#0A0A0A] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
            data-testid="nav-cart-dropdown"
          >
            <div className="border-b border-black/10 bg-black p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8D050]">
                MUSE bag
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                {totalItems ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Your bag"}
              </h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="grid max-h-[402px] grid-cols-1 gap-y-5 overflow-y-scroll p-5 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[104px_1fr] gap-x-4 rounded-[20px] bg-white p-3 shadow-sm"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24 overflow-hidden rounded-[16px] bg-[#EEEAE2]"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                <h3 className="overflow-hidden text-ellipsis text-sm font-black leading-tight tracking-[-0.02em]">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Quantity: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end text-sm font-black">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#C1440E]"
                            data-testid="cart-item-remove-button"
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-y-4 border-t border-black/10 bg-white p-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      Subtotal{" "}
                      <span className="font-normal text-[#777]">(before delivery)</span>
                    </span>
                    <span
                      className="text-xl font-black"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="h-12 w-full rounded-full bg-black text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-[#C1440E]"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Checkout
                    </Button>
                  </LocalizedClientLink>
                  <p className="text-center text-xs text-[#777]">
                    30-day money back. Tracked delivery to NZ.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <div className="flex flex-col items-center justify-center gap-y-4 px-8 py-14 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-black text-[#C8D050]">
                    <span>0</span>
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-[-0.03em]">
                      Your bag is empty.
                    </p>
                    <p className="mt-1 text-sm text-[#666]">
                      Start with the pieces customers ask about most.
                    </p>
                  </div>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">Go to all products page</span>
                        <Button
                          className="rounded-full bg-black px-7 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-[#C1440E]"
                          onClick={close}
                        >
                          Shop the drop
                        </Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
