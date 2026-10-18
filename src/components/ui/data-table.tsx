import {
  createColumnHelper,
  columnVisibilityFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { motion, useReducedMotion } from 'motion/react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'

export type Breakpoint = 'sm' | 'md' | 'lg'

export type DataTableColumnMeta = {
  /** Hide this column below the given Tailwind breakpoint (table view). */
  hideBelow?: Breakpoint
  /** Prefer this column as the mobile card title. */
  primary?: boolean
  /** Render this column as the mobile card actions rail. */
  actions?: boolean
  /** Omit from the mobile card meta list. */
  mobileHidden?: boolean
  /** Label used next to the value in the mobile card. Falls back to header string. */
  mobileLabel?: string
  headerClassName?: string
  cellClassName?: string
}

const dataTableColumnMeta: DataTableColumnMeta = {}

export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnMeta: dataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

const HIDE_BELOW_CLASS: Record<Breakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

type DataTableProps<TData extends RowData> = {
  columns: Array<ColumnDef<DataTableFeatures, TData, any>>
  data: TData[]
  getRowId?: (originalRow: TData, index: number) => string
  /** Viewport below which the card list replaces the table. Set false to keep the table. */
  cardBelow?: Breakpoint | false
  className?: string
  tableClassName?: string
  animateRows?: boolean
  empty?: React.ReactNode
}

function metaOf(column: {
  columnDef: { meta?: DataTableColumnMeta }
}): DataTableColumnMeta {
  return column.columnDef.meta ?? {}
}

function headerLabel(header: unknown): string | undefined {
  return typeof header === 'string' ? header : undefined
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  cardBelow = 'md',
  className,
  tableClassName,
  animateRows = true,
  empty,
}: DataTableProps<TData>) {
  const reduce = useReducedMotion()

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
  })

  const rows = table.getRowModel().rows

  const cardShellClass =
    cardBelow === false
      ? 'hidden'
      : cardBelow === 'sm'
        ? 'sm:hidden'
        : cardBelow === 'lg'
          ? 'lg:hidden'
          : 'md:hidden'

  const tableShellClass =
    cardBelow === false
      ? 'block'
      : cardBelow === 'sm'
        ? 'hidden sm:block'
        : cardBelow === 'lg'
          ? 'hidden lg:block'
          : 'hidden md:block'

  if (rows.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cardShellClass}>
        <ul className="divide-y divide-border/70">
          {rows.map((row, index) => {
            const cells = row.getAllCells()
            const primaryCell =
              cells.find((cell) => metaOf(cell.column).primary) ?? cells[0]
            const actionsCell = cells.find(
              (cell) => metaOf(cell.column).actions,
            )
            const metaCells = cells.filter((cell) => {
              const meta = metaOf(cell.column)
              if (meta.primary || meta.actions || meta.mobileHidden) return false
              if (cell.id === primaryCell.id) return false
              if (actionsCell && cell.id === actionsCell.id) return false
              return true
            })

            const body = (
              <>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="min-w-0 text-sm font-medium">
                    <table.FlexRender cell={primaryCell} />
                  </div>
                  {metaCells.length > 0 ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {metaCells.map((cell) => {
                        const meta = metaOf(cell.column)
                        const label =
                          meta.mobileLabel ??
                          headerLabel(cell.column.columnDef.header) ??
                          cell.column.id
                        return (
                          <div key={cell.id} className="contents">
                            <dt className="text-muted-foreground/80">{label}</dt>
                            <dd className="min-w-0 truncate text-foreground/80">
                              <table.FlexRender cell={cell} />
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  ) : null}
                </div>
                {actionsCell ? (
                  <div className="shrink-0 self-start">
                    <table.FlexRender cell={actionsCell} />
                  </div>
                ) : null}
              </>
            )

            if (animateRows && !reduce) {
              return (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.32,
                    ease: [0.22, 1, 0.36, 1],
                    delay: index * 0.045,
                  }}
                  className="flex items-start gap-3 px-3 py-3"
                >
                  {body}
                </motion.li>
              )
            }

            return (
              <li key={row.id} className="flex items-start gap-3 px-3 py-3">
                {body}
              </li>
            )
          })}
        </ul>
      </div>

      <div className={tableShellClass}>
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = metaOf(header.column)
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        meta.hideBelow
                          ? HIDE_BELOW_CLASS[meta.hideBelow]
                          : undefined,
                        meta.headerClassName,
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const cellNodes = row.getAllCells().map((cell) => {
                const meta = metaOf(cell.column)
                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      meta.hideBelow
                        ? HIDE_BELOW_CLASS[meta.hideBelow]
                        : undefined,
                      meta.cellClassName,
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                )
              })

              if (animateRows && !reduce) {
                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                      delay: index * 0.045,
                    }}
                    className="border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted"
                    whileHover={{ x: 2 }}
                  >
                    {cellNodes}
                  </motion.tr>
                )
              }

              return (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {cellNodes}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
