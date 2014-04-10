var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

function TicTacTicTacToeController($scope, $firebase, $timeout) {
    // Get a reference to the root of the Firebase
    var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

    // TODO: remove before shipping
    //seedDatabase();
    
    /* Resets state so that a new game can be started. */
    $scope.resetGame = function() {
        // Clear any previous game
        $scope.currentGame = null;

        // Initialize the grids
        $scope.grids = [
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ],
            [ [ "", "", ""], ["", "", ""], ["", "", ""] ]
        ];
    };

    // Reset things to get ready for a new game
    $scope.resetGame();

    // Keep track of the last versus game in case the current player wants to join
    $scope.lastVersusGame = null;
    rootRef.child("/vsRandomOpponent/").on("child_added", function(dataSnapshot) {
        $scope.lastVersusGame = dataSnapshot.val();
        $scope.lastVersusGame["name"] = dataSnapshot.name();
    });
    // TODO: add Firebase off

    $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
        if ($scope.currentGame)
        {
            if ($scope.currentGame.player == $scope.currentGame.whoseTurn && $scope.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) != -1) {
                return "validForMove";
            }
            else if ($scope.currentGame.previousMove && $scope.currentGame.previousMove.gridIndex == gridIndex && $scope.currentGame.previousMove.rowIndex == rowIndex && $scope.currentGame.previousMove.columnIndex == columnIndex) {
                return "previousMove";
            }
        }
    };

    /* Joins an open versus game or creates a new one */
    $scope.joinVersusGame = function() {
        if (!$scope.lastVersusGame || $scope.lastVersusGame.hasStarted) {
            // Create a new game in Firebase since all games are full
            var newGame = rootRef.child("/vsRandomOpponent/").push({
                hasStarted: false,
                winner: "",
                moves: false
            });

            $scope.currentGame = {
                name: newGame.name(),
                player: "X"
            }

            $scope.message = "Your turn! Play an X.";
        }
        else {
            // Join the open game
            rootRef.child("/vsRandomOpponent/" + $scope.lastVersusGame.name).update({
                hasStarted: true
            })

            $scope.currentGame = {
                name: $scope.lastVersusGame.name,
                player: "O"
            }

            $scope.message = "Other player's turn to play an O.";
        }

        // Mark the game as started
        $scope.lastVersusGame.hasStarted = true;
        $scope.currentGame.uberGrid = [
            [ "", "", "" ],
            [ "", "", "" ],
            [ "", "", "" ]
        ];
        $scope.currentGame.previousMove = null;
        $scope.currentGame.validGridsForNextMove = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        $scope.currentGame.type = "vsRandomOpponent";
        $scope.currentGame.whoseTurn = "X";


        // Create an event handler to populate the board at each move
        $scope.currentGame.movesRef = rootRef.child("/" + $scope.currentGame.type + "/" + $scope.currentGame.name + "/moves/");
        $scope.currentGame.movesRef.on("child_added", $scope.handleNewMove);
    };

    /* Start a game against a computer AI */
    $scope.startCPUGame = function() {
        // Create a new game in Firebase
        var newGame = rootRef.child("/vsCPU/").push({
            hasStarted: true,
            winner: false,
            moves: false
        });

        $scope.currentGame = {
            name: newGame.name(),
            player: "X",
            uberGrid: [
                [ "", "", "" ],
                [ "", "", "" ],
                [ "", "", "" ]
            ],
            validGridsForNextMove: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            type: "vsCPU",
            whoseTurn: "X"
        }

        $scope.message = "Your turn! Play an X.";

        // Create an event handler to populate the board at each move
        $scope.currentGame.movesRef = rootRef.child("/" + $scope.currentGame.type + "/" + $scope.currentGame.name + "/moves/");
        $scope.currentGame.movesRef.on("child_added", $scope.handleNewMove);
    };

    /* Joins the current MMO game against the computer */
    $scope.joinMMOGame = function() {
        // Join the current MMO game
        var mmoGameRef = rootRef.child("/mmo/current/");
        mmoGameRef.once("value", function(dataSnapshot) {
            $timeout(function() {
                // Get the game data
                var gameData = dataSnapshot.val();

                $scope.currentGame = {
                    type: "mmo",
                    name: "current",
                    player: "X",
                    uberGrid: [
                        [ "", "", "" ],
                        [ "", "", "" ],
                        [ "", "", "" ]
                    ],
                    previousMove: null,
                    validGridsForNextMove: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    whoseTurn: "X",
                    secondsLeftForHumansMove: 7
                }

                $scope.message = "7 seconds left to choose a location for X.";

                if (!gameData.hasStarted) {
                    // If no current MMO game exists, start a new one
                    mmoGameRef.update({
                        hasStarted: true,
                        moves: false,
                        suggestions: false,
                        winner: ""
                    });

                    $scope.currentGame.isHost = true;

                    // Start the timer for the humans' current guess
                    $scope.mmoMoveTimeout = window.setTimeout($scope.makeMMOMove, 7000);
                }
                else {
                    // Otherwise, join the current MMO game
                    dataSnapshot.child("moves").forEach(function(movesSnapshot) {
                        var move = movesSnapshot.val();
                        $scope.grids[move.gridIndex][move.rowIndex][move.columnIndex] = move.player;
                        $scope.currentGame.previousMove = move;
                    });

                    $scope.currentGame.whoseTurn = ($scope.currentGame.previousMove.player == "X") ? "O" : "X";
                    console.assert($scope.currentGame.whoseTurn == "X", "It should never be the computer's turn here.");

                    $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove($scope.currentGame.previousMove.rowIndex, $scope.currentGame.previousMove.columnIndex);

                    $scope.currentGame.secondsLeftForHumansMove = gameData.secondsLeftForHumansMove;
                    console.log($scope.currentGame.secondsLeftForHumansMove);
                }

                // Create an event handler to populate the board at each move
                $scope.currentGame.movesRef = rootRef.child("/" + $scope.currentGame.type + "/" + $scope.currentGame.name + "/moves/");
                $scope.currentGame.movesRef.on("child_added", $scope.handleNewMove);

                // Update the timer every second
                $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);
            });
        });
    };

    $scope.updateTimer = function() {
        // Decrement the timer
        $scope.currentGame.secondsLeftForHumansMove -= 1;

        // Update the message text
        $timeout(function() {
            if ($scope.currentGame.secondsLeftForHumansMove == 1) {
                $scope.message = "1 second left to choose a location for X.";
            }
            else {
                $scope.message = $scope.currentGame.secondsLeftForHumansMove + " seconds left to choose a location for X.";
            }
        });

        // If time is up, reset the timer
        if ($scope.currentGame.secondsLeftForHumansMove == 0) {
            window.clearInterval($scope.updateTimerInterval);
            $scope.currentGame.secondsLeftForHumansMove = 7;
        }

        // If the current player is the host, update Firebase
        if ($scope.currentGame.isHost) {
            $scope.currentGame.movesRef.parent().update({
                secondsLeftForHumansMove: $scope.currentGame.secondsLeftForHumansMove
            });
        }
    };

    $scope.makeMMOMove = function() {
        var suggestionsRef = rootRef.child("/mmo/current/suggestions");
        suggestionsRef.once("value", function(dataSnapshot) {
            var suggestions = [
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ],
                [ [ 0, 0, 0], [0, 0, 0], [0, 0, 0] ]
            ];

            var numSuggestions = 0;
            dataSnapshot.forEach(function(childSnapshot) {
                var suggestion = childSnapshot.val();
                suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;
                ++numSuggestions;
            });

            // If there have been no suggestions, choose a random grid location
            var maxNumSuggestions = 0;
            var maxSuggestedGridIndex;
            var maxSuggestedRowIndex;
            var maxSuggestedColumnIndex;
            if (numSuggestions == 0) {
                // If there were no human suggestions, just select a random valid cell
                var move = $scope.getRandomValidMove();
                maxSuggestedGridIndex = move.gridIndex;
                maxSuggestedRowIndex = move.rowIndex;
                maxSuggestedColumnIndex = move.columnIndex;
            }
            else {
                // Otherwise, pick the most suggested cell
                for (var gridIndex = 0; gridIndex < 8; ++gridIndex) {
                    for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
                        for (var columnIndex = 0; columnIndex < 3; ++columnIndex) {
                            var numTimesSuggested = suggestions[gridIndex][rowIndex][columnIndex];
                            if (numTimesSuggested > maxNumSuggestions || (numTimesSuggested == maxNumSuggestions && Math.random() > 0.5)) {
                                maxNumSuggestions = numTimesSuggested;
                                maxSuggestedGridIndex = gridIndex;
                                maxSuggestedRowIndex = rowIndex;
                                maxSuggestedColumnIndex = columnIndex;
                            }
                        }
                    }
                }
            }

            $scope.currentGame.movesRef.push({
                player: $scope.currentGame.player,
                gridIndex: maxSuggestedGridIndex,
                rowIndex: maxSuggestedRowIndex,
                columnIndex: maxSuggestedColumnIndex,
                suggestions: dataSnapshot.val()
            });

            window.clearTimeout($scope.mmoMoveTimeout);
        });
    };

    $scope.makeAIMove = function() {
        var cell = $scope.getRandomValidMove();

        rootRef.child("/" + $scope.currentGame.type + "/" + $scope.currentGame.name + "/moves/").push({
            player: $scope.currentGame.whoseTurn,
            gridIndex: cell.gridIndex,
            rowIndex: cell.rowIndex,
            columnIndex: cell.columnIndex
        });
    };

    $scope.getRandomValidMove = function() {
        var numValidGridsForNextMove = $scope.currentGame.validGridsForNextMove.length;
        var gridIndex = $scope.currentGame.validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)];
        var rowIndex = Math.floor(Math.random() * 3);
        var columnIndex = Math.floor(Math.random() * 3);

        while ($scope.grids[gridIndex][rowIndex][columnIndex] != "") {
            rowIndex = Math.floor(Math.random() * 3);
            columnIndex = Math.floor(Math.random() * 3);
        }

        return {
            gridIndex: gridIndex,
            rowIndex: rowIndex,
            columnIndex: columnIndex
        }
    };

    // Add a new move to Firebase when a valid move is made
    $scope.currentGame = null;
    $scope.addMove = function(gridIndex, rowIndex, columnIndex) {
        // Make sure the current player is in a game and it is their turn
        if ($scope.currentGame && $scope.currentGame.player == $scope.currentGame.whoseTurn) {
            // Make sure the move is valid
            var fIsMoveValid = true;
            if ($scope.grids[gridIndex][rowIndex][columnIndex] || $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) == -1)
            {
                fIsMoveValid = false
            }

            // Add the move to Firebase if it is valid
            if (fIsMoveValid)
            {
                if ($scope.currentGame.type == "mmo") {
                    // If this is an MMO game, add the current choice as a move suggestion
                    $scope.currentGame.movesRef.parent().child("suggestions").push({
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex
                    });
                }
                else {
                    // Otherwise, just submit the move to the moves node
                    $scope.currentGame.movesRef.push({
                        player: $scope.currentGame.player,
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex
                    });
                }
            }
        }
    };

    $scope.handleNewMove = function(dataSnapshot) {
        $timeout(function() {
            // Update the board
            var move = dataSnapshot.val();
            $scope.grids[move.gridIndex][move.rowIndex][move.columnIndex] = move.player;

            // Update whose turn it is
            $scope.currentGame.whoseTurn = (move.player == "X") ? "O" : "X";

            // Set the previous move
            $scope.currentGame.previousMove = {
                gridIndex: move.gridIndex,
                rowIndex: move.rowIndex,
                columnIndex: move.columnIndex
            };

            // Update the message text
            if ($scope.currentGame.whoseTurn == $scope.currentGame.player) {
                $scope.message = "Your turn! Play an " + $scope.currentGame.player + ".";
            }
            else {
                $scope.message = "Other player's turn to play an " + $scope.currentGame.whoseTurn + ".";
            }

            // Check if the current grid was won
            $scope.currentGame.uberGrid[move.gridIndex % 3][Math.floor(move.gridIndex / 3)] = $scope.gridWon($scope.grids[move.gridIndex]);

            // Get the grids in which the next move can be made
            $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove(move.rowIndex, move.columnIndex);

            // Check if the uber grid was won and the game should end
            var uberGridWinner = $scope.gridWon($scope.currentGame.uberGrid);
            if (uberGridWinner) {
                if (uberGridWinner == $scope.currentGame.player) {
                    $scope.message = "You won!! Congrats!";
                }
                else {
                    $scope.message = "You lost :( Try again!";
                }

                alert($scope.message);

                $scope.currentGame.movesRef.parent().update({
                    winner: uberGridWinner
                });

                $scope.currentGame.movesRef.off();

                // Reset the game
                $scope.resetGame();
            }
            // Otherwise, play the AI's move if it is it's turn
            else if ($scope.currentGame.type == "vsCPU" && $scope.currentGame.whoseTurn == "O") {
                // Let the AI make a move
                $scope.makeAIMove();
            }
            else if ($scope.currentGame.type == "mmo" && $scope.currentGame.whoseTurn == "O") {
                if ($scope.currentGame.isHost) {  
                    // Let the AI make a move
                    $scope.makeAIMove();

                    // Start the timer for the humans ' current guess
                    $scope.mmoMoveTimeout = window.setTimeout($scope.makeMMOMove, 7000);

                    $scope.currentGame.movesRef.parent().update({
                        suggestions: false
                    })
                }

                // Update the message text
                $scope.message = "7 seconds left to choose a location for X."

                // Set an interval to update the timer
                $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);
            }
        });
    };

    $scope.isGameInProgress = function() {
        return $scope.currentGame != null;
    };

    $scope.getValidGridsForNextMove = function(rowIndex, columnIndex) {
        // If that grid is already won, add each un-won grid to the valid grids for next move list
        if ($scope.currentGame.uberGrid[rowIndex][columnIndex]) {
            validGridsForNextMove = [];
            for (var i = 0; i < 9; ++i) {
                if ($scope.currentGame.uberGrid[i % 3][Math.floor(i / 3)] == "") {
                    validGridsForNextMove.push(i);
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
            validGridsForNextMove = [grids[rowIndex % 3][columnIndex % 3]];
        }

        return validGridsForNextMove;
    }

    $scope.gridWon = function(grid) {
        var gridWinner = "";

        // Check for a win across rows
        for (var i = 0; i < 3; ++i) {
            if (grid[i][0] != "" && grid[i][0] == grid[i][1] && grid[i][1] == grid[i][2])
            {
                gridWinner = grid[i][0];
            }
        }

        if (!gridWinner) {
            // Check for a win across columns
            for (var i = 0; i < 3; ++i) {
                if (grid[0][i] != "" && grid[0][i] == grid[1][i] && grid[1][i] == grid[2][i])
                {
                    gridWinner = grid[0][i];
                }
            }

            if (!gridWinner) {
                // Check for a win across diagnoals
                if (grid[0][0] != "" && grid[0][0] == grid[1][1] && grid [1][1] == grid [2][2]) {
                    gridWinner = grid[0][0];
                }
                if (grid[0][2] != "" && grid[0][2] == grid[1][1] && grid [1][1] == grid [2][0]) {
                    gridWinner = grid[0][2];
                }

                if (!gridWinner) {
                    // Check for a full grid winner; if the grid is full, the player with the most cells wins the grid
                    var numXCells = 0;
                    var numOCells = 0;
                    for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
                        for (var columnIndex = 0; columnIndex < 3; ++ columnIndex) {
                            if (grid[rowIndex][columnIndex] == "X") {
                                numXCells += 1;
                            }
                            else if (grid[rowIndex][columnIndex] == "O") {
                                numOCells += 1;
                            }
                        }
                    }

                    if (numXCells == 5) {
                        gridWinner = "X";
                    }
                    else if (numOCells == 5) {
                        gridWinner = "O";
                    }
                }
            }
        }
        return gridWinner;
    };
};

// TODO: get rid of before shipping
function seedDatabase() {
    var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");
    for (var i = 0; i < 9; ++i) {
        var newGameRef = rootRef.child("versus").push({
            hasStarted: (i < 9) ? true : false,
            winner: "",
            moves: false
        });

        if (i < 9) {
            var movesRef = newGameRef.child("moves");
            movesRef.push({
                player: "X",
                gridIndex: 4,
                rowIndex: 1,
                columnIndex: 1
            });
            movesRef.push({
                player: "O",
                gridIndex: 4,
                rowIndex: 2,
                columnIndex: 2
            });
            movesRef.push({
                player: "X",
                gridIndex: 8,
                rowIndex: 0,
                columnIndex: 2
            });
        }
    }
};