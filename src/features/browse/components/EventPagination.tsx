import { BrowsePagination } from './BrowsePagination';

type Props = {
  page: number;
  totalPages: number;
  searchParams?: string;
};

export function EventPagination({ page, totalPages, searchParams }: Props) {
  return (
    <BrowsePagination
      page={page}
      totalPages={totalPages}
      basePath="/browse/events"
      searchParams={searchParams}
    />
  );
}
