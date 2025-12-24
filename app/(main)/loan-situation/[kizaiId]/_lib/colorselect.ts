export const getDateRowBackgroundColor = (juchuHonbanbiShubetuId: number) => {
  switch (juchuHonbanbiShubetuId) {
    case 4:
      return 'pink';
    case 3:
      return 'lightgreen';
    case 2:
      return 'orange';
    case 1:
      return 'mediumpurple';
    case 7:
      return 'yellow';
    case 6:
      return 'lightblue';
    case 5:
      return '#ACB9CA';
    default:
      return 'white';
  }
};
