import { NextRequest, NextResponse } from "next/server"

import { listProducts } from "@lib/data/products"

export const dynamic = "force-dynamic"

const SEARCH_FIELDS =
  "id,title,handle,subtitle,thumbnail,*collection,*type,*tags,+metadata"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  const countryCode = request.nextUrl.searchParams.get("countryCode") || "nz"

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        fields: SEARCH_FIELDS,
        limit: 8,
        q,
      },
    })

    return NextResponse.json(
      {
        products: response.products
          .filter((product) => product.handle)
          .map((product) => ({
            title: product.title,
            href: `/products/${product.handle}`,
            image: product.thumbnail ?? undefined,
          })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
