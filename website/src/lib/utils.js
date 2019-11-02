/**
 * Returns a grid in which every cell is the inputted value.
 */
module.exports.getEmptyGrid = (value) => {
  const grid = [];
  for (let gridIndex = 0; gridIndex < 9; gridIndex++) {
    grid.push([]);
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      grid[gridIndex].push([]);
      for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
        grid[gridIndex][rowIndex].push(value);
      }
    }
  }

  return grid;
};

/**
 * Returns the provider the logged-in user is signed in with.
 */
module.exports.getProvider = (loggedInUser) => {
  return loggedInUser.providerData[0].providerId === 'github.com' ? 'github' : 'twitter';
};

/**
 * Return whether or not the provided cell indexes represent a valid move.
 */
module.exports.isMoveValid = (currentGame, gridIndex, rowIndex, columnIndex) => {
  return (
    currentGame.grids[gridIndex][rowIndex][columnIndex] === '' &&
    currentGame.validGridsForNextMove.indexOf(gridIndex) !== -1
  );
};
