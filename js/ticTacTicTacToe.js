var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

app.filter('reverse', function() {
  return function(items) {
    return (items) ? items.slice().reverse() : [];
  };
});

app.controller("TicTacTicTacToeController", ["$scope", "$firebase", "$firebaseSimpleLogin", "$timeout",
    function($scope, $firebase, $firebaseSimpleLogin, $timeout) {
        // Get a reference to the root of the Firebase
        $scope.rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

        // Initialize the Firebase simple login factory
        $scope.loginObj = $firebaseSimpleLogin($scope.rootRef);
        
        /* Returns a completely empty grid */
        $scope.getEmptyGrid = function() {
            return [
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

        /* Resets state so that a new game can be started and empties the grid */
        $scope.resetGame = function() {
            $scope.currentGame = {
                grids: $scope.getEmptyGrid()
            };
        };

        // Reset things to get ready for the first game
        $timeout(function() {
            $scope.resetGame();
        });

        // Get the number of GitHub and Twitter wins
        var statsRef = $firebase($scope.rootRef).$child("stats");
        statsRef.$on("loaded", function(initialData) {
            $scope.stats = initialData;
            statsRef.$bind($scope, "stats");
            statsRef.$off();
        });

        /* Returns the CSS class the current cell should have */
        $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
            if ($scope.currentGame.hasStarted && !$scope.currentGame.winner)
            {
                if ($scope.player == $scope.currentGame.whoseTurn && $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) != -1) {
                    return "validForMove";
                }
                else if ($scope.currentGame.previousMove && $scope.currentGame.previousMove.gridIndex == gridIndex && $scope.currentGame.previousMove.rowIndex == rowIndex && $scope.currentGame.previousMove.columnIndex == columnIndex) {
                    return "previousMove";
                }
            }
        };

        /* Starts a single-player game against a computer AI */
        $scope.playCPU = function() {
            // Reset the game
            $scope.resetGame();

            // Get a reference to the vsCPU Firebase node
            var vsCPURef = $firebase($scope.rootRef.child("vsCPU"));

            // Create a new single-player game agains a computer AI
            vsCPURef.$add({
            }).then(function(newGameRef) {
                // Set the initial state of the single-player game
                $scope.currentGame = {
                    type: "vsCPU",
                    whoseTurn: "X",
                    hasStarted: true,
                    winner: "",
                    grids: $scope.getEmptyGrid(),
                    uberGrid: [
                        [ "", "", "" ],
                        [ "", "", "" ],
                        [ "", "", "" ]
                    ],
                    previousMove: false,
                    validGridsForNextMove: "0, 1, 2, 3, 4, 5, 6, 7, 8"
                };

                // Keep track of the player's marker and the message text outside of Firebase
                $scope.player = "X";
                $scope.message = "Your turn to play an X!";

                // Create a 3-way binding between the DOM, the current game object, and the newly created Firebase game node
                vsCPURef.$child(newGameRef.name()).$bind($scope, "currentGame").then(function(unbind) {
                    // Store the unbind function for when we are ready to unbind
                    $scope.unbindCurrentGame = unbind;
                });
            });
        };


        /* Starts or joins a single-player game against a random opponent */
        $scope.playRandomOpponent = function() {
            // Reset the game
            $scope.resetGame();

            // Get a reference to the vsRandomOpponent Firebase node
            var vsRandomOpponentRef = $firebase($scope.rootRef.child("vsRandomOpponent"));

            // Get the last versus random opponent game
            $scope.rootRef.child("vsRandomOpponent").limit(1).once("child_added", function(childSnapshot) {
                // Get the game data
                var gameData = childSnapshot.val();

                // If the last game has already started, createa a new one
                if (gameData.hasStarted) {
                    vsRandomOpponentRef.$add({
                    }).then(function(newGameRef) {
                        // Set the initial state of the single-player game
                        $scope.currentGame = {
                            type: "vsRandomOpponent",
                            whoseTurn: "",
                            hasStarted: false,
                            winner: "",
                            grids: $scope.getEmptyGrid(),
                            uberGrid: [
                                [ "", "", "" ],
                                [ "", "", "" ],
                                [ "", "", "" ]
                            ],
                            previousMove: false,
                            validGridsForNextMove: "0, 1, 2, 3, 4, 5, 6, 7, 8"
                        };

                        // Keep track of the player's marker and the message text outside of Firebase
                        $scope.player = "X";
                        $scope.message = "Waiting for opponent.";

                        // Create a 3-way binding between the DOM, the current game object, and the newly created Firebase game node
                        vsRandomOpponentRef.$child(newGameRef.name()).$bind($scope, "currentGame").then(function(unbind) {
                            // Store the unbind function for when we are ready to unbind
                            $scope.unbindCurrentGame = unbind;
                        });

                        // TODO: add matching $off call
                        vsRandomOpponentRef.$child(newGameRef.name() + "/whoseTurn").$on("change", function() {
                            // TODO: End game if winner is set
                            if ($scope.currentGame.winner) {
                                // TODO: end game
                            }

                            // Update the message text
                            if ($scope.currentGame.hasStarted) {
                            if ($scope.currentGame.whoseTurn == $scope.player) {
                                $scope.message = "Your turn! Play an " + $scope.currentGame.whoseTurn + ".";
                            }
                            else {
                                $scope.message = "Other player's turn to play an " + $scope.currentGame.whoseTurn + ".";
                            }
                        }
                        });
                    });
                }

                // Otherwise, join the open game
                else {
                    // Get the game data from Firebase and mark it as started
                    $scope.currentGame = gameData;
                    $scope.currentGame.hasStarted = true;
                    $scope.currentGame.whoseTurn = "X";

                    // Keep track of the player's marker and the message text outside of Firebase
                    $scope.player = "O";
                    $scope.message = "Other player's turn to play an X!";

                    // Create a 3-way binding between the DOM, the current game object, and the newly created Firebase game node
                    vsRandomOpponentRef.$child(childSnapshot.name()).$bind($scope, "currentGame").then(function(unbind) {
                        // Store the unbind function for when we are ready to unbind
                        $scope.unbindCurrentGame = unbind;
                    });

                    // TODO: add matching $off call
                    vsRandomOpponentRef.$child(childSnapshot.name() + "/whoseTurn").$on("change", function() {
                        // TODO: End game if winner is set

                        // Update the message text

                        if ($scope.currentGame.whoseTurn == $scope.player) {
                            $scope.message = "Your turn! Play an " + $scope.currentGame.whoseTurn + ".";
                        }
                        else {
                            $scope.message = "Other player's turn to play an " + $scope.currentGame.whoseTurn + ".";
                        }
                    });
                }
            });
        };

        $scope.joinGame = function(provider) {
            $scope.loginObj.$login(provider, {
                debug: true // TODO: get rid of this
            }).then(function(user) {
               console.log("Logged in as: ", user.uid);
               console.log(user);
               $scope.user = user;
            }, function(error) {
               console.error("Login failed: ", error);
            });
        };

        $scope.loginWithTwitter = function() {

        }

        /* Starts or joins an MMO game */
        $scope.playMMO = function() {
            // Reset the game
            $scope.resetGame();

            $scope.loginObj.$login("github", {
                debug: true // TODO: get rid of this
            }).then(function(user) {
               console.log("Logged in as: ", user.uid);
               console.log(user);
            }, function(error) {
               console.error("Login failed: ", error);
            });

            // Join the current MMO game
            /*var mmoGameRef = $scope.rootRef.child("/mmo/current/");
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
                        validGridsForNextMove: "0, 1, 2, 3, 4, 5, 6, 7, 8",
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
                    }

                    // Create an event handler to populate the board at each move
                    $scope.currentGame.movesRef = $scope.rootRef.child("/" + $scope.currentGame.type + "/" + $scope.currentGame.name + "/moves/");
                    $scope.currentGame.movesRef.on("child_added", $scope.handleNewMove);

                    $scope.currentGame.movesRef.parent().child("suggestions").on()

                    // Update the timer every second
                    $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);
                });
            });*/
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
            var suggestionsRef = $scope.rootRef.child("/mmo/current/suggestions");
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
                    player: $scope.player,
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
            $scope.addMove(cell.gridIndex, cell.rowIndex, cell.columnIndex);

            // TODO: decide if I want to keep a history of moves
            /*$scope.currentGameRefrootRef.$child("/moves/").add({
                player: $scope.currentGame.whoseTurn,
                gridIndex: cell.gridIndex,
                rowIndex: cell.rowIndex,
                columnIndex: cell.columnIndex
            });*/
        };

        /* Returns a random grid cell in which the next move can be made */
        $scope.getRandomValidMove = function() {
            // Get the valid grids for next move as an array
            var validGridsForNextMove = $scope.currentGame.validGridsForNextMove.split(",");

            // Randomly choose one of the valid grids to make a move in
            var numValidGridsForNextMove = validGridsForNextMove.length;
            var gridIndex = validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)];
            
            // Keep looping until we find cell coordinates for a cell which has not yet been earned
            var rowIndex = Math.floor(Math.random() * 3);
            var columnIndex = Math.floor(Math.random() * 3);
            while ($scope.currentGame.grids[gridIndex][rowIndex][columnIndex] != "") {
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

        // Add a new move to Firebase when a valid move is made
        $scope.addMove = function(gridIndex, rowIndex, columnIndex) {
            // Make sure the current player is in a game and it is their turn
            if ($scope.currentGame.hasStarted && ($scope.currentGame.type != "vsRandomOpponent" || $scope.player == $scope.currentGame.whoseTurn)) {
                // Make sure the move is valid
                if ($scope.isMoveValid(gridIndex, rowIndex, columnIndex)) {
                    // Update the correct cell in grids
                    $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] = $scope.currentGame.whoseTurn;

                    if (!$scope.currentGame.moves) {
                        $scope.currentGame.moves = [];
                    }
                    $scope.currentGame.moves.push({
                        username: ($scope.user) ? $scope.user.username : $scope.currentGame.whoseTurn,
                        imageUrl: ($scope.user) ? (($scope.user.provider == "github") ? $scope.user.avatar_url : $scope.user.profile_image_url) : "./images/user.png",
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex
                    });

                    console.log(($scope.user) ? $scope.user.avatar_url : "./images/user.png");
                    // TODO: make sure the list doesn't get too long

                    // Update whose turn it is
                    $scope.currentGame.whoseTurn = ($scope.currentGame.whoseTurn == "X") ? "O" : "X";

                    // Set the previous move
                    $scope.currentGame.previousMove = {
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex
                    };

                    // Update the message text
                    if ($scope.currentGame.whoseTurn == $scope.player) {
                        $scope.message = "Your turn! Play an " + $scope.currentGame.whoseTurn + ".";
                    }
                    else {
                        $scope.message = "Other player's turn to play an " + $scope.currentGame.whoseTurn + ".";
                    }

                    // Update the uber grid if the current grid was won
                    $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3] = $scope.getGridWinner($scope.currentGame.grids[gridIndex]);

                    // Get the grids in which the next move can be made
                    $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove(rowIndex, columnIndex);

                    // Check if the uber grid was won and the game should end
                    var uberGridWinner = $scope.getGridWinner($scope.currentGame.uberGrid);
                    if (uberGridWinner) {
                        if (uberGridWinner == $scope.player) {
                            $scope.message = "You won!! Congrats!";
                        }
                        else {
                            $scope.message = "You lost :( Try again!";
                        }

                        alert($scope.message);

                        $scope.currentGame.winner = uberGridWinner;

                        // Increment the number of teams wins
                        if (uberGridWinner == "X") {
                            $scope.stats.gitHubWins += 1;
                        }
                        else {
                            $scope.stats.twitterWins += 1;
                        }

                        // Unbind the current game from the Firebase
                        // TODO: is there a way to do this after $scope.currentGame has been updated?
                        var unbindTimeout = window.setTimeout(function() {
                            if ($scope.unbindCurrentGame) {
                                $scope.unbindCurrentGame();
                                $scope.unbindCurrentGame = null;
                            }
                            window.clearTimeout(unbindTimeout);
                        }, 2000);
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
                }
            }
        };

        /* Returns true if the cell represented by the inputs is a cell in which the next move can be validly made */
        $scope.isMoveValid = function(gridIndex, rowIndex, columnIndex) {
            return ($scope.currentGame.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) != -1);
        };

        /* Returns a comma-separated string of each grid in which the next move can validly be made */
        $scope.getValidGridsForNextMove = function(rowIndex, columnIndex) {
            // If that grid is already won, add each un-won grid to the valid grids for next move list
            if ($scope.currentGame.uberGrid[rowIndex][columnIndex]) {
                validGridsForNextMove = [];
                for (var i = 0; i < 3; ++i) {
                    for (var j = 0; j < 3; ++j) {
                        if ($scope.currentGame.uberGrid[i][j] == "") {
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
        }

        /* Returns the winner of the inputted grid or "" if no one has won the grid yet */
        $scope.getGridWinner = function(grid) {
            // Set the grid as not won
            var gridWinner = "";

            // Check for a win across the rows
            for (var i = 0; i < 3; ++i) {
                if (grid[i][0] != "" && grid[i][0] == grid[i][1] && grid[i][1] == grid[i][2])
                {
                    gridWinner = grid[i][0];
                }
            }

            if (!gridWinner) {
                // Check for a win down the columns
                for (var i = 0; i < 3; ++i) {
                    if (grid[0][i] != "" && grid[0][i] == grid[1][i] && grid[1][i] == grid[2][i])
                    {
                        gridWinner = grid[0][i];
                    }
                }

                if (!gridWinner) {
                    // Check for a win on the diagnoals
                    if (grid[0][0] != "" && grid[0][0] == grid[1][1] && grid [1][1] == grid [2][2]) {
                        gridWinner = grid[0][0];
                    }
                    else if (grid[0][2] != "" && grid[0][2] == grid[1][1] && grid [1][1] == grid [2][0]) {
                        gridWinner = grid[0][2];
                    }

                    if (!gridWinner) {
                        // If the grid is full, the player with the most cells wins
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

            // Return the winner of the grid or "" if no one has won the grid yet
            return gridWinner;
        };
    }
]);