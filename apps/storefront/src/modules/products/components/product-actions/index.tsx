"use client"

import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { addToCart, replaceLineItem } from "@lib/data/cart"
import { getFulfilmentState } from "@lib/util/fulfilment-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import PaymentBadges from "@modules/common/components/payment-badges"
import StripePaymentMessaging from "@modules/products/components/stripe-payment-messaging"
import SavedToggle from "@modules/saved/components/saved-toggle"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const colourMap: Record<string, string> = {
  black: "#1A1A1A",
  brown: "#3D2817",
  navy: "#1E3A5F",
  "navy blue": "#1E3A5F",
  blue: "#8ED4E8",
  purple: "#5A3D6E",
  green: "#264929",
  "dark green": "#264929",
  orange: "#C8542D",
  cream: "#D4C4A8",
  "cream & white": "#E9E2D1",
  grey: "#A4A4A4",
  gray: "#A4A4A4",
  pink: "#E8BFC3",
  "baby blue": "#A8DCE0",
  olive: "#929475",
  white: "#F2F0E8",
  "white & black": "linear-gradient(135deg, #F2F0E8 0 48%, #1A1A1A 52% 100%)",
}

const getOptionKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) =>
  variantOptions?.reduce((acc: Record<string, string>, option) => {
    const optionId =
      option.option_id ??
      ("option" in option
        ? (option.option as { id?: string } | undefined)?.id
        : undefined)

    if (optionId && option.value) {
      acc[optionId] = option.value
    }
    return acc
  }, {}) ?? {}

const variantMatchesOptions = (
  variant: HttpTypes.StoreProductVariant,
  options: Record<string, string | undefined>
) => {
  const variantOptions = getOptionKeymap(variant.options)
  const variantOptionIds = Object.keys(variantOptions)

  if (!variantOptionIds.length) {
    return true
  }

  return variantOptionIds.every(
    (optionId) => options[optionId] === variantOptions[optionId]
  )
}

const isColourOption = (title?: string | null) =>
  ["color", "colour"].includes((title ?? "").toLowerCase())

const isSizeOption = (title?: string | null) =>
  (title ?? "").toLowerCase() === "size"

const getProductColourFromTitle = (title: string) => {
  const parts = title.split(" - ")
  return parts[parts.length - 1]?.trim()
}

