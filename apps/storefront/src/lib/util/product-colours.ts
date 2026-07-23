type ProductWithColourOptions = {
  options?: {
    id?: string | null
    title?: string | null
  }[] | null
  variants?: {
    options?: {
      option_id?: string | null
      value?: string | null
      option?: {
        title?: string | null
      } | null
    }[] | null
  }[] | null
}

const isColourOption = (title?: string | null) =>
  ["color", "colour"].includes((title ?? "").trim().toLowerCase())

const colourMap: Record<string, string> = {
  black: "#111111",
  blue: "#2563EB",
  brown: "#795548",
  cream: "#F2E8D5",
  gold: "#C9A227",
  green: "#2E7D32",
  grey: "#9E9E9E",
  gray: "#9E9E9E",
  orange: "#E66A21",
  pink: "#E8A0B8",
  purple: "#7E57C2",
  red: "#C62828",
  silver: "#B0B4BA",
  tan: "#C49A6C",
  white: "#FFFFFF",
  yellow: "#E6C928",
}

export const getProductColourSwatches = (
  product: ProductWithColourOptions,
) => {
  const colourOptionId = product.options?.find((option) =>
    isColourOption(option.title),
  )?.id

  if (!colourOptionId) {
    return []
  }

  const colours = new Map<string, { label: string; hex: string }>()

  product.variants?.forEach((variant) => {
    const colour = variant.options?.find((option) => {
      return (
        isColourOption(option.option?.title) ||
        option.option_id === colourOptionId
      )
    })?.value

    if (!colour) {
      return
    }

    const normalized = colour.trim().toLowerCase()
    const mappedColour = Object.entries(colourMap).find(([name]) =>
      normalized.includes(name),
    )?.[1]

    colours.set(normalized, {
      label: colour,
      hex: mappedColour ?? "#D5D2CC",
    })
  })

  return Array.from(colours.values())
}
