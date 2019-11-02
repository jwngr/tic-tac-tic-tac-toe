'use strict';

/*************/
/*  MODULES  */
/*************/
/* jshint -W079 */
var Firebase = require('firebase');
/* jshint +W079 */

/********************/
/*  INITIALIZATION  */
/********************/
// Get references to Firebase
var rootRef = new Firebase('https://tic-tac-tic-tac-toe.firebaseio.com/');
var winsRef = rootRef.child('wins');
var eventsRef = rootRef.child('events');
var currentGameRef = rootRef.child('currentGame');
var suggestionsRef = rootRef.child('suggestions');
var loggedInUsersRef = rootRef.child('loggedInUsers')

// Constants
var SERVER_TIME_OFFSET;
var NUM_EVENTS_TO_STORE = 100;

// HACK: pre-define these functions to avoid used-before-defined JSHint warnings
var updateTimer, getEmptyGrid, resetCurrentGame, createSuggestionEvent;

// Globals
var wins;
var currentGame;
var numSecondsUntilNextMove;
var suggestions;

console.log('[INFO] Starting tic-tac-tic-tac-toe server...');

// Make sure the Firebase token was provided
if (typeof process.argv[2] === 'undefined' && typeof process.env.FIREBASE_TOKEN === 'undefined') {
  console.log('[ERROR] Usage: node server.js <FIREBASE_TOKEN>');
  process.exit(1);
}

// Autheticate to the Firebase
rootRef.authWithCustomToken(process.argv[2] || process.env.FIREBASE_TOKEN, function(error) {
  // Exit if the auth token was invalid
  if (error !== null) {
    console.log('[ERROR] Invalid auth token:', error.code);
    process.exit(1);
  } else {
    console.log('[INFO] Successfully authenticated to Firebase');
  }

  // Get the time offset between this process and the Firebase server and start the move timer
  rootRef.child('.info/serverTimeOffset').once(
    'value',
    function(snapshot) {
      SERVER_TIME_OFFSET = snapshot.val();

      // Reset the suggestions
      suggestions = getEmptyGrid(0);

      // Reset the current game
      resetCurrentGame();

      // Update the timer every second
      setInterval(updateTimer, 1000);
    },
    function(error) {
      console.log('[ERROR] Failed to establish listener on ".info/serverTimeOffset":', error);
    }
  );

  // Increment the correct cell in the suggestions grid when a new suggestion is added
  suggestionsRef.on(
    'child_added',
    function(childSnapshot) {
      var suggestion = childSnapshot.val();
      suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;

      // Create an event for the logged-in user's suggestion
      createSuggestionEvent(childSnapshot.key(), suggestion);
    },
    function(error) {
      console.log('[ERROR] Failed to establish "child_added" listener on "suggestions":', error);
    }
  );
  // Decrement the correct cell in the suggestions grid when a suggestion is removed
  suggestionsRef.on(
    'child_removed',
    function(childSnapshot) {
      var suggestion = childSnapshot.val();
      suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] -= 1;
    },
    function(error) {
      console.log('[ERROR] Failed to establish "child_removed" listener on "suggestions":', error);
    }
  );
  // Update the correct cells in the suggestions grid when a suggestion is changed
  suggestionsRef.on(
    'child_changed',
    function(childSnapshot) {
      var suggestion = childSnapshot.val();
      suggestions[suggestion.previousSuggestion.gridIndex][suggestion.previousSuggestion.rowIndex][
        suggestion.previousSuggestion.columnIndex
      ] -= 1;
      suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;

      // Create an event for the logged-in user's suggestion
      createSuggestionEvent(childSnapshot.key(), suggestion);
    },
    function(error) {
      console.log('[ERROR] Failed to establish "child_changed" listener on "suggestions":', error);
    }
  );

  // Get the existing win counts
  winsRef.on('value', function(snapshot) {
    wins = snapshot.val();
  }, function(error) {
    console.log('[ERROR] Failed to establish "value" listener on "wins":', error);
  });

  // Only store the last NUM_EVENTS_TO_STORE events
  eventsRef
    .limitToLast(NUM_EVENTS_TO_STORE)
    .on('child_removed', function(snapshot) {
      snapshot.ref().remove(function(error) {
        if (error !== null) {
          console.log('[ERROR] Failed to remove old event:', error);
        }
      });
    });
});

