(function () {
  "use strict";

var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

/* Returns a list of items in reverse order */
app.filter("reverse", function() {
    /* Converts a Firebase list to a JS array */
    function toArray(list) {
        var k, out = [];
        if (list) {
            if (angular.isArray(list)) {
                out = list;
            }
            else if (typeof(list) === "object") {
                for (k in list) {
                    if (list.hasOwnProperty(k)) {
                        out.push(list[k]);
                    }
                }
            }
        }
        return out;
    }

    return function(items) {
        return toArray(items).slice().reverse();
    };
});

/* Returns the empty string if the input is 0; otherwise, returns the input */
app.filter("replaceZeroWithEmptyString", function() {
    return function(value) {
        return value > 0 ? value : "";
    };
});

app.controller("TicTacTicTacToeController", ["$scope", "$firebase", "$firebaseSimpleLogin", "$timeout",
    function($scope, $firebase, $firebaseSimpleLogin, $timeout) {
        // Get a reference to the root of the Firebase
        $scope.rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

        // Initialize the Firebase simple login factory
        $scope.loginObj = $firebaseSimpleLogin($scope.rootRef);


        /***************/
        /*  STATS HUB  */
        /***************/
        // TODO: I don't need to use .bind() here; just use return value of $firebase(ref)
        // Create a 3-way binding to the play by play events, limiting how many we keep at a time
        $firebase($scope.rootRef.child("events").limit(100)).$bind($scope, "events").then();

        // Create a 3-way binding with the scoreboard wins
        $firebase($scope.rootRef.child("wins")).$bind($scope, "wins");

        // Keep track of the number of GitHub users
        $scope.numGitHubUsers = 0;
        var gitHubUsersRef = $firebase($scope.rootRef.child("loggedInUsers/github"));
        gitHubUsersRef.$on("child_added", function() {
            $scope.numGitHubUsers += 1;
        });
        gitHubUsersRef.$on("child_removed", function() {
            $scope.numGitHubUsers -= 1;
        });

        // Keep track of the number of Twitter users
        $scope.numTwitterUsers = 0;
        var twitterUsersRef = $firebase($scope.rootRef.child("loggedInUsers/twitter"));
        twitterUsersRef.$on("child_added", function() {
            $scope.numTwitterUsers += 1;
        });
        twitterUsersRef.$on("child_removed", function() {
            $scope.numTwitterUsers -= 1;
        });


        /****************/
        /*  GAME SETUP  */
        /****************/
        /* Returns a grid in which every cell is the inputted value */
        $scope.getEmptyGrid = function(value) {
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

        /* Sets up the current game (making a new one if needed) */
        $scope.setupGame = function(loggedInUser) {
            // Store the logged-in user locally
            $scope.loggedInUser = loggedInUser;

            // Keep track of when the logged-in user in connected or disconnected from Firebase
            $scope.rootRef.child(".info/connected").on("value", function(dataSnapshot) {
                if (dataSnapshot.val() === true) {
                    // Remove the user from the logged-in users list when they get disconnected
                    var loggedInUsersRef = $scope.rootRef.child("loggedInUsers/" + $scope.loggedInUser.provider + "/" + $scope.loggedInUser.uid);
                    loggedInUsersRef.onDisconnect().remove();

                    // Add the user to the logged-in users list when they get connected
                    $firebase(loggedInUsersRef).$set(true);
                }
            });

            // Update the game message text
            $scope.setGameMessage();
        };

        // Keep track of the move suggestions
        $scope.suggestions = $scope.getEmptyGrid(0);
        $scope.rootRef.child("suggestions").on("child_added", function(childSnapshot) {
            var suggestion = childSnapshot.val();

            // Add the user's first suggestion to the suggestions grid
            $scope.suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;
        });
        $scope.rootRef.child("suggestions/").on("child_changed", function(childSnapshot) {
            var suggestion = childSnapshot.val();

            // Remove the user's previous suggestion from the suggestions grid
            $scope.suggestions[suggestion.previousSuggestion.gridIndex][suggestion.previousSuggestion.rowIndex][suggestion.previousSuggestion.columnIndex] -= 1;

            // Add the user's current suggestion to the suggestions grid
            $scope.suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;
        });
        $scope.rootRef.child("suggestions").on("child_removed", function(childSnapshot) {
            var suggestion = childSnapshot.val();

            // Remove the user's suggestion from the suggestions grid
            $scope.suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] -= 1;

            // Reset the logged-in user's current suggestion
            if ($scope.loggedInUser) {
                $scope.loggedInUser.currentSuggestion = null;
            }
        });


        /********************/
        /*  LOGIN / LOGOUT  */
        /********************/
        // Get the time offset between this client and the Firebase server and set the local timer
        $firebase($scope.rootRef.child(".info/serverTimeOffset")).$bind($scope, "serverTimeOffset").then(function() {
            // Create a 3-way binding with the current game
            $firebase($scope.rootRef.child("currentGame")).$bind($scope, "currentGame").then(function() {
                // If the current user is logged in, setup the current game
                $scope.loginObj.$getCurrentUser().then(function(loggedInUser) {
                    if (loggedInUser) {
                        $scope.setupGame(loggedInUser);
                    }
                });
            });
        });

        /* Logs the current user in and joins the current game */
        $scope.joinGame = function(provider) {
            $scope.loginObj.$login(provider).then(function(loggedInUser) {
                $scope.setupGame(loggedInUser);
            }, function(error) {
               console.error("Login failed: ", error);
            });
        };

        /* Logs the logged-in user out */
        $scope.logoutUser = function() {
            // Remove the user from their team's logged-in users node
            $scope.rootRef.child("loggedInUsers/" + $scope.loggedInUser.provider + "/" + $scope.loggedInUser.uid).remove(function() {
                // Log the user out of Firebase
                $scope.loginObj.$logout();

                // Clear the local logged-in user, the game message, and the move suggestions
                $scope.loggedInUser = null;
                $scope.gameMessage = null;

                // Turn off any Firebase event listeners
                $scope.rootRef.child(".info/connected").off();
            });
        };


        /***********************/
        /*  UPDATE GAME STATE  */
        /***********************/
        /* Adds a suggestion from the logged-in users for his team's move */
        $scope.suggestMove = function(gridIndex, rowIndex, columnIndex) {
            // Make sure a game has started, the logged-in user's team is up, and the move is valid
            if ($scope.currentGame && $scope.loggedInUser && $scope.loggedInUser.provider === $scope.currentGame.whoseTurn && $scope.isMoveValid(gridIndex, rowIndex, columnIndex)) {
                // Ignore the suggesetion if it hasn't changed
                if (!$scope.loggedInUser.currentSuggestion || $scope.loggedInUser.currentSuggestion.gridIndex !== gridIndex || $scope.loggedInUser.currentSuggestion.rowIndex !== rowIndex || $scope.loggedInUser.currentSuggestion.columnIndex !== columnIndex) {
                    // Get the username, image URL, and user URL of the logged-in user
                    var username = $scope.loggedInUser.username;
                    var imageUrl = ($scope.loggedInUser.provider === "github") ? $scope.loggedInUser.avatar_url : $scope.loggedInUser.profile_image_url_https;
                    var userUrl = ($scope.loggedInUser.provider === "github") ?  "https://github.com/" + username : "https://twitter.com/" + username;

                    // Create an event for the logged-in user's suggestion
                    $scope.events.$add({
                        imageUrl: imageUrl,
                        userUrl: userUrl,
                        text: " chose [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                        username: username,
                        uid: $scope.loggedInUser.uid,
                        type: "suggestion"
                    });

                    // Add the suggestion to the move suggestions
                    $scope.rootRef.child("suggestions/" + $scope.loggedInUser.uid).set({
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex,
                        previousSuggestion: $scope.loggedInUser.currentSuggestion ? $scope.loggedInUser.currentSuggestion : false
                    });

                    // Save the logged-in users's current suggestion
                    $scope.loggedInUser.currentSuggestion = {
                        gridIndex: gridIndex,
                        rowIndex: rowIndex,
                        columnIndex: columnIndex
                    };
                }
            }
        };

        /* Set the text of the game message */
        $scope.setGameMessage = function(currentGame) {
            // If a game is not complete, set the message telling whose turn it is
            currentGame = currentGame || $scope.currentGame;
            if (!currentGame.winner) {
                // Get the team whose turn it is and the logged-in user's team
                var whoseTurnTeam = (currentGame.whoseTurn === "github") ? "GitHub" : "Twitter";
                var loggedInUsersTeam = ($scope.loggedInUser.provider === "github") ? "GitHub" : "Twitter";

                // If it is the logged-in user's team's turn, tell them how much time is left to make it
                if (whoseTurnTeam === loggedInUsersTeam) {
                    $scope.gameMessage = "Suggest a move for Team " + whoseTurnTeam + "!";
                }
                // Otherwise, just say that they are waiting for the other team to move
                else {
                    $scope.gameMessage = "Waiting for Team " + whoseTurnTeam + " to make a move.";
                }
            }

            // Otherwise, set the message telling who won the previous game and how long it is until the next game
            else {
                var winningTeam = (currentGame.winner === "github") ? "GitHub" : "Twitter";
                $scope.gameMessage = "Team " + winningTeam + " wins! A new game will start soon.";
            }
        };

        /***********/
        /*  TIMER  */
        /***********/
        /* Resets the timer every time the time for the next move is updated */
        $scope.rootRef.child("currentGame").on("value", function(dataSnapshot) {
            // Get the time of the next move
            var currentGame = dataSnapshot.val();

            // Clear the current update timer interval
            clearInterval($scope.updateTimerInterval);

            // Update the number of seconds until the next move
            $scope.numSecondsUntilNextMove = Math.ceil((currentGame.timeOfNextMove - $scope.serverTimeOffset - new Date().getTime()) / 1000);
            if ($scope.numSecondsUntilNextMove <= 0) {
                $scope.numSecondsUntilNextMove = 7;
            }

            // Update the timer every second
            $scope.updateTimerInterval = setInterval($scope.updateTimer, 1000);

            // Set the game message if the user is logged in
            if ($scope.loggedInUser) {
                $scope.setGameMessage(currentGame);
            }
        });

        /* Updates the timer and the game message text */
        $scope.updateTimer = function() {
            $timeout(function() {
                // Decrement the number of seconds until the next move
                if ($scope.numSecondsUntilNextMove > 0) {
                    $scope.numSecondsUntilNextMove -= 1;
                }

                // If the timer has hit zero, reset it and make a move for the current team
                if ($scope.numSecondsUntilNextMove === 0)
                {
                    // Clear the current update timer interval
                    clearInterval($scope.updateTimerInterval);
                }
            });
        };


        /**********************/
        /*  HELPER FUNCTIONS  */
        /**********************/
        /* Returns true if the cell represented by the inputs is a cell in which the next move can be validly made */
        $scope.isMoveValid = function(gridIndex, rowIndex, columnIndex) {
            return ($scope.currentGame.grids[gridIndex][rowIndex][columnIndex] === "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) !== -1);
        };

        // TODO: simplify this for clients and just get it from $scope.currentGame.uberGrid
        /* Returns the winner of the inputted grid or "" if no one has won the grid */
        $scope.getGridWinner = function(grid) {
            // Set the grid as not won
            var gridWinner = "";

            // Check for a win across the rows
            for (var i = 0; i < 3; ++i) {
                if (grid[i][0] !== "" && grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2])
                {
                    gridWinner = grid[i][0];
                }
            }

            if (!gridWinner) {
                // Check for a win down the columns
                for (i = 0; i < 3; ++i) {
                    if (grid[0][i] !== "" && grid[0][i] === grid[1][i] && grid[1][i] === grid[2][i])
                    {
                        gridWinner = grid[0][i];
                    }
                }

                if (!gridWinner) {
                    // Check for a win on the diagnoals
                    if (grid[0][0] !== "" && grid[0][0] === grid[1][1] && grid [1][1] === grid [2][2]) {
                        gridWinner = grid[0][0];
                    }
                    else if (grid[0][2] !== "" && grid[0][2] === grid[1][1] && grid [1][1] === grid [2][0]) {
                        gridWinner = grid[0][2];
                    }

                    if (!gridWinner) {
                        // If the grid is full, the player with the most cells wins
                        var numXCells = 0;
                        var numOCells = 0;
                        for (var rowIndex = 0; rowIndex < 3; ++rowIndex) {
                            for (var columnIndex = 0; columnIndex < 3; ++ columnIndex) {
                                if (grid[rowIndex][columnIndex] === "github") {
                                    numXCells += 1;
                                }
                                else if (grid[rowIndex][columnIndex] === "twitter") {
                                    numOCells += 1;
                                }
                            }
                        }

                        if (numXCells + numOCells === 9) {
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

        /* Returns the CSS class the current cell should have */
        $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
            if ($scope.currentGame && !$scope.currentGame.winner)
            {
                if ($scope.loggedInUser && $scope.loggedInUser.provider === $scope.currentGame.whoseTurn && $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] === "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) !== -1) {
                    if ($scope.loggedInUser.currentSuggestion && $scope.loggedInUser.currentSuggestion.gridIndex === gridIndex && $scope.loggedInUser.currentSuggestion.rowIndex === rowIndex && $scope.loggedInUser.currentSuggestion.columnIndex === columnIndex) {
                        return "suggestedMove";
                    }
                    else {
                        return "validForMove";
                    }
                }
                else if ($scope.currentGame.previousMove && $scope.currentGame.previousMove.gridIndex === gridIndex && $scope.currentGame.previousMove.rowIndex === rowIndex && $scope.currentGame.previousMove.columnIndex === columnIndex) {
                    return "previousMove";
                }
            }
        };

        /* Returns the CSS class the current team container should have */
        $scope.getTeamContainerClass = function(team) {
            if ($scope.currentGame && !$scope.currentGame.winner && $scope.currentGame.whoseTurn === team) {
                return "activeTeam";
            }
        };

        /* Returns the CSS class the current grid winner should have */
        $scope.getGridWinnerClass = function(gridIndex) {
            if ($scope.currentGame && $scope.currentGame.winner && $scope.currentGame.winner === $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3]){
                return "winningTeam";
            }
        };
    }
]);
}());
