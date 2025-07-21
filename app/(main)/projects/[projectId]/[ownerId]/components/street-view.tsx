interface StreetViewProps {
  lat: number | null
  lng: number | null
  streetViewAvailable: boolean | null
}

export function StreetView({ lat, lng, streetViewAvailable }: StreetViewProps) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-full bg-muted-foreground/10 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">ストリートビューデータがありません</p>
      </div>
    )
  }

  if (streetViewAvailable === false) {
    return (
      <div className="w-full h-full bg-muted-foreground/10 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">この場所のストリートビューは利用できません</p>
      </div>
    )
  }

  // Google Street View Embed APIを使用
  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_CLIENT_KEY || ''}&location=${lat},${lng}&heading=0&pitch=0&fov=90`

  return (
    <div className="w-full h-full">
      <iframe
        src={streetViewUrl}
        className="w-full h-full rounded-lg border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="ストリートビュー"
      />
    </div>
  )
}