/**********************/
/*  HELPER FUNCTIONS  */
/**********************/
/* Returns a random grid cell in which the next move can be made */
var getRandomValidMove = function() {
  // Get the valid grids for next move as an array
  var validGridsForNextMove = currentGame.validGridsForNextMove.split(',');

  // Randomly choose one of the valid grids to make a move in
  var numValidGridsForNextMove = validGridsForNextMove.length;
  var gridIndex = parseInt(
    validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)]
  );

  // Keep looping until we find cell coordinates for an open cell
  var rowIndex = Math.floor(Math.random() * 3);
  var columnIndex = Math.floor(Math.random() * 3);
  while (currentGame.grids[gridIndex][rowIndex][columnIndex] !== '') {
    rowIndex = Math.floor(Math.random() * 3);
    columnIndex = Math.floor(Math.random() * 3);
  }

  // Return the random, valid cell
  return {
    gridIndex: gridIndex,
    rowIndex: rowIndex,
    columnIndex: columnIndex,
  };
};

/* Returns the location of the most suggested cell or a random valid cell if there aer no suggestions */
var getMostSuggestedCell = function() {
  // Create a variable to hold the most suggested cell
  var maxSuggestion = {
    numTimesSuggested: 0,
  };

  // For each grid in which the current move can be made, check if it has the most suggested cell
  currentGame.validGridsForNextMove.split(',').forEach(function(i) {
    for (var j = 0; j < 3; ++j) {
      for (var k = 0; k < 3; ++k) {
        var numTimesSuggested = suggestions[i][j][k];
        if (
          numTimesSuggested > maxSuggestion.numTimesSuggested ||
          (numTimesSuggested === maxSuggestion.numTimesSuggested && Math.random() > 0.5)
        ) {
          console.assert(numTimesSuggested === 0 || currentGame.grids[i][j][k] === ''); // TODO: make this go to debugger if not correct
          maxSuggestion = {
            gridIndex: i,
            rowIndex: j,
            columnIndex: k,
            numTimesSuggested: numTimesSuggested,
          };
        }
      }
    }
  });

  // If no suggestions were made, choose a random valid cell
  if (maxSuggestion.numTimesSuggested === 0) {
    maxSuggestion = getRandomValidMove();
  }

  // Return the location of the most suggested cell
  return {
    gridIndex: maxSuggestion.gridIndex,
    rowIndex: maxSuggestion.rowIndex,
    columnIndex: maxSuggestion.columnIndex,
  };
};

/* Returns a comma-separated string of each grid in which the next move can validly be made */
var getValidGridsForNextMove = function(rowIndex, columnIndex) {
  // If that grid is already won, add each un-won grid to the valid grids for next move list
  var validGridsForNextMove;
  if (currentGame.uberGrid[rowIndex][columnIndex]) {
    validGridsForNextMove = [];
    for (var i = 0; i < 3; ++i) {
      for (var j = 0; j < 3; ++j) {
        if (currentGame.uberGrid[i][j] === '') {
          validGridsForNextMove.push(3 * i + j);
        }
      }
    }
  } else {
    // Otherwise, just add that single grid
    var grids = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
    validGridsForNextMove = [grids[rowIndex][columnIndex]];
  }

  // Return the valid grids for the next move as a string
  return validGridsForNextMove.toString();
};

