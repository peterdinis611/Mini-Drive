'use client'

import { useMemo, useState } from 'react'
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { Button } from '#/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '#/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
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
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
    basic: sortFn_basic,
  },
  filterFns: {
    includesString: filterFn_includesString,
  },
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

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
  /** Show global filter input (TanStack globalFilteringFeature). */
  searchable?: boolean
  searchPlaceholder?: string
  /** Enable client-side pagination. `true` uses 25 / page. */
  pageSize?: number | false
  /** Enable header sorting. Default true. */
  sortable?: boolean
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
  searchable = false,
  searchPlaceholder = 'Hľadať v tabuľke…',
  pageSize = false,
  sortable = true,
}: DataTableProps<TData>) {
  const reduce = useReducedMotion()
  const [globalFilter, setGlobalFilter] = useState('')

  const paginationEnabled = pageSize !== false
  const initialPageSize =
    typeof pageSize === 'number' && pageSize > 0 ? pageSize : 10_000

  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data,
      getRowId,
      enableSorting: sortable,
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: initialPageSize,
        },
      },
      state: {
        globalFilter,
      },
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn: 'includesString',
    },
    (state) => ({
      pagination: state.pagination,
      sorting: state.sorting,
      globalFilter: state.globalFilter,
    }),
  )

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const { pageIndex, pageSize: currentPageSize } = table.state.pagination
  const filteredCount = table.getFilteredRowModel().rows.length

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

  const toolbar = useMemo(() => {
    if (!searchable && !paginationEnabled) return null
    return (
      <div className="flex flex-col gap-3 border-b border-border/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        {searchable ? (
          <InputGroup className="h-8 w-full sm:max-w-64">
            <InputGroupAddon>
              <Search className="size-3.5" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Filtrovať tabuľku"
            />
          </InputGroup>
        ) : (
          <span />
        )}
        {paginationEnabled ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Riadkov</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[4.5rem]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    )
  }, [
    searchable,
    paginationEnabled,
    globalFilter,
    searchPlaceholder,
    currentPageSize,
    table,
  ])

  if (data.length === 0 && empty) {
    return <>{empty}</>
  }

  if (rows.length === 0 && empty && !globalFilter) {
    return <>{empty}</>
  }

  return (
    <div className={cn('w-full', className)}>
      {toolbar}

      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {globalFilter
            ? `Žiadne výsledky pre „${globalFilter}“.`
            : 'Žiadne riadky.'}
        </p>
      ) : (
        <>
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
                  if (meta.primary || meta.actions || meta.mobileHidden)
                    return false
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
                                <dt className="text-muted-foreground/80">
                                  {label}
                                </dt>
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
                  <li
                    key={row.id}
                    className="flex items-start gap-3 px-3 py-3"
                  >
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
                      const canSort =
                        sortable && header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            meta.hideBelow
                              ? HIDE_BELOW_CLASS[meta.hideBelow]
                              : undefined,
                            meta.headerClassName,
                            canSort && 'p-0',
                          )}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="-ml-2 h-8 gap-1.5 px-2 font-medium hover:bg-transparent"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <table.FlexRender header={header} />
                              {sorted === 'asc' ? (
                                <ArrowUp className="size-3.5 opacity-70" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown className="size-3.5 opacity-70" />
                              ) : (
                                <ArrowUpDown className="size-3.5 opacity-40" />
                              )}
                            </Button>
                          ) : (
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
        </>
      )}

      {paginationEnabled && pageCount > 1 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-3 py-3 sm:flex-row">
          <p className="font-meta text-xs text-muted-foreground">
            Strana {pageIndex + 1} / {pageCount}
            {' · '}
            {filteredCount} riadkov
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!table.getCanPreviousPage()}
                  className={cn(
                    !table.getCanPreviousPage() &&
                      'pointer-events-none opacity-40',
                  )}
                  onClick={(event) => {
                    event.preventDefault()
                    table.previousPage()
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={!table.getCanNextPage()}
                  className={cn(
                    !table.getCanNextPage() && 'pointer-events-none opacity-40',
                  )}
                  onClick={(event) => {
                    event.preventDefault()
                    table.nextPage()
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  )
}
