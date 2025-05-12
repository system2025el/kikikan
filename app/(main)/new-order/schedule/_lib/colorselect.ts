export const getDateRowBackgroundColor = (rowIndex: number, colIndex: number, colorSelect: boolean): string => {
  if (colorSelect && (rowIndex === 0 || rowIndex === 1)) {
    switch (colIndex) {
      case 2:
        return 'lightblue';
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
      case 10:
        return 'yellow';
      default:
        return 'white';
    }
  } else if (colorSelect && rowIndex === 2) {
    switch (colIndex) {
      case 1:
        return 'lightblue';
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
      case 10:
        return 'yellow';
      default:
        return 'white';
    }
  } else if (colorSelect && rowIndex === 4 && colIndex === 1) {
    return 'lightblue';
  } else if (colorSelect && rowIndex === 5 && colIndex === 2) {
    return 'lightblue';
  } else if (colorSelect && rowIndex === 6 && colIndex === 10) {
    return 'yellow';
  }
  return 'white';
};

export const getEquipmentRowBackgroundColor = (rowIndex: number, colIndex: number, colorSelect: boolean): string => {
  if (colorSelect && rowIndex < 3) {
    switch (colIndex) {
      case 1:
        return 'lightgrey';
      case 4:
        return 'lightgrey';
      default:
        return 'white';
    }
  } else if (colorSelect && rowIndex > 3 && colIndex < 5) {
    return 'lightgrey';
  }
  return 'white';
};

export const getDateHeaderBackgroundColor = (index: number, colorSelect: boolean): string => {
  return colorSelect && 0 < index && index < 11 ? 'blue' : 'black';
};

export const getEquipmentHeaderBackgroundColor = (index: number, colorSelect: boolean): string => {
  switch (index) {
    case 0:
      return 'black';
    case 1:
      return 'lightgrey';
    case 4:
      return 'lightgrey';
    default:
      return 'white';
  }
};

export const getDateTextColor = (index: number, colorSelect: boolean): string => {
  return 'white';
};

export const getEquipmentTextColor = (index: number, colorSelect: boolean): string => {
  if (index === 0) {
    return 'white';
  }
  return 'black';
};
