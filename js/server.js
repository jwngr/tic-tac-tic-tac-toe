/*************/
/*  MODULES  */
/*************/
var Firebase = require("firebase");

/********************/
/*  INITIALIZATION  */
/********************/
// Get a reference to the Firebase
var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

// TODO: get these off global scope?
var serverTimeOffset;
var numSecondsUntilNextMove = 5;
var suggestions = getEmptyGrid(0);
var currentGame;
var wins;

// Make sure we passed in the Firebase secret as a command line argument
if (process.argv.length !== 3) {
  console.log("Usage: node server.js <firebase_auth_token>");
  process.exit();
}

// Autheticate to the Firebase
rootRef.auth(process.argv[2], function(error) {
  // Exit if the auth token was invalid
  if (error) {
    console.log(error.code + " Error: Invalid auth token for " + rootRef.toString());
    process.exit();
  }

  // Get the time offset between this client and the Firebase server and set the local timer
  rootRef.child(".info/serverTimeOffset").once("value", function(dataSnapshot) {
    serverTimeOffset = dataSnapshot.val();

    // Reset the current game
    resetCurrentGame();

    // Update the timer every second
    var updateTimerInterval = setInterval(updateTimer, 1000);
  });


  /*****************/
  /*  SUGGESTIONS  */
  /*****************/
  // Increment the correct cell in the suggestions grid when a new suggestion is added
  rootRef.child("suggestions").on("child_added", function(childSnapshot) {
    var suggestion = childSnapshot.val();
    suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;
  });
  // Decrement the correct cell in the suggestions grid when a suggestion is removed
  rootRef.child("suggestions").on("child_removed", function(childSnapshot) {
    var suggestion = childSnapshot.val();
    suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] -= 1;
  });
  // Update the correct cells in the suggestions grid when a suggestion is changed
  rootRef.child("suggestions/").on("child_changed", function(childSnapshot) {
    var suggestion = childSnapshot.val();
    suggestions[suggestion.previousSuggestion.gridIndex][suggestion.previousSuggestion.rowIndex][suggestion.previousSuggestion.columnIndex] -= 1;
    suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;
  });

  /**********/
  /*  WINS  */
  /**********/
  rootRef.child("wins").once("value", function(dataSnapshot) {
    wins = dataSnapshot.val();
  });
});


/****************/
/*  GAME SETUP  */
/****************/
/* Returns a grid in which every cell is the inputted value */
function getEmptyGrid(value) {
  return [
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ],
    [ [ value, value, value], [value, value, value], [value, value, value] ]
  ];
};

/* Initializes a new game, wiping out any existing game */
function resetCurrentGame() {
  // Initialize the current game globally
  currentGame = {
    whoseTurn: (Math.random() > 0.5) ? "github" : "twitter",
    winner: "",
    grids: getEmptyGrid(""),
    uberGrid: [
      [ "", "", "" ],
      [ "", "", "" ],
      [ "", "", "" ]
    ],
    validGridsForNextMove: "0,1,2,3,4,5,6,7,8",
    timeOfNextMove: generateTimeOfNextMove(5)
  };

  // Update Firebase with the current game
  rootRef.update({
    currentGame: currentGame
  });

  // Create a new game event
  rootRef.child("events").push({
    imageUrl: "./images/ticTacTicTacToeLogo.png",
    text: "A new game has started!",
    type: "newGame"
  });

  // Reset the timer
  numSecondsUntilNextMove = 5;
};


/***********/
/*  TIMER  */
/***********/
/* Returns the time at which the next move should be made */
function generateTimeOfNextMove(numSecondsUntilNextMove) {
  return new Date().getTime() + serverTimeOffset + (numSecondsUntilNextMove * 1000);
};

/* Updates the timer and the game message text */
function updateTimer() {
  // Decrement the number of seconds until the next move
  numSecondsUntilNextMove -= 1;

  // If the timer has hit zero, reset it and make a move for the current team
  if (numSecondsUntilNextMove == 0)
  {
    // If there is not a winner, reset the timer in Firebase and make a move for the current team
    if (!currentGame.winner) {
      makeMove();
    }
    // Otherwise, reset the game since it has been won
    else {
      resetCurrentGame();
    }
  }
};


