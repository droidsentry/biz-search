'use client'

import { PropertyWithOwnerAndCompany } from '../action'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PropertyTableProps {
  properties: PropertyWithOwnerAndCompany[]
  projectId: string
}

export function PropertyTable({ properties, projectId }: PropertyTableProps) {
  const router = useRouter()
  
  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10">
            <TableHead className="w-[20%] font-medium text-foreground">
              不動産住所
            </TableHead>
            <TableHead className="w-[15%] font-medium text-foreground">
              所有者氏名
            </TableHead>
            <TableHead className="w-[20%] font-medium text-foreground">
              所有者住所
            </TableHead>
            <TableHead className="w-[15%] font-medium text-foreground">
              会社名
            </TableHead>
            <TableHead className="w-[10%] font-medium text-foreground">
              役職
            </TableHead>
            <TableHead className="w-[10%] font-medium text-foreground">
              ステータス
            </TableHead>
            <TableHead className="w-[10%] font-medium text-foreground">
              更新日時
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                物件データがありません
              </TableCell>
            </TableRow>
          ) : (
            properties.map((property) => (
              <TableRow
                key={property.id}
                className="hover:bg-muted-foreground/10 transition-colors cursor-pointer "
                onClick={() => {
                  router.push(`/projects/${projectId}/properties/${property.id}`)
                }}
              >
                <TableCell className="font-medium">
                  {property.address}
                </TableCell>
                <TableCell>
                  {property.current_ownership?.owner.name || '-'}
                </TableCell>
                <TableCell>
                  {property.current_ownership?.owner.address || '-'}
                </TableCell>
                <TableCell>
                  {property.current_ownership?.owner.company?.company_name || '-'}
                </TableCell>
                <TableCell>
                  {property.current_ownership?.owner.company?.position || '-'}
                </TableCell>
                <TableCell>
                  {property.current_ownership?.owner.company ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
                      調査済み
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20">
                      未調査
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {property.current_ownership
                    ? format(
                        new Date(property.current_ownership.updated_at),
                        'yyyy/MM/dd HH:mm',
                        { locale: ja }
                      )
                    : '-'}
                </TableCell>
              </TableRow>
  
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}