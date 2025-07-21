interface MapViewProps {
  lat: number | null
  lng: number | null
  address: string
}

export function MapView({ lat, lng, address }: MapViewProps) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-full bg-muted-foreground/10 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">地図データがありません</p>
      </div>
    )
  }

  // Google Maps Embed APIを使用
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_CLIENT_KEY || ''}&q=${lat},${lng}&zoom=17`

  return (
    <div className="w-full h-full">
      <iframe
        src={mapUrl}
        className="w-full h-full rounded-lg border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`地図: ${address}`}
      />
    </div>
  )
}