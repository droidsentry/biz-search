'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { PropertyWithOwnerAndCompany } from '../action'

interface OwnerTableProps {
  owners: PropertyWithOwnerAndCompany[]
  projectId: string
}

export function OwnerTable({ owners, projectId }: OwnerTableProps) {
  const router = useRouter()
  
  return (
    <div className="rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 overflow-hidden" style={{ height: 'calc(100vh - 50px)' }}>
      <div className="h-full overflow-auto relative">
        <Table className="min-w-[1200px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted-foreground/5 hover:bg-muted-foreground/10 border-b">
            <TableHead className="min-w-[150px] font-medium text-foreground bg-muted-foreground/5">
              所有者氏名
            </TableHead>
            <TableHead className="min-w-[300px] font-medium text-foreground bg-muted-foreground/5">
              所有者住所
            </TableHead>
            <TableHead className="min-w-[300px] font-medium text-foreground bg-muted-foreground/5">
              不動産住所
            </TableHead>
            <TableHead className="min-w-[200px] font-medium text-foreground bg-muted-foreground/5">
              会社名
            </TableHead>
            <TableHead className="min-w-[100px] font-medium text-foreground bg-muted-foreground/5">
              役職
            </TableHead>
            <TableHead className="min-w-[100px] font-medium text-foreground bg-muted-foreground/5">
              ステータス
            </TableHead>
            <TableHead className="min-w-[150px] font-medium text-foreground bg-muted-foreground/5">
              更新日時
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                所有者データがありません
              </TableCell>
            </TableRow>
          ) : (
            owners.map((item) => (
              <TableRow
                key={`${item.ownership_id}-${item.owner.id}`}
                className="hover:bg-muted-foreground/10 transition-colors cursor-pointer"
                onClick={() => {
                  router.push(`/projects/${projectId}/${item.owner.id}`)
                }}
              >
                <TableCell className="font-medium">
                  {item.owner.name}
                </TableCell>
                <TableCell className="text-sm">
                  {item.owner.address}
                </TableCell>
                <TableCell className="text-sm">
                  {item.property_address}
                </TableCell>
                <TableCell>
                  {item.owner.company?.name || '-'}
                </TableCell>
                <TableCell>
                  {item.owner.company?.position || '-'}
                </TableCell>
                <TableCell>
                  {(() => {
                    const owner = item.owner
                    
                    // 調査完了フラグが立っている場合
                    if (owner.investigation_completed) {
                      return (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
                          調査済み
                        </Badge>
                      )
                    }
                    
                    // 会社情報がある場合は調査中
                    if (owner.companies_count && owner.companies_count > 0) {
                      return (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                          調査中
                        </Badge>
                      )
                    }
                    
                    // それ以外は未調査
                    return (
                      <Badge variant="secondary" className="bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20">
                        未調査
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(
                    new Date(item.owner.updated_at),
                    'yyyy/MM/dd HH:mm',
                    { locale: ja }
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}