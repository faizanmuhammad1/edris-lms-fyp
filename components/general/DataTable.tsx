"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Text matched by the search box for each row. Omit to hide the search box. */
  getSearchText?: (row: TData) => string;
  searchPlaceholder?: string;
  /** Extra controls (filters, bulk actions) shown next to the search box. */
  toolbar?: ReactNode;
  /** Shown when `data` is empty. */
  emptyState?: ReactNode;
  /** Shown when search/filters match nothing. */
  noResultsText?: string;
  /** Renders each row as a card below the md breakpoint instead of a scrolling table. */
  renderMobileCard?: (row: TData) => ReactNode;
  pageSize?: number;
  getRowId?: (row: TData) => string;
  /** Accessible name for the table. */
  caption?: string;
  className?: string;
}

/**
 * Standard data table: search, sortable columns, pagination, empty/no-result states,
 * and an optional card layout on phones.
 */
export function DataTable<TData>({
  columns,
  data,
  getSearchText,
  searchPlaceholder = "Search...",
  toolbar,
  emptyState,
  noResultsText = "No results match your search.",
  renderMobileCard,
  pageSize = 10,
  getRowId,
  caption,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const globalFilterFn = useMemo<FilterFn<TData>>(
    () => (row, _columnId, value: string) =>
      !value || (getSearchText?.(row.original) ?? "").toLowerCase().includes(value.toLowerCase()),
    [getSearchText]
  );

  // The search box filters by getSearchText, so the filter runs once per row.
  // TanStack Table isn't React-Compiler compatible; this app doesn't use the compiler.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getColumnCanGlobalFilter: (column) => column.getIndex() === 0,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const { pageIndex } = table.getState().pagination;

  return (
    <div className={cn("space-y-4", className)}>
      {(getSearchText || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {getSearchText && (
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground" role="status">
          {noResultsText}
        </p>
      ) : (
        <>
          {renderMobileCard && (
            <ul className="space-y-3 md:hidden" aria-label={caption}>
              {rows.map((row) => (
                <li key={row.id}>{renderMobileCard(row.original)}</li>
              ))}
            </ul>
          )}
          <div className={cn("rounded-xl border bg-card", renderMobileCard && "hidden md:block")}>
            <Table>
              {caption && <caption className="sr-only">{caption}</caption>}
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                          className="whitespace-nowrap"
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Page {pageIndex + 1} of {pageCount}
            <span className="hidden sm:inline"> · {filteredCount} total</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

/** Column header that toggles sorting; use as `header: ({ column }) => <SortableHeader column={column} title="Name" />`. */
export function SortableHeader<TData>({ column, title }: { column: Column<TData, unknown>; title: string }) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=sorted]:text-foreground"
      data-state={sorted ? "sorted" : undefined}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
    </Button>
  );
}
