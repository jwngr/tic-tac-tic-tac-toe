var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

function TicTacTicTacToeController($scope, $firebase, $timeout) {
    // Get a reference to the root of the Firebase
    var rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

    // TODO: remove before shipping
    seedDatabase();
    
    // Create a representation of an empty board
    $scope.board = [
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ],
        [ "", "", "", "", "", "", "", "", "" ]
    ];

    // Keep track of the last versus game in case the current player wants to join
    $scope.lastVersusGame = null;
    rootRef.child("/versus/").on("child_added", function(dataSnapshot) {
        $scope.lastVersusGame = dataSnapshot.val();
        $scope.lastVersusGame["name"] = dataSnapshot.name();
    });

    $scope.gridWins = [
        [ "", "", "" ],
        [ "", "", "" ],
        [ "", "", "" ]
    ];
    $scope.gridsValidForMove = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    $scope.getValidForMoveClass = function(row, column) {
        var grid = getGrid(row, column);
        if ($scope.board[row][column] == "" && $scope.gridsValidForMove.indexOf(grid) != -1) {
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
                    $scope.board[move.row][move.column] = move.player;

                    // Update whose turn it is
                    $scope.currentGame.whoseTurn = (move.player == "X") ? "O" : "X";

                    // Update the message text
                    if ($scope.currentGame.whoseTurn == $scope.currentGame.player) {
                        $scope.currentGame.message = "Your turn!";
                    }
                    else {
                        $scope.currentGame.message = "Other player's turn";
                    }

                    // TODO: update UI with big X or O if grid won
                    console.log("Grid won? " + gridWon(getGrid(move.row, move.column), $scope.board));



                    var nextMovesGrid = getNextMovesGrid(move.row, move.column);
                    console.log("Next grid: " + nextMovesGrid);
                    if (gridWon(nextMovesGrid, $scope.board)) {
                        console.log("woot");
                        $scope.gridsValidForMove = [];
                        for (var gridIndex = 0; gridIndex < 9; ++gridIndex) {
                            if (!gridWon(gridIndex, $scope.board)) {
                                $scope.gridsValidForMove.push(gridIndex);
                            }
                        }
                    }
                    else {
                        $scope.gridsValidForMove = [getNextMovesGrid(move.row, move.column)];
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
    $scope.addMove = function(row, column) {
        // Make sure the current player is in a game and it is their turn
        if ($scope.currentGame && $scope.currentGame.player == $scope.currentGame.whoseTurn) {
            // Make sure the move is valid
            var fIsMoveValid = true;
            if ($scope.board[row][column] != "" || $scope.gridsValidForMove.indexOf(getGrid(row, column)) == -1)
            {
                fIsMoveValid = false
                console.log("invalid")
            }

            // Add the move to Firebase if it is valid
            if (fIsMoveValid)
            {
                rootRef.child("/versus/" + $scope.currentGame.name + "/moves/").push({
                    player: $scope.currentGame.player,
                    row: row,
                    column: column
                });
            }
        }
    }
};

getGrid = function(row, column) {
    var grids = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    return grids[Math.floor(row / 3)][Math.floor(column / 3)];
}

getNextMovesGrid = function(row, column) {
    var grids = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
    ];

    return grids[row % 3][column % 3];
};


gridWon = function(gridIndex, board) {
    var rowStartIndex = 3 * (gridIndex % 3);
    var columnStartIndex = 3 * (Math.floor(gridIndex / 3));

    console.log(rowStartIndex + ", " + columnStartIndex);
    
    var grid = [
        [ board[rowStartIndex][columnStartIndex], board[rowStartIndex][columnStartIndex + 1], board[rowStartIndex][columnStartIndex + 2] ],
        [ board[rowStartIndex + 1][columnStartIndex], board[rowStartIndex + 1][columnStartIndex + 1], board[rowStartIndex + 1][columnStartIndex + 2] ],
        [ board[rowStartIndex + 2][columnStartIndex], board[rowStartIndex + 2][columnStartIndex + 1], board[rowStartIndex + 2][columnStartIndex + 2] ]
    ];

    console.log(grid);

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
}

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
                row: 4,
                column: 4
            });
            movesRef.push({
                player: "O",
                row: 5,
                column: 5
            });
            movesRef.push({
                player: "X",
                row: 7,
                column: 8
            });
        }
    }
}

/*
var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"])
    .factory("ticTacTicTacToeService", ["$firebase", function($firebase) {
        var ref = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/versus/game0/");
        return $firebase(ref);
    }])
    .controller("TicTacTicTacToeController", ["$scope", "ticTacTicTacToeService",
        function($scope, service) {
            $scope.moves = service;
            $scope.board = [
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ],
                [ "", "", "", "", "", "", "", "", "" ]
            ];
            console.log($scope.moves);
            console.log($scope.moves.get(0));
            console.log($scope.moves.value());
            $scope.moves.forEach(function(move) {
                alert(move);
            });
            $scope.addMove = function() {
                $scope.moves.$add({
                    player: "X",
                    row: 4,
                    column: 4
                });
            };
        }
    ]
);
*/