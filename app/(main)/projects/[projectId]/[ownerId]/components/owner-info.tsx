import { OwnerWithCompaniesAndProperties } from '../action'
import { MapPin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OwnerInfoProps {
  owner: OwnerWithCompaniesAndProperties
}

export function OwnerInfo({ owner }: OwnerInfoProps) {
  const googleMapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(owner.address)}`
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
          <p className="text-lg truncate">{owner.address}</p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Link
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Googleマップで開く
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}