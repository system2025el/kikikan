export const getBackgroundColor = (rowIndex: number, colIndex: number, colorSelect: boolean): string => {
  if (colorSelect && (rowIndex === 0 || rowIndex === 1)) {
    switch (colIndex) {
      case 3:
        return 'purple';
      case 4:
        return 'orange';
      case 5:
        return 'green';
      case 6:
        return 'pink';
      case 7:
        return 'pink';
      case 8:
        return 'pink';
      case 9:
        return 'pink';
      default:
        return 'white';
    }
  } else if (colorSelect && rowIndex === 2) {
    switch (colIndex) {
      case 2:
        return 'purple';
      case 3:
        return 'orange';
      case 4:
        return 'green';
      case 5:
        return 'pink';
      case 6:
        return 'pink';
      case 7:
        return 'pink';
      case 8:
        return 'pink';
      case 9:
        return 'pink';
      default:
        return 'white';
    }
  } else if (colorSelect && rowIndex === 4 && colIndex === 1) {
    return 'lightblue';
  } else if (colorSelect && rowIndex === 5 && colIndex === 2) {
    return 'lightblue';
  }
  return 'white';
};
