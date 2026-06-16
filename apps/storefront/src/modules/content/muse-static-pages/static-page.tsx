type StaticPageProps = {
  html: string
  variant: "faq" | "legal"
}

export default function StaticPage({ html, variant }: StaticPageProps) {
  return (
    <div
      className={`muse-static-page muse-static-page-${variant}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
