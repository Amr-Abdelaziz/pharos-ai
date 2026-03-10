import { BrowsePagination } from './BrowsePagination';

type Props = {
  page: number;
  totalPages: number;
};

export function StoryPagination({ page, totalPages }: Props) {
  return (
    <BrowsePagination
      page={page}
      totalPages={totalPages}
      basePath="/browse/stories"
    />
  );
}
