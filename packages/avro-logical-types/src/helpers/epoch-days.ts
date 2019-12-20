const millisecondsInADay = 8.64e7;

export const fromDate = (date: any) => (date instanceof Date ? Math.floor(date.getTime() / millisecondsInADay) : date);
export const toDate = (val: number) => new Date(val * millisecondsInADay);