/* Returns the winner of the inputted grid or "" if no one has won the grid */
var getGridWinner = function(grid) {
  // Set the grid as not won
  var gridWinner = '';

  // Check for a win across the rows
  for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
    if (
      grid[rowIndex][0] !== '' &&
      grid[rowIndex][0] === grid[rowIndex][1] &&
      grid[rowIndex][1] === grid[rowIndex][2]
    ) {
      gridWinner = grid[rowIndex][0];
    }
  }

  if (!gridWinner) {
    // Check for a win down the columns
    for (var columnIndex = 0; columnIndex < 3; ++columnIndex) {
      if (
        grid[0][columnIndex] !== '' &&
        grid[0][columnIndex] === grid[1][columnIndex] &&
        grid[1][columnIndex] === grid[2][columnIndex]
      ) {
        gridWinner = grid[0][columnIndex];
      }
    }

    if (!gridWinner) {
      // Check for a win on the diagnoals
      if (grid[0][0] !== '' && grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
        gridWinner = grid[0][0];
      } else if (grid[0][2] !== '' && grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
        gridWinner = grid[0][2];
      }

      if (!gridWinner) {
        // If the grid is full, the player with the most cells wins
        var numXCells = 0;
        var numOCells = 0;
        for (rowIndex = 0; rowIndex < 3; ++rowIndex) {
          for (columnIndex = 0; columnIndex < 3; ++columnIndex) {
            if (grid[rowIndex][columnIndex] === 'github') {
              numXCells += 1;
            } else if (grid[rowIndex][columnIndex] === 'twitter') {
              numOCells += 1;
            }
          }
        }

        if (numXCells + numOCells === 9) {
          if (numXCells > numOCells) {
            gridWinner = 'github';
          } else {
            gridWinner = 'twitter';
          }
        }
      }
    }
  }

  // Return the winner of the grid or "" if no one has won the grid
  return gridWinner;
};

/* Adds a suggestion event to the /events/ node */
createSuggestionEvent = function(uid, suggestion) {
  var provider = uid.split(':')[0];
  loggedInUsersRef
    .child(provider)
    .child(uid)
    .once('value', function(userSnapshot) {
      var user = userSnapshot.val();
      if (user) {
        eventsRef.push({
          imageUrl: user.imageUrl,
          userUrl: user.userUrl,
          text:
            ' chose [' +
            suggestion.gridIndex +
            ',' +
            suggestion.rowIndex +
            ',' +
            suggestion.columnIndex +
            ']',
          username: user.username,
          uid: uid,
          type: 'suggestion',
        },
        function(error) {
          if (error !== null) {
            console.log('[ERROR] Failed to add suggestion event:', error);
          }
        });
      }
    });
};

