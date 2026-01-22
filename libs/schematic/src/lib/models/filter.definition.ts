export const FilterEnums = {
  Date: 'Date',
  Search: 'Search',
  Enum: 'Enum',
} as const;
export type FilterEnums = (typeof FilterEnums)[keyof typeof FilterEnums];

export type FilterType = {
  type: FilterEnums;
  label: string;
  prop: string | null;
  filterValue?: string;
  removable?: boolean;
};