/***********************/
/*  UPDATE GAME STATE  */
/***********************/
/* Makes a move for the current team by choosing the most popular suggestion */
function makeMove() {
  // Get the cell where the current move will be made
  var currentMoveCell = getMostSuggestedCell();

  // Update the inputted cell's value
  currentGame.grids[currentMoveCell.gridIndex][currentMoveCell.rowIndex][currentMoveCell.columnIndex] = currentGame.whoseTurn;

  // Get the image URL and team name of the team who is making the move
  var imageUrl = (currentGame.whoseTurn == "github") ? "./images/gitHubLogo.png" : "./images/twitterLogo.png";
  var team = (currentGame.whoseTurn == "github") ? "GitHub" : "Twitter";

  // Create an event for the move
  rootRef.child("events").push({
    imageUrl: imageUrl,
    teamName: team,
    text: " played [" + currentMoveCell.gridIndex + "," + currentMoveCell.rowIndex + "," + currentMoveCell.columnIndex + "]",
    type: "move"
  });

  // Update whose turn it is
  currentGame.whoseTurn = (currentGame.whoseTurn == "github") ? "twitter" : "github";

  // Store this move as the previous move
  currentGame.previousMove = currentMoveCell;

  // Update the uber grid if the current grid was won
  currentGame.uberGrid[Math.floor(currentMoveCell.gridIndex / 3)][currentMoveCell.gridIndex % 3] = getGridWinner(currentGame.grids[currentMoveCell.gridIndex]);

  // Get the grids in which the next move can be made
  currentGame.validGridsForNextMove = getValidGridsForNextMove(currentMoveCell.rowIndex, currentMoveCell.columnIndex);

  // Clear the move suggestions
  rootRef.child("suggestions").remove();

  // Check if the uber grid was won and the game should end
  var uberGridWinner = getGridWinner(currentGame.uberGrid);
  if (uberGridWinner) {
    // Add a game over event to the play by play ticker
    var team = (uberGridWinner == "github") ? "GitHub" : "Twitter";
    rootRef.child("events").push({
      imageUrl: "./images/ticTacTicTacToeLogo.png",
      teamName: team,
      text: " won!",
      type: "gameOver"
    });

    // Specify who won the game
    currentGame.winner = uberGridWinner;

    // Wait ten seconds until the next game starts
    currentGame.timeOfNextMove += 10000;
    numSecondsUntilNextMove = 10;

    // Increment the number of teams wins
    if (uberGridWinner == "github") {
      wins.github += 1;
    }
    else {
      wins.twitter += 1;
    }

    // Update the number of wins in Firebase
    rootRef.child("wins/" + uberGridWinner).set(wins[uberGridWinner]);

    // Append the current game to the games history
    rootRef.child("history").push(currentGame);     // TODO: only send data that is needed (e.g. no need for timestamp or previous move)
  }

  // Otherwise, if there is no winner, set the next move to be made in five seconds
  else {
    currentGame.timeOfNextMove += 5000;
    numSecondsUntilNextMove = 5;
  }

  // Update the current game in Firebase
  rootRef.update({
    currentGame: currentGame
  });
};


/**********************/
/*  HELPER FUNCTIONS  */
/**********************/
/* Returns a random grid cell in which the next move can be made */
function getRandomValidMove() {
  // Get the valid grids for next move as an array
  var validGridsForNextMove = currentGame.validGridsForNextMove.split(",");

  // Randomly choose one of the valid grids to make a move in
  var numValidGridsForNextMove = validGridsForNextMove.length;
  var gridIndex = parseInt(validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)]);

  // Keep looping until we find cell coordinates for an open cell
  var rowIndex = Math.floor(Math.random() * 3);
  var columnIndex = Math.floor(Math.random() * 3);
  while (currentGame.grids[gridIndex][rowIndex][columnIndex] != "") {
    rowIndex = Math.floor(Math.random() * 3);
    columnIndex = Math.floor(Math.random() * 3);
  }

  // Return the random, valid cell
  return {
    gridIndex: gridIndex,
    rowIndex: rowIndex,
    columnIndex: columnIndex
  }
};