/***********************/
/*  UPDATE GAME STATE  */
/***********************/
/* Makes a move for the current team by choosing the most popular suggestion */
var makeMove = function() {
  // Get the cell where the current move will be made
  var currentMoveCell = getMostSuggestedCell();

  // Update the inputted cell's value
  currentGame.grids[currentMoveCell.gridIndex][currentMoveCell.rowIndex][
    currentMoveCell.columnIndex
  ] =
    currentGame.whoseTurn;

  // Get the image URL and team name of the team who is making the move
  var imageUrl =
    currentGame.whoseTurn === 'github' ? './images/gitHubLogo.png' : './images/twitterLogo.png';
  var team = currentGame.whoseTurn === 'github' ? 'GitHub' : 'Twitter';

  // Create an event for the move
  eventsRef.push({
    imageUrl: imageUrl,
    teamName: team,
    text:
      ' played [' +
      currentMoveCell.gridIndex +
      ',' +
      currentMoveCell.rowIndex +
      ',' +
      currentMoveCell.columnIndex +
      ']',
    type: 'move',
  },
  function(error) {
    if (error !== null) {
      console.log('[ERROR] Failed to add move event:', error);
    }
  });

  // Update whose turn it is
  currentGame.whoseTurn = currentGame.whoseTurn === 'github' ? 'twitter' : 'github';

  // Store this move as the previous move
  currentGame.previousMove = currentMoveCell;

  // Update the uber grid if the current grid was won
  currentGame.uberGrid[Math.floor(currentMoveCell.gridIndex / 3)][
    currentMoveCell.gridIndex % 3
  ] = getGridWinner(currentGame.grids[currentMoveCell.gridIndex]);

  // Get the grids in which the next move can be made
  currentGame.validGridsForNextMove = getValidGridsForNextMove(
    currentMoveCell.rowIndex,
    currentMoveCell.columnIndex
  );

  // Clear the move suggestions
  suggestionsRef.remove();

  // Check if the uber grid was won and the game should end
  var uberGridWinner = getGridWinner(currentGame.uberGrid);
  if (uberGridWinner) {
    // Add a game over event to the play by play ticker
    team = uberGridWinner === 'github' ? 'GitHub' : 'Twitter';
    eventsRef.push({
      imageUrl: './images/ticTacTicTacToeLogo.png',
      teamName: team,
      text: ' won!',
      type: 'gameOver',
    },
    function(error) {
      if (error !== null) {
        console.log('[ERROR] Failed to add game over event:', error);
      }
    });

    // Specify who won the game
    currentGame.winner = uberGridWinner;

    // Wait ten seconds until the next game starts
    currentGame.timeOfNextMove += 10000;
    numSecondsUntilNextMove = 10;

    // Increment the number of teams wins
    if (uberGridWinner === 'github') {
      wins.github += 1;
    } else {
      wins.twitter += 1;
    }

    console.log('[INFO] Game won by', uberGridWinner);

    // Update the number of wins in Firebase
    winsRef.child(uberGridWinner).set(wins[uberGridWinner], function(error) {
      if (error !== null) {
        console.log('[ERROR] Failed to update wins:', error);
      }
    });
  } else {
    // Otherwise, if there is no winner, set the next move to be made in five seconds
    currentGame.timeOfNextMove += 7000;
    numSecondsUntilNextMove = 7;
  }

  // Update the current game in Firebase
  currentGameRef.set(currentGame, function(error) {
    if (error !== null) {
      console.log('[ERROR] Failed to set current game:', error);
    }
  });
};

/***********/
/*  TIMER  */
/***********/
/* Returns the time at which the next move should be made */
var generateTimeOfNextMove = function(numSecondsUntilNextMove) {
  return new Date().getTime() + SERVER_TIME_OFFSET + numSecondsUntilNextMove * 1000;
};

/* Updates the timer and the game message text */
updateTimer = function() {
  // Decrement the number of seconds until the next move
  numSecondsUntilNextMove -= 1;

  // If the timer has hit zero, reset it and make a move for the current team
  if (numSecondsUntilNextMove === 0) {
    // If there is not a winner, reset the timer in Firebase and make a move for the current team
    if (!currentGame.winner) {
      makeMove();
    } else {
      // Otherwise, reset the game since it has been won
      resetCurrentGame();
    }
  }
};

/****************/
/*  GAME SETUP  */
/****************/
/* Returns a grid in which every cell is the inputted value */
getEmptyGrid = function(value) {
  return [
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
    [[value, value, value], [value, value, value], [value, value, value]],
  ];
};

/* Initializes a new game, wiping out any existing game */
resetCurrentGame = function() {
  // Initialize the current game globally
  currentGame = {
    whoseTurn: Math.random() > 0.5 ? 'github' : 'twitter',
    winner: '',
    grids: getEmptyGrid(''),
    uberGrid: [['', '', ''], ['', '', ''], ['', '', '']],
    validGridsForNextMove: '0,1,2,3,4,5,6,7,8',
    timeOfNextMove: generateTimeOfNextMove(7),
  };

  // Update Firebase with the current game
  currentGameRef.set(currentGame, function(error) {
    if (error !== null) {
      console.log('[ERROR] Failed to reset current game:', error);
    }
  });

  // Create a new game event
  eventsRef.push({
    imageUrl: './images/ticTacTicTacToeLogo.png',
    text: 'A new game has started!',
    type: 'newGame',
  }, function(error) {
    if (error !== null) {
      console.log('[ERROR] Failed to add new game event:', error);
    }
  });

  // Reset the timer
  numSecondsUntilNextMove = 7;
};
