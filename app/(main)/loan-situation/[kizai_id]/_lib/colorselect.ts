export const getLoanHeaderBackgroundColor = (index: number, colorSelect: boolean): string => {
  return 'lightgrey';
};

export const getLoanRowBackgroundColor = (rowIndex: number, colIndex: number, colorSelect: boolean): string => {
  if (colIndex === 5) {
    return 'lightgrey';
  } else if (rowIndex === 9) {
    return 'lightgrey';
  }
  return 'white';
};

export const getLoanTextColor = (index: number, colorSelect: boolean): string => {
  return 'black';
};

export const getDateHeaderBackgroundColor = (index: number, colorSelect: boolean): string => {
  return 'black';
};

export const getDateHeaderTextColor = (index: number, colorSelect: boolean): string => {
  return 'white';
};

export const getDateRowBackgroundColor = (rowIndex: number, colIndex: number, colorSelect: boolean): string => {
  if (rowIndex === 0 && colIndex > 2 && colIndex < 9) {
    return 'lightblue';
  } else if (rowIndex === 0 && colIndex > 8 && colIndex < 13) {
    return 'pink';
  } else if (rowIndex === 0 && colIndex > 12 && colIndex < 15) {
    return 'lightblue';
  } else if (rowIndex === 1) {
    return 'lightblue';
  } else if (rowIndex === 9) {
    return 'lightgrey';
  }
  return 'white';
};