/* Returns the location of the most suggested cell or a random valid cell if there aer no suggestions */
function getMostSuggestedCell() {
  // Create a variable to hold the most suggested cell
  var maxSuggestion = {
    numTimesSuggested: 0
  };

  // For each grid in which the current move can be made, check if it has the most suggested cell
  currentGame.validGridsForNextMove.split(",").forEach(function(i) {
    for (var j = 0; j < 3; ++j) {
      for (var k = 0; k < 3; ++k) {
        var numTimesSuggested = suggestions[i][j][k];
        if (numTimesSuggested > maxSuggestion.numTimesSuggested || (numTimesSuggested == maxSuggestion.numTimesSuggested && Math.random() > 0.5)) {
          console.assert(numTimesSuggested == 0 || currentGame.grids[i][j][k] === ""); // TODO: make this go to debugger if not correct
          maxSuggestion = {
            gridIndex: i,
            rowIndex: j,
            columnIndex: k,
            numTimesSuggested: numTimesSuggested
          };
        }
      }
    }
  });

  // If no suggestions were made, choose a random valid cell
  if (maxSuggestion.numTimesSuggested == 0) {
    maxSuggestion = getRandomValidMove();
  }

  // Return the location of the most suggested cell
  return {
    gridIndex: maxSuggestion.gridIndex,
    rowIndex: maxSuggestion.rowIndex,
    columnIndex: maxSuggestion.columnIndex
  };
};

/* Returns true if the cell represented by the inputs is a cell in which the next move can be validly made */
function isMoveValid(gridIndex, rowIndex, columnIndex) {
  return (currentGame.grids[gridIndex][rowIndex][columnIndex] == "" && currentGame.validGridsForNextMove.indexOf(gridIndex) != -1);
};

/* Returns a comma-separated string of each grid in which the next move can validly be made */
function getValidGridsForNextMove(rowIndex, columnIndex) {
  // If that grid is already won, add each un-won grid to the valid grids for next move list
  if (currentGame.uberGrid[rowIndex][columnIndex]) {
    validGridsForNextMove = [];
    for (var i = 0; i < 3; ++i) {
      for (var j = 0; j < 3; ++j) {
        if (currentGame.uberGrid[i][j] == "") {
          validGridsForNextMove.push((3 * i) + j);
        }
      }
    }
  }
  else {
    // Otherwise, just add that single grid
    var grids = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ];
    validGridsForNextMove = [grids[rowIndex][columnIndex]];
  }

  // Return the valid grids for the next move as a string
  return validGridsForNextMove.toString();
};

/* Returns the winner of the inputted grid or "" if no one has won the grid */
function getGridWinner(grid) {
  // Set the grid as not won
  var gridWinner = "";

  // Check for a win across the rows
  for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
    if (grid[rowIndex][0] !== "" && grid[rowIndex][0] == grid[rowIndex][1] && grid[rowIndex][1] == grid[rowIndex][2])
    {
      gridWinner = grid[rowIndex][0];
    }
  }

  if (!gridWinner) {
    // Check for a win down the columns
    for (var columnIndex = 0; columnIndex < 3; ++columnIndex) {
      if (grid[0][columnIndex] !== "" && grid[0][columnIndex] == grid[1][columnIndex] && grid[1][columnIndex] == grid[2][columnIndex])
      {
        gridWinner = grid[0][columnIndex];
      }
    }

    if (!gridWinner) {
      // Check for a win on the diagnoals
      if (grid[0][0] !== "" && grid[0][0] == grid[1][1] && grid [1][1] == grid [2][2]) {
        gridWinner = grid[0][0];
      }
      else if (grid[0][2] !== "" && grid[0][2] == grid[1][1] && grid [1][1] == grid [2][0]) {
        gridWinner = grid[0][2];
      }

      if (!gridWinner) {
        // If the grid is full, the player with the most cells wins
        var numXCells = 0;
        var numOCells = 0;
        for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
          for (var columnIndex = 0; columnIndex < 3; ++ columnIndex) {
            if (grid[rowIndex][columnIndex] == "github") {
              numXCells += 1;
            }
            else if (grid[rowIndex][columnIndex] == "twitter") {
              numOCells += 1;
            }
          }
        }

        if (numXCells + numOCells == 9) {
          if (numXCells > numOCells) {
            gridWinner = "github";
          }
          else {
            gridWinner = "twitter";
          }
        }
      }
    }
  }

  // Return the winner of the grid or "" if no one has won the grid
  return gridWinner;
};