const getVariantStockQuantity = (variant?: HttpTypes.StoreProductVariant) => {
  if (!variant) {
    return 0
  }

  if (typeof variant.inventory_quantity === "number") {
    return variant.inventory_quantity
  }

  const metadataQuantity = variant.metadata?.nz_stock_quantity
  if (typeof metadataQuantity === "number") {
    return metadataQuantity
  }

  if (typeof metadataQuantity === "string") {
    const parsed = Number.parseInt(metadataQuantity, 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}

const variantIsPurchasable = (variant?: HttpTypes.StoreProductVariant) => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return getVariantStockQuantity(variant) > 0
}

const findFirstPurchasableOptionValue = (
  product: HttpTypes.StoreProduct,
  optionId: string
) => {
  const variant = product.variants?.find((candidate) =>
    variantIsPurchasable(candidate)
  )
  const option = variant?.options?.find((candidate) => {
    const candidateOptionId =
      candidate.option_id ??
      ("option" in candidate
        ? (candidate.option as { id?: string } | undefined)?.id
        : undefined)

    return candidateOptionId === optionId
  })

  return option?.value
}

const makeDefaultOptions = (product: HttpTypes.StoreProduct) => {
  const next: Record<string, string> = {}
  const titleColour = getProductColourFromTitle(
    product.title ?? ""
  ).toLowerCase()

  for (const option of product.options ?? []) {
    const values = (option.values ?? [])
      .map((value) => value.value)
      .filter(Boolean) as string[]

    if (!option.id || !values.length) {
      continue
    }

    if (isColourOption(option.title)) {
      next[option.id] =
        values.find((value) => value.toLowerCase() === titleColour) ??
        values.find((value) => titleColour.includes(value.toLowerCase())) ??
        values[0]
      continue
    }

    if (isSizeOption(option.title)) {
      next[option.id] =
        findFirstPurchasableOptionValue(product, option.id) ??
        values.find((value) => value.toLowerCase() === "s") ??
        values.find((value) => value.toLowerCase() === "m") ??
        values[0]
      continue
    }

    next[option.id] = values[0]
  }

  return next
}

const getInStock = (variant?: HttpTypes.StoreProductVariant) => {
  return variantIsPurchasable(variant)
}

const getVariantForOptionValue = (
  product: HttpTypes.StoreProduct,
  optionId: string,
  value: string,
  options: Record<string, string | undefined>
) =>
  product.variants?.find((variant) =>
    variantMatchesOptions(variant, { ...options, [optionId]: value })
  )

const optionValueIsInStock = (
  product: HttpTypes.StoreProduct,
  optionId: string,
  value: string,
  options: Record<string, string | undefined>
) => getInStock(getVariantForOptionValue(product, optionId, value, options))

const isBirkenstockAdultSize = (value?: string | null) => {
  const size = Number.parseInt(value ?? "", 10)
  return Number.isInteger(size) && size >= 35 && size <= 46
}

const isNorthFacePufferJacket = (product: HttpTypes.StoreProduct) => {
  const searchable = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    typeof product.metadata?.brand === "string" ? product.metadata.brand : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const hasPuffer = searchable.includes("puffer")
  const hasJacket = searchable.includes("jacket")
  const isVest = searchable.includes("vest")

  return hasPuffer && hasJacket && !isVest
}

const isBirkenstockProduct = (product: HttpTypes.StoreProduct) => {
  const searchable = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    typeof product.metadata?.brand === "string" ? product.metadata.brand : null,
    typeof product.metadata?.model === "string" ? product.metadata.model : null,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchable.includes("birkenstock")
}

const isAsicsProduct = (product: HttpTypes.StoreProduct) => {
  const searchable = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    typeof product.metadata?.brand === "string" ? product.metadata.brand : null,
    typeof product.metadata?.model === "string" ? product.metadata.model : null,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return /\basics\b/.test(searchable)
}

const isNikeOrJordanProduct = (product: HttpTypes.StoreProduct) => {
  const searchable = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    typeof product.metadata?.brand === "string" ? product.metadata.brand : null,
    typeof product.metadata?.model === "string" ? product.metadata.model : null,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return /\b(nike|jordan|air jordan)\b/.test(searchable)
}

const isAdidasProduct = (product: HttpTypes.StoreProduct) => {
  const searchable = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    typeof product.metadata?.brand === "string" ? product.metadata.brand : null,
    typeof product.metadata?.model === "string" ? product.metadata.model : null,
    ...(product.tags?.map((tag) => tag.value) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return /\badidas\b/.test(searchable)
}

const northFacePufferSizeRows = [
  ["XXS", "62cm", "109cm", "46cm", "63cm", "155-160cm / 45-52kg"],
  ["XS", "64cm", "113cm", "48cm", "64cm", "160-165cm / 53-58kg"],
  ["S", "66cm", "117cm", "49cm", "65cm", "165-170cm / 58-68kg"],
  ["M", "68cm", "121cm", "51cm", "67cm", "170-175cm / 68-75kg"],
  ["L", "70cm", "125cm", "53cm", "68cm", "175-180cm / 75-85kg"],
  ["XL", "72cm", "129cm", "55cm", "69cm", "180-185cm / 85-93kg"],
  ["2XL", "76cm", "136cm", "60cm", "71cm", "185-190cm / 90-95kg"],
]

const defaultSizeRows = [
  ["XXS", "86-89", "62", "81"],
  ["XS", "91-96", "64", "83"],
  ["S", "96-101", "66", "85"],
  ["M", "101-106", "68", "87"],
  ["L", "106-112", "70", "89"],
  ["XL", "114-120", "72", "91"],
]

const birkenstockAdultSizeRows = [
  ["35", "4 - 4.5", "-"],
  ["36", "5 - 5.5", "-"],
  ["37", "6 - 6.5", "-"],
  ["38", "7 - 7.5", "-"],
  ["39", "8 - 8.5", "-"],
  ["40", "9 - 9.5", "7 - 7.5"],
  ["41", "10 - 10.5", "8 - 8.5"],
  ["42", "11 - 11.5", "9 - 9.5"],
  ["43", "12 - 12.5", "10 - 10.5"],
  ["44", "-", "11 - 11.5"],
  ["45", "-", "12 - 12.5"],
  ["46", "-", "13 - 13.5"],
]

const asicsShoeSizeRows = [
  ["4", "-", "36", "22.5", "3"],
  ["4.5", "-", "37", "23", "3.5"],
  ["5", "4", "37.5", "23.5", "4"],
  ["5.5", "4.5", "38", "24", "4.5"],
  ["6", "5", "39", "24.5", "5"],
  ["6.5", "5.5", "39.5", "25", "5.5"],
  ["7", "6", "40", "25.25", "6"],
  ["7.5", "6.5", "40.5", "25.5", "6.5"],
  ["8", "7", "41.5", "26", "7"],
  ["8.5", "7.5", "42", "26.5", "7.5"],
  ["9", "8", "42.5", "27", "8"],
  ["9.5", "8.5", "43.5", "27.5", "8.5"],
  ["10", "9", "44", "28", "9"],
  ["10.5", "9.5", "44.5", "28.25", "9.5"],
  ["11", "10", "45", "28.5", "10"],
  ["11.5", "10.5", "46", "29", "10.5"],
  ["12", "11", "46.5", "29.5", "11"],
  ["12.5", "11.5", "47", "30", "11.5"],
  ["13", "12", "48", "30.5", "12"],
]

const nikeJordanShoeSizeRows = [
  ["3.5", "5", "35.5", "22.5", "3"],
  ["4", "5.5", "36", "23", "3.5"],
  ["4.5", "6", "36.5", "23.5", "4"],
  ["5", "6.5", "37.5", "23.5", "4.5"],
  ["5.5", "7", "38", "24", "5"],
  ["6", "7.5", "38.5", "24", "5.5"],
  ["6.5", "8", "39", "24.5", "6"],
  ["7", "8.5", "40", "25", "6"],
  ["7.5", "9", "40.5", "25.5", "6.5"],
  ["8", "9.5", "41", "26", "7"],
  ["8.5", "10", "42", "26.5", "7.5"],
  ["9", "10.5", "42.5", "27", "8"],
  ["9.5", "11", "43", "27.5", "8.5"],
  ["10", "11.5", "44", "28", "9"],
  ["10.5", "12", "44.5", "28.5", "9.5"],
  ["11", "12.5", "45", "29", "10"],
  ["11.5", "13", "45.5", "29.5", "10.5"],
  ["12", "13.5", "46", "30", "11"],
  ["12.5", "14", "47", "30.5", "11.5"],
  ["13", "14.5", "47.5", "31", "12"],
  ["13.5", "15", "48", "31.5", "12.5"],
  ["14", "15.5", "48.5", "32", "13"],
  ["14.5", "16", "49", "32.5", "13.5"],
]

const adidasShoeSizeRows = [
  ["4", "5", "35", "21", "2.5"],
  ["4.5", "5.5", "35.5", "21.5", "3"],
  ["5", "6", "36", "22", "3.5"],
  ["5.5", "6.5", "36.5", "22.5", "4"],
  ["6", "7", "37", "23", "4.5"],
  ["6.5", "7.5", "38", "23.5", "5"],
  ["7", "8", "38.5", "24", "5.5"],
  ["7.5", "8.5", "39", "24.5", "6"],
  ["8", "9", "40", "25", "6.5"],
  ["8.5", "9.5", "40.5", "25.5", "7"],
  ["9", "10", "41", "26", "7.5"],
  ["9.5", "10.5", "42", "26.5", "8"],
  ["10", "11", "42.5", "27", "8.5"],
  ["10.5", "11.5", "43", "27.5", "9"],
  ["11", "12", "44", "28", "9.5"],
  ["12", "13", "45", "29", "10.5"],
]

const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[#E8E6E0]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-[18px] text-left text-sm font-bold text-[#0A0A0A]"
      >
        {title}
        <span
          className={`text-[22px] text-[#666] transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="pb-[22px] text-[13.5px] leading-7 text-[#666]">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const countryCode = useParams().countryCode as string
  const { openDrawer, beginCartMutation, finishCartMutation } = useCartDrawer()
  const editLineId = searchParams.get("edit_line_id")
  const editQuantity = Math.max(
    1,
    Number(searchParams.get("edit_quantity")) || 1
  )
  const isEditingLine = Boolean(editLineId)

  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => makeDefaultOptions(product)
  )
  const [isAdding, setIsAdding] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const colourOption = useMemo(
    () => product.options?.find((option) => isColourOption(option.title)),
    [product.options]
  )
  const sizeOption = useMemo(
    () => product.options?.find((option) => isSizeOption(option.title)),
    [product.options]
  )

  useEffect(() => {
    const editVariantId =
      searchParams.get("edit_variant_id") ?? searchParams.get("v_id")
    const editVariant = product.variants?.find(
      (variant) => variant.id === editVariantId
    )

    setOptions(
      editVariant
        ? getOptionKeymap(editVariant.options)
        : makeDefaultOptions(product)
    )
  }, [product, searchParams])

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current)
      }
    }
  }, [])

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) {
      return undefined
    }

    return product.variants.find((variant) =>
      variantMatchesOptions(variant, options)
    )
  }, [product.variants, options])

  const isValidVariant = useMemo(
    () =>
      !!product.variants?.some((variant) =>
        variantMatchesOptions(variant, options)
      ),
    [product.variants, options]
  )

  const selectedPrice = useMemo(() => {
    const price = getProductPrice({
      product,
      variantId: selectedVariant?.id,
    })

    return selectedVariant ? price.variantPrice : price.cheapestPrice
  }, [product, selectedVariant])

  const currentColour = colourOption?.id ? options[colourOption.id] : undefined
  const currentSize = sizeOption?.id ? options[sizeOption.id] : undefined
  const inStock = getInStock(selectedVariant)
  const selectedStockQuantity = getVariantStockQuantity(selectedVariant)
  const useNorthFacePufferSizing = isNorthFacePufferJacket(product)
  const useBirkenstockSizing = isBirkenstockProduct(product)
  const useAsicsSizing = isAsicsProduct(product)
  const useNikeJordanSizing = isNikeOrJordanProduct(product)
  const useAdidasSizing = isAdidasProduct(product)
  const sizeValues =
    sizeOption?.values?.filter((value) =>
      useBirkenstockSizing ? isBirkenstockAdultSize(value.value) : true
    ) ?? []
  const fitSummary = useNorthFacePufferSizing
    ? "Men's/unisex fit — true to size. Women size down"
    : useBirkenstockSizing
    ? "True to size — 92% got their usual Birkenstock/EU size"
    : useAsicsSizing
    ? "True to size — 73% got their usual ASICS size"
    : useNikeJordanSizing
    ? "True to size — 88% got their usual Nike/Jordan size"
    : useAdidasSizing
    ? "True to size — 88% got their usual adidas size"
    : "Fits true to size — get your usual"
  const betweenSizesAdvice = useNorthFacePufferSizing
    ? "Women's sizing: size down from the men's/unisex size listed. Men's/unisex: choose your usual unless layering."
    : useBirkenstockSizing
    ? "Choose your usual EU size. If you are between sizes or prefer a roomier clog fit, size up."
    : useAsicsSizing
    ? "ASICS are listed in EU sizing. Use the chart to compare your usual men's, women's, CM, or UK size."
    : useNikeJordanSizing
    ? "Nike and Jordan are listed in U.S. men's sizing on MUSE. Use the chart to compare men's, women's, EU, CM, and UK conversions."
    : useAdidasSizing
    ? "adidas sizes are shown as U.S. Men's / U.S. Women's on MUSE. Use the chart to compare men's, women's, EU, CM, and UK conversions."
    : "Choose your usual size. If you prefer extra room, size up."
  const fitSizedDown = useNorthFacePufferSizing
    ? "18%"
    : useBirkenstockSizing
    ? "0%"
    : useAsicsSizing
    ? "1%"
    : useNikeJordanSizing
    ? "1%"
    : useAdidasSizing
    ? "1%"
    : "9%"
  const fitTrueToSize = useBirkenstockSizing
    ? "92%"
    : useNikeJordanSizing || useAdidasSizing
    ? "88%"
    : "73%"
  const fitSizedUp = useNorthFacePufferSizing
    ? "9%"
    : useBirkenstockSizing
    ? "8%"
    : useAsicsSizing
    ? "26%"
    : useNikeJordanSizing
    ? "11%"
    : useAdidasSizing
    ? "11%"
    : "18%"
  const sizeGuideColumns = useNorthFacePufferSizing
    ? [
        "Size",
        "Length",
        "Chest",
        "Shoulder",
        "Sleeve",
        "Suggested Height / Weight",
      ]
    : useBirkenstockSizing
    ? ["Birkenstock EU", "Women U.S.", "Men U.S."]
    : useAsicsSizing || useNikeJordanSizing || useAdidasSizing
    ? ["Men's", "Women's", "EU", "CM", "UK"]
    : ["Size", "Chest (cm)", "Length (cm)", "Sleeve (cm)"]
  const sizeGuideRows = useNorthFacePufferSizing
    ? northFacePufferSizeRows
    : useBirkenstockSizing
    ? birkenstockAdultSizeRows
    : useNikeJordanSizing
    ? nikeJordanShoeSizeRows
    : useAdidasSizing
    ? adidasShoeSizeRows
    : useAsicsSizing
    ? asicsShoeSizeRows
    : defaultSizeRows
  const sizeGuideLabel =
    useBirkenstockSizing || useAsicsSizing
      ? "EU sizing · Size guide"
      : "US sizing · Size guide"

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [isValidVariant, pathname, router, searchParams, selectedVariant])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((current) => ({ ...current, [optionId]: value }))
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id || disabled || isAdding) {
      return
    }

    setIsAdding(true)
    beginCartMutation()
    openDrawer()
    try {
      if (editLineId) {
        await replaceLineItem({
          lineId: editLineId,
          variantId: selectedVariant.id,
          quantity: editQuantity,
          countryCode,
        })
        router.push(`/${countryCode}/cart`)
        return
      }

      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      setAddedToCart(true)
      router.refresh()

      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current)
      }
      addedTimerRef.current = setTimeout(() => setAddedToCart(false), 2000)
    } finally {
      finishCartMutation()
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!selectedVariant?.id || disabled || isAdding) {
      return
    }

    setIsAdding(true)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      router.push(`/${countryCode}/checkout`)
    } finally {
      setIsAdding(false)
    }
  }

  const priceLabel = selectedPrice?.calculated_price ?? "NZ$180.00"
  const numericPrice = selectedPrice?.calculated_price_number ?? 180
  const showSalePrice =
    selectedPrice?.price_type === "sale" &&
    selectedPrice.original_price_number > selectedPrice.calculated_price_number
  const saveAmount = showSalePrice
    ? selectedPrice.original_price_number -
      selectedPrice.calculated_price_number
    : 0
  const disabledCta =
    !selectedVariant || !inStock || !isValidVariant || !!disabled
  const fulfilment = getFulfilmentState(product)

  return (
    <div className="pb-4 small:pt-1">
      <div
        className={`mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
          fulfilment.labelColor === "green"
            ? "text-[#1F7A3A]"
            : "text-[#C1440E]"
        }`}
      >
        <span
          className={`h-[7px] w-[7px] rounded-full ${
            fulfilment.labelColor === "green" ? "bg-[#1F7A3A]" : "bg-[#C1440E]"
          }`}
        />
        {fulfilment.eyebrow}
      </div>
      <h1 className="mb-3 text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-[#0A0A0A] small:text-[38px]">
        {product.title}
      </h1>

      <div className="mb-5 flex flex-wrap items-center gap-2.5 text-[13px] text-[#666]">
        <span className="text-sm tracking-[1px] text-[#C1440E]">★★★★★</span>
        <strong className="text-[#0A0A0A]">4.9</strong>
        <a href="#reviews" className="font-semibold underline">
          47 verified reviews
        </a>
        <span className="opacity-40">·</span>
        <span>247 sold this season</span>
      </div>

      <div className="mb-2 flex flex-wrap items-baseline gap-3">
        <span className="text-[34px] font-black tracking-[-0.03em] text-[#0A0A0A]">
          {priceLabel}
        </span>
        {showSalePrice && (
          <>
            <span className="text-lg font-medium text-[#999] line-through">
              {selectedPrice.original_price}
            </span>
            <span className="rounded-full bg-[#C1440E] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-white">
              Save NZ${saveAmount}
            </span>
          </>
        )}
      </div>
      <div className="mb-6">
        <StripePaymentMessaging
          amount={numericPrice}
          currency={region.currency_code || "nzd"}
          countryCode={countryCode}
        />
      </div>

      <SavedToggle
        item={{
          id: product.id,
          title: product.title || "MUSE product",
          handle: product.handle,
          href: product.handle ? `/products/${product.handle}` : "/store",
          image: product.thumbnail || product.images?.[0]?.url,
          price: priceLabel,
          compareAt: showSalePrice ? selectedPrice.original_price : undefined,
          badge: fulfilment.shortLabel,
          eta: fulfilment.deliveryLabel,
        }}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-[#D5D2CC] bg-white px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#0A0A0A] transition hover:border-[#0A0A0A] aria-pressed:border-[#C1440E] aria-pressed:bg-[#FDF4EF] aria-pressed:text-[#C1440E]"
        iconClassName="h-4 w-4"
        showText
      />

      {colourOption && (
        <div id="size-guide" className="mb-5 scroll-mt-28">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.12em]">
              Colour
            </span>
            <span className="text-[13px] font-medium text-[#666]">
              {currentColour}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(colourOption.values ?? []).map((value) => {
              if (!value.value || !colourOption.id) {
                return null
              }

              const colour = value.value
              const colourKey = colour.toLowerCase()
              const selected = currentColour === colour
              const background = colourMap[colourKey] ?? "#D5D2CC"

              return (
                <button
                  key={value.id}
                  type="button"
                  aria-label={`Select ${colour}`}
                  title={colour}
                  disabled={disabled || isAdding}
                  onClick={() => setOptionValue(colourOption.id, colour)}
                  className={`relative h-10 w-10 rounded-full border-2 transition ${
                    selected ? "border-[#0A0A0A]" : "border-transparent"
                  }`}
                  style={{ background }}
                >
                  {selected && (
                    <span className="absolute -inset-[5px] rounded-full border border-black/20" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sizeOption && (
        <div className="mb-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.12em]">
              Size
            </span>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="text-[13px] font-semibold text-[#C1440E] hover:underline"
            >
              {sizeGuideLabel}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 xsmall:grid-cols-6">
            {sizeValues.map((value) => {
              if (!value.value || !sizeOption.id) {
                return null
              }

              const selected = currentSize === value.value
              const valueInStock = optionValueIsInStock(
                product,
                sizeOption.id,
                value.value,
                options
              )
              const isUnavailable = !valueInStock

              return (
                <button
                  key={value.id}
                  type="button"
                  disabled={disabled || isAdding || isUnavailable}
                  onClick={() => setOptionValue(sizeOption.id, value.value!)}
                  title={
                    isUnavailable
                      ? "Out of stock in NZ Stock"
                      : `Select size ${value.value}`
                  }
                  className={`relative rounded-xl border-[1.5px] px-2 py-3.5 text-[13px] font-bold transition ${
                    selected
                      ? "border-[#0A0A0A] bg-[#0A0A0A] text-[#F4F2ED]"
                      : isUnavailable
                      ? "cursor-not-allowed border-[#E1DED7] bg-[#F1EFEA] text-[#AAA]"
                      : "border-[#D5D2CC] bg-white text-[#0A0A0A] hover:border-[#0A0A0A]"
                  }`}
                >
                  {value.value.toUpperCase()}
                  {isUnavailable && (
                    <span className="pointer-events-none absolute left-2 right-2 top-1/2 h-px -rotate-12 bg-[#AAA]" />
                  )}
                </button>
              )
            })}
          </div>
          {useNikeJordanSizing && (
            <p className="mt-2 text-[12.5px] font-semibold text-[#666]">
              Sizes are shown as US Men's / US Women's.
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[12.5px] text-[#666]">
            <span>
              <strong className="font-semibold text-[#0A0A0A]">
                {fitSummary}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="font-semibold text-[#C1440E]"
            >
              View chart →
            </button>
          </div>
          <p className="mt-2 rounded-[12px] bg-white px-3.5 py-2.5 text-[12.5px] font-medium leading-5 text-[#666] ring-1 ring-[#E8E6E0]">
            {useBirkenstockSizing ? (
              <>
                <strong className="font-bold text-[#0A0A0A]">
                  Size sold out?
                </strong>{" "}
                DM @muse.nz for a standard-delivery pair or restock notice.
              </>
            ) : (
              <>
                <strong className="font-bold text-[#0A0A0A]">
                  Wrong size?
                </strong>{" "}
                30-day exchange or money back. Return label support included.
              </>
            )}
          </p>

          <div className="mt-3 rounded-[14px] bg-[#F8F7F4] p-4">
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#999]">
              What 47 buyers say about fit
            </div>
            <div className="mb-2 flex h-2 overflow-hidden rounded-full">
              <span
                className="h-full bg-[#999]"
                style={{ width: fitSizedDown }}
              />
              <span
                className="h-full bg-[#1F7A3A]"
                style={{ width: fitTrueToSize }}
              />
              <span
                className="h-full bg-[#C1440E]"
                style={{ width: fitSizedUp }}
              />
            </div>
            <div className="flex flex-wrap gap-3.5 text-[11.5px] text-[#666]">
              <span>{fitSizedDown} sized down</span>
              <span>{fitTrueToSize} true to size</span>
              <span>{fitSizedUp} sized up</span>
            </div>
          </div>
        </div>
      )}

      {inStock && selectedStockQuantity > 0 && (
        <div className="my-5 rounded-xl border-l-[3px] border-[#C1440E] bg-[#FDF4EF] px-4 py-3.5 text-[13px] leading-6">
          <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#1F7A3A]" />
          <strong className="font-bold text-[#C1440E]">
            Only {selectedStockQuantity} left
          </strong>{" "}
          in size {currentSize ?? "-"} · {fulfilment.shortLabel}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={disabledCta || isAdding}
          onClick={handleAddToCart}
          className={`flex items-center justify-center gap-2.5 rounded-full px-6 py-[19px] text-[13px] font-extrabold uppercase tracking-[0.1em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed ${
            addedToCart
              ? "bg-muse-green text-white"
              : isAdding || disabledCta
              ? "bg-[#999] text-white"
              : "bg-muse-black text-muse-cream hover:bg-muse-orange"
          }`}
        >
          <span>
            {isAdding
              ? isEditingLine
                ? "Updating..."
                : "Adding..."
              : addedToCart
              ? "✓ Added to bag"
              : disabledCta
              ? selectedVariant && !inStock
                ? "Sold out"
                : "Select options"
              : isEditingLine
              ? "Update bag"
              : "Add to bag"}
          </span>
          <span>· {priceLabel}</span>
        </button>
        <button
          type="button"
          disabled={disabledCta || isAdding}
          onClick={isEditingLine ? handleAddToCart : handleBuyNow}
          className="rounded-full bg-[#C8D050] px-6 py-[19px] text-center text-[13px] font-extrabold uppercase tracking-[0.1em] text-[#0A0A0A] transition hover:bg-[#B6C043] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditingLine ? "Update bag" : "Buy now — checkout in 30s"}
        </button>
      </div>

      <div className="mb-6">
        <PaymentBadges className="justify-start" />
      </div>

      <div className="mb-5 rounded-2xl bg-[#F8F7F4] px-[18px] py-4 text-[13px] leading-6">
        <span className="font-bold text-[#0A0A0A]">
          Estimated delivery: {fulfilment.deliveryLabel}
        </span>
        <br />
        <span className="text-[#666]">
          {fulfilment.supportCopy} · free delivery over $200 · updates sent by
          email after dispatch
        </span>
      </div>

      <div className="mb-7 grid grid-cols-3 gap-2">
        {[
          "Inspected before dispatch",
          "30-day money back",
          "Auckland pickup",
        ].map((pill) => (
          <div
            key={pill}
            className="rounded-full border border-[#E8E6E0] bg-white px-2 py-2.5 text-center text-[10.5px] font-bold uppercase tracking-[0.05em]"
          >
            {pill}
          </div>
        ))}
      </div>

      <div className="border-t border-[#E8E6E0]">
        <AccordionItem title="Product details" defaultOpen>
          <p className="whitespace-pre-line">
            {product.description ||
              "Product details are being updated. Message @muse.nz if you want extra photos or measurements before ordering."}
          </p>
        </AccordionItem>
        <AccordionItem title="Sizing & fit">
          {useNorthFacePufferSizing ? (
            <>
              <p>
                Sizes are shown in U.S. Men's sizing. The jacket has a unisex
                fit and shape, but the inside label may say "Men's US".
              </p>
              <p className="mt-2">
                If you usually buy women's sizing, we recommend sizing down from
                the men's size listed. For example, a women's M will usually fit
                closer to a men's S.
              </p>
              <p className="mt-2">
                If you already wear men's or unisex sizing, choose your usual
                size. Size up if you want extra room for layering.
              </p>
              <p className="mt-2">
                Chest measurements in the size guide are full wrap-around
                measurements, not flat left-to-right measurements. Please allow
                a 1-3cm difference due to manual measurement.
              </p>
            </>
          ) : (
            <>
              <p>
                {useBirkenstockSizing
                  ? "Birkenstock footwear is made in European sizes. Use the adult conversion chart in the size guide for U.S. sizing."
                  : useAsicsSizing
                  ? "ASICS footwear is listed in EU sizing on our site. Use the size guide to compare men's, women's, CM, and UK conversions."
                  : useNikeJordanSizing
                  ? "Nike and Jordan footwear is listed in U.S. men's sizing on MUSE. Use the size guide to compare men's, women's, EU, CM, and UK conversions."
                  : useAdidasSizing
                  ? "adidas sizes are shown as U.S. Men's / U.S. Women's on MUSE. Use the size guide to compare men's, women's, EU, CM, and UK conversions."
                  : "Sizes shown in U.S. Most buyers get their usual size for a regular fit, or size up if they want extra room for layering."}
              </p>
              <p className="mt-2">
                <strong className="font-bold text-[#0A0A0A]">
                  {useBirkenstockSizing
                    ? "This Birkenstock style fits true to size."
                    : useAsicsSizing
                    ? "This ASICS style fits true to size."
                    : useNikeJordanSizing
                    ? "Nike/Jordan footwear fits true to size for most buyers."
                    : useAdidasSizing
                    ? "adidas footwear fits true to size for most buyers."
                    : "This style fits true to size."}
                </strong>{" "}
                {useBirkenstockSizing
                  ? "Based on fit feedback, 92% got their usual size and 8% sized up."
                  : useAsicsSizing
                  ? "Based on fit feedback, 1% sized down, 73% got their usual size, and 26% sized up."
                  : useNikeJordanSizing
                  ? "Based on fit feedback, 1% sized down, 88% got their usual size, and 11% sized up."
                  : useAdidasSizing
                  ? "Based on fit feedback, 1% sized down, 88% got their usual size, and 11% sized up."
                  : "Based on 47 verified reviews, 73% got their usual size."}
              </p>
            </>
          )}
        </AccordionItem>
        <AccordionItem title="Shipping & returns">
          <p>
            <strong className="font-bold text-[#0A0A0A]">
              {fulfilment.label}:
            </strong>{" "}
            {fulfilment.deliveryLabel}. {fulfilment.supportCopy}
          </p>
          <p className="mt-2">
            <strong className="font-bold text-[#0A0A0A]">Returns:</strong>{" "}
            30-day money-back if it does not fit or is not what you expected.
          </p>
        </AccordionItem>
        <AccordionItem title="About this product">
          <p>
            Sourced from a verified overseas manufacturing partner and inspected
            before dispatch. This keeps pricing sharper while still giving
            customers a clear delivery timeline, support, and NZ Post tracking.
          </p>
        </AccordionItem>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[#E8E6E0] bg-white px-[18px] py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] small:hidden">
        <div className="shrink-0">
          <div className="text-lg font-black tracking-[-0.02em]">
            {priceLabel}
          </div>
          <div className="text-[11px] text-[#666]">
            {currentColour ?? "Colour"} · Size {currentSize ?? "-"}
          </div>
        </div>
        <button
          type="button"
          disabled={disabledCta || isAdding}
          onClick={handleAddToCart}
          className={`flex-1 rounded-full px-4 py-4 text-xs font-extrabold uppercase tracking-[0.1em] disabled:bg-[#999] ${
            addedToCart
              ? "bg-muse-green text-white"
              : isAdding || disabledCta
              ? "bg-[#999] text-white"
              : "bg-[#0A0A0A] text-[#F4F2ED]"
          }`}
        >
          {isAdding
            ? isEditingLine
              ? "Updating..."
              : "Adding..."
            : isEditingLine
            ? "Update bag"
            : addedToCart
            ? "✓ Added"
            : selectedVariant && !inStock
            ? "Sold out"
            : "Add to bag →"}
        </button>
      </div>

      {sizeGuideOpen && (
        <>
          <button
            type="button"
            aria-label="Close size guide"
            className="fixed inset-0 z-[70] bg-black/45"
            onClick={() => setSizeGuideOpen(false)}
          />
          <aside className="fixed bottom-0 right-0 top-0 z-[80] flex w-full max-w-[680px] flex-col bg-[#F4F2ED] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E6E0] px-7 py-6">
              <h3 className="text-lg font-black tracking-[-0.02em]">
                Size guide
              </h3>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="text-2xl text-[#666]"
              >
                x
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-6">
              <div className="mb-5 rounded-[10px] border-l-[3px] border-[#C1440E] bg-[#FDF4EF] px-3.5 py-3 text-[12.5px] leading-6">
                <strong className="font-bold text-[#C1440E]">
                  {useNorthFacePufferSizing
                    ? "Men's/unisex fit — true to size. Women size down."
                    : useBirkenstockSizing
                    ? "Birkenstock Boston fits true to size."
                    : useAsicsSizing
                    ? "ASICS footwear fits true to size for most buyers."
                    : useNikeJordanSizing
                    ? "Nike/Jordan footwear fits true to size for most buyers."
                    : useAdidasSizing
                    ? "adidas footwear fits true to size for most buyers."
                    : "This style fits true to size."}
                </strong>{" "}
                {useNikeJordanSizing || useAdidasSizing
                  ? "Based on fit feedback, 1% sized down, 88% got their usual size, and 11% sized up."
                  : useAsicsSizing
                  ? "Based on fit feedback, 1% sized down, 73% got their usual size, and 26% sized up."
                  : useBirkenstockSizing
                  ? "Based on fit feedback, 92% of buyers got their usual size and 8% sized up."
                  : "Based on 47 verified reviews, 73% of buyers got their usual size."}
              </div>
              <div className="mb-5 grid gap-2 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                <p>
                  <strong className="font-bold text-[#0A0A0A]">
                    If between sizes:
                  </strong>{" "}
                  {betweenSizesAdvice}
                </p>
                <p>
                  <strong className="font-bold text-[#0A0A0A]">
                    For oversized fit:
                  </strong>{" "}
                  {useBirkenstockSizing
                    ? "size up for a roomier clog fit"
                    : useNikeJordanSizing
                    ? "size up if you prefer extra toe room or have wider feet"
                    : useAdidasSizing
                    ? "size up if you prefer extra toe room or have wider feet"
                    : useAsicsSizing
                    ? "size up if you prefer extra toe room"
                    : "size up"}
                </p>
                <p>
                  <strong className="font-bold text-[#0A0A0A]">
                    For cleaner fit:
                  </strong>{" "}
                  true size
                </p>
              </div>
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
                  <thead>
                    <tr>
                      {sizeGuideColumns.map((head) => (
                        <th
                          key={head}
                          className="border-b-2 border-[#0A0A0A] px-2 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#666]"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuideRows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, index) => (
                          <td
                            key={cell}
                            className="border-b border-[#E8E6E0] px-2 py-3"
                          >
                            {index === 0 ? <strong>{cell}</strong> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {useNorthFacePufferSizing && (
                <div className="mt-5 space-y-3 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                  <p>
                    <strong className="font-bold text-[#0A0A0A]">
                      Size Note:
                    </strong>{" "}
                    Chest measurements are the full circumference around the
                    chest, not a flat left-to-right measurement. Please allow a
                    1-3cm difference due to manual measurement.
                  </p>
                  <p>
                    These jackets are unisex in fit and shape. However, the
                    inside label may show "Men's US" sizing.
                  </p>
                  <p>
                    If you usually wear women's sizing, we recommend sizing down
                    from the men's size listed. For example, a women's M would
                    usually fit closer to a men's S.
                  </p>
                  <p>
                    If you already buy or wear men's/unisex sizing, please
                    choose your usual size from the chart.
                  </p>
                </div>
              )}
              {useBirkenstockSizing && (
                <div className="mt-5 space-y-3 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                  <p>
                    <strong className="font-bold text-[#0A0A0A]">
                      Size Note:
                    </strong>{" "}
                    Birkenstock footwear is made in European sizes. The chart
                    above shows adult conversions only.
                  </p>
                  <p>
                    Boston clogs should feel secure through the instep while
                    leaving a little room at the toe and heel. The suede upper
                    relaxes slightly with wear.
                  </p>
                  <p>
                    This product uses the adult Birkenstock chart only; kids
                    sizing is intentionally not shown.
                  </p>
                </div>
              )}
              {useAsicsSizing && (
                <div className="mt-5 space-y-3 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                  <p>
                    <strong className="font-bold text-[#0A0A0A]">
                      Size Note:
                    </strong>{" "}
                    ASICS products on MUSE use EU sizing. The chart above
                    combines men's, women's, EU, CM, and UK conversions so you
                    can compare against the size you already wear.
                  </p>
                  <p>
                    If your usual size sits between two EU sizes, choose the
                    larger size if you prefer more toe room.
                  </p>
                </div>
              )}
              {useNikeJordanSizing && (
                <div className="mt-5 space-y-3 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                  <p>
                    <strong className="font-bold text-[#0A0A0A]">
                      Size Note:
                    </strong>{" "}
                    Nike and Jordan products on MUSE use U.S. men's sizing. The
                    chart above combines men's, women's, EU, CM, and UK
                    conversions so you can compare against the size you already
                    wear.
                  </p>
                  <p>
                    Most buyers stay true to size. If your usual size sits
                    between two sizes or you prefer more toe room, choose the
                    larger size.
                  </p>
                </div>
              )}
              {useAdidasSizing && (
                <div className="mt-5 space-y-3 rounded-[10px] bg-white px-3.5 py-4 text-[12.5px] leading-6 text-[#666]">
                  <p>
                    <strong className="font-bold text-[#0A0A0A]">
                      Size Note:
                    </strong>{" "}
                    adidas products on MUSE show sizes as U.S. Men's / U.S.
                    Women's. The chart above includes adidas EU, CM, and UK
                    conversions for comparison.
                  </p>
                  <p>
                    Most buyers stay true to size. If your usual size sits
                    between two sizes or you prefer more toe room, choose the
                    larger size.
                  </p>
                </div>
              )}
              <h4 className="mb-2 mt-6 text-[13px] font-bold">Still unsure?</h4>
              <p className="text-[12.5px] leading-6 text-[#666]">
                DM @muse.nz on Instagram with your usual size and we will
                recommend the right fit.
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
