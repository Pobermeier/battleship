const getInitialGridData = (width = 10, height = 10, initialCellValue = 0) => {
  const gridArray = [];

  for (let i = 0; i < height; i++) {
    gridArray.push(new Array(width).fill(initialCellValue));
  }

  return gridArray;
};

module.exports = getInitialGridData;
