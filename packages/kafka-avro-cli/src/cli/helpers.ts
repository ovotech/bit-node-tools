export const filterSearch = (search: string | undefined, list: string[]): string[] => {
  if (!search) {
    return list;
  }
  if (list.includes(search)) {
    return [search];
  }
  return list.filter(item => item.includes(search));
};
