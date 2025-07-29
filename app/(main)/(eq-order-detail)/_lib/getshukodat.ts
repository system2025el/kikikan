export const GetShukoDate = (kicsShukoDat: Date | null, yardShukoDat: Date | null) => {
  if (kicsShukoDat && yardShukoDat) {
    return kicsShukoDat < yardShukoDat ? kicsShukoDat : yardShukoDat;
  }

  if (kicsShukoDat && !yardShukoDat) {
    return kicsShukoDat;
  }

  if (!kicsShukoDat && yardShukoDat) {
    return yardShukoDat;
  }

  return new Date();
};

export const toISOStringYearMonthDay = (date: Date) => {
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = date.getFullYear().toString();
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  return `${year}/${month}/${day}`;
};
