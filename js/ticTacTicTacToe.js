var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

function TicTacTicTacToeController($scope, $firebase, $timeout) {
    // Get a reference to the root of the Firebase
    var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

    // TODO: remove before shipping
    seedDatabase();
    
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

    // Keep track of the last versus game in case the current player wants to join
    $scope.lastVersusGame = null;
    rootRef.child("/versus/").on("child_added", function(dataSnapshot) {
        $scope.lastVersusGame = dataSnapshot.val();
        $scope.lastVersusGame["name"] = dataSnapshot.name();
    });

    $scope.uberGrid = [
        [ "", "", "" ],
        [ "", "", "" ],
        [ "", "", "" ]
    ];
    $scope.gridsValidForMove = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    $scope.getValidForMoveClass = function(gridIndex, rowIndex, columnIndex) {
        if ($scope.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.gridsValidForMove.indexOf(gridIndex) != -1) {
            return "validForMove";
        }
    };

        // TODO: add Firebase offs

    /* Joins an open versus game or creates a new one */
    $scope.joinVersusGame = function() {
        if (!$scope.currentGame) {
            if ($scope.lastVersusGame.hasStarted) {
                // Create new game since all games are full
                var newGame = rootRef.child("/versus/").push({
                    hasStarted: false,
                    hasCompleted: false,
                    moves: false
                });

                $scope.currentGame = {
                    name: newGame.name(),
                    player: "X",
                    message: "Your turn!"
                }
            }
            else {
                // Join the open game
                rootRef.child("/versus/" + $scope.lastVersusGame.name).update({
                    hasStarted: true
                })
                $scope.lastVersusGame.hasStarted = true;

                $scope.currentGame = {
                    name: $scope.lastVersusGame.name,
                    player: "O",
                    message: "Other player's turn"
                }
            }

            $scope.currentGame["type"] = "versus";
            $scope.currentGame["whoseTurn"] = "X";


            // Create an event handler to populate the board at each move
            var gameRef = rootRef.child("/versus/" + $scope.currentGame.name + "/moves/");
            gameRef.on("child_added", function(dataSnapshot) {
                $timeout(function() {
                    // Update the board
                    var move = dataSnapshot.val();
                    $scope.grids[move.gridIndex][move.rowIndex][move.columnIndex] = move.player;

                    // Update whose turn it is
                    $scope.currentGame.whoseTurn = (move.player == "X") ? "O" : "X";

                    // Update the message text
                    if ($scope.currentGame.whoseTurn == $scope.currentGame.player) {
                        $scope.currentGame.message = "Your turn!";
                    }
                    else {
                        $scope.currentGame.message = "Other player's turn";
                    }

                    // Check if the current grid was won
                    $scope.uberGrid[move.gridIndex % 3][Math.floor(move.gridIndex / 3)] = $scope.gridWon($scope.grids[move.gridIndex]);

                    // Check if the uber grid was won
                    if ($scope.gridWon($scope.uberGrid)) {
                        alert($scope.gridWon($scope.uberGrid) + " WINS!!!");
                        // TODO: end the game
                    }

                    var nextMovesGrid = getNextMovesGrid(move.rowIndex, move.columnIndex);
                    if ($scope.gridWon($scope.grids[nextMovesGrid])) {
                        $scope.gridsValidForMove = [];
                        for (var i = 0; i < 9; ++i) {
                            if ($scope.uberGrid[i % 3][Math.floor(i / 3)]) {
                                $scope.gridsValidForMove.push(i);
                            }
                        }
                    }
                    else {
                        $scope.gridsValidForMove = [getNextMovesGrid(move.rowIndex, move.columnIndex)];
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
            if ($scope.grids[gridIndex][rowIndex][columnIndex] || $scope.gridsValidForMove.indexOf(gridIndex) == -1)
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
                                numXCells = 0;
                            }
                            else if (grid[rowIndex][columnIndex] == "O") {
                                numOCells = 0;
                            }
                        }
                    }
                    if (numXCells + numOCells == 9) {
                        if (numXCells > numOCells) {
                            gridWinner = "X";
                        }
                        else {
                            gridWinner = "O";
                        }
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