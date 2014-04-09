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
    rootRef.child("/versus/").on("child_added", function(dataSnapshot) {
        $scope.lastVersusGame = dataSnapshot.val();
        $scope.lastVersusGame["name"] = dataSnapshot.name();
    });

    $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
        if ($scope.currentGame)
        {
            if ($scope.currentGame.player == $scope.currentGame.whoseTurn && $scope.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.gridsValidForMove.indexOf(gridIndex) != -1) {
                return "validForMove";
            }
            else if ($scope.currentGame.previousMove && $scope.currentGame.previousMove.gridIndex == gridIndex && $scope.currentGame.previousMove.rowIndex == rowIndex && $scope.currentGame.previousMove.columnIndex == columnIndex) {
                return "previousMove";
            }
        }
    };

        // TODO: add Firebase offs

    /* Joins an open versus game or creates a new one */
    $scope.joinVersusGame = function() {
        if (!$scope.currentGame) {
            if (!$scope.lastVersusGame || $scope.lastVersusGame.hasStarted) {
                // Create new game since all games are full
                var newGame = rootRef.child("/versus/").push({
                    hasStarted: false,
                    hasCompleted: false,
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
                rootRef.child("/versus/" + $scope.lastVersusGame.name).update({
                    hasStarted: true
                })

                $scope.currentGame = {
                    name: $scope.lastVersusGame.name,
                    player: "O"
                }

                $scope.message = "Other player's turn to place an O.";
            }

            // Mark the game as started
            $scope.lastVersusGame.hasStarted = true;
            $scope.currentGame.uberGrid = [
                [ "", "", "" ],
                [ "", "", "" ],
                [ "", "", "" ]
            ];
            $scope.currentGame.previousMove = null;
            $scope.currentGame.gridsValidForMove = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            $scope.currentGame.type = "versus";
            $scope.currentGame.whoseTurn = "X";


            // Create an event handler to populate the board at each move
            var gameRef = rootRef.child("/versus/" + $scope.currentGame.name + "/moves/");
            gameRef.on("child_added", function(dataSnapshot) {
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
                        $scope.message = "Other player's turn to place an " + $scope.currentGame.whoseTurn + ".";
                    }

                    // Check if the current grid was won
                    $scope.currentGame.uberGrid[move.gridIndex % 3][Math.floor(move.gridIndex / 3)] = $scope.gridWon($scope.grids[move.gridIndex]);

                    var nextMovesGrid = getNextMovesGrid(move.rowIndex, move.columnIndex);
                    if ($scope.gridWon($scope.grids[nextMovesGrid])) {
                        $scope.currentGame.gridsValidForMove = [];
                        for (var i = 0; i < 9; ++i) {
                            if ($scope.currentGame.uberGrid[i % 3][Math.floor(i / 3)] == "") {
                                $scope.currentGame.gridsValidForMove.push(i);
                            }
                        }
                    }
                    else {
                        $scope.currentGame.gridsValidForMove = [getNextMovesGrid(move.rowIndex, move.columnIndex)];
                    }

                    // Check if the uber grid was won and the game should end
                    console.log($scope.currentGame.uberGrid);
                    var uberWinner = $scope.gridWon($scope.currentGame.uberGrid);
                    console.log(uberWinner);
                    if (uberWinner) {
                        if (uberWinner == $scope.currentGame.player) {
                            $scope.message = "You won!! Congrats!";
                        }
                        else {
                            $scope.message = "You lost :( Try again!";
                        }

                        alert($scope.message);

                        gameRef.off();

                        // Reset the game
                        $scope.resetGame();
                        console.log("*******************");
                    }
                });
            });
        }
    };

    /* Joins the current MMO game */
    $scope.joinMMOGame = function() {

    };


    // Add a new move to Firebase when a valid move is made
    $scope.currentGame = null;
    $scope.addMove = function(gridIndex, rowIndex, columnIndex) {
        // Make sure the current player is in a game and it is their turn
        if ($scope.currentGame && $scope.currentGame.player == $scope.currentGame.whoseTurn) {
            // Make sure the move is valid
            var fIsMoveValid = true;
            if ($scope.grids[gridIndex][rowIndex][columnIndex] || $scope.currentGame.gridsValidForMove.indexOf(gridIndex) == -1)
            {
                fIsMoveValid = false
            }

            // Add the move to Firebase if it is valid
            if (fIsMoveValid)
            {
                rootRef.child("/versus/" + $scope.currentGame.name + "/moves/").push({
                    player: $scope.currentGame.player,
                    gridIndex: gridIndex,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex
                });
            }
        }
    };

    $scope.isGameInProgress = function() {
        return $scope.currentGame != null;
    };

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

getNextMovesGrid = function(rowIndex, columnIndex) {
    var grids = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    return grids[rowIndex % 3][columnIndex % 3];
};

// TODO: get rid of before shipping
function seedDatabase() {
    var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");
    for (var i = 0; i < 9; ++i) {
        var newGameRef = rootRef.child("versus").push({
            hasStarted: (i < 9) ? true : false,
            hasCompleted: false,
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