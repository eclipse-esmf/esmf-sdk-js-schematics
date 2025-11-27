export enum FilterEnums {
  Date,
  Search,
  Enum,
}

export type FilterType = {
  type: FilterEnums;
  label: string;
  prop: string | null;
  filterValue?: string;
  removable?: boolean;
};
