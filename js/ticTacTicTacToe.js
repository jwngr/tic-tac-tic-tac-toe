var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

/* Returns a list of items in reverse order */
app.filter('reverse', function() {
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
    };

    return function(items) {
        return toArray(items).slice().reverse();
    };
});

/* Returns the empty string if the input is 0; otherwise, returns the input */
app.filter("replaceZeroWithEmptyString", function() {
    return function(value) {
        return value ? value : "";
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
        // Create a 3-way binding to the play by play events, limiting how many we keep at a time
        $firebase($scope.rootRef.child("events").limit(100)).$bind($scope, "events").then();

        // Create a 3-way binding with the scoreboard wins
        $firebase($scope.rootRef).$child("wins").$bind($scope, "wins");

        // Keep track of the number of GitHub users
        $scope.numGitHubUsers = 0;
        var gitHubUsersRef = $firebase($scope.rootRef.child("loggedInUsers/github"));
        gitHubUsersRef.$on("child_added", function(dataSnapshot) {
            $scope.numGitHubUsers += 1;
        });
        gitHubUsersRef.$on("child_removed", function(dataSnapshot) {
            $scope.numGitHubUsers -= 1;
        });

        // Keep track of the number of Twitter users
        $scope.numTwitterUsers = 0;
        var twitterUsersRef = $firebase($scope.rootRef.child("loggedInUsers/twitter"));
        twitterUsersRef.$on("child_added", function(dataSnapshot) {
            $scope.numTwitterUsers += 1;
        });
        twitterUsersRef.$on("child_removed", function(dataSnapshot) {
            $scope.numTwitterUsers -= 1;
        });


        /********************/
        /*  LOGIN / LOGOUT  */
        /********************/
        // Get the time offset between this client and the Firebase server and set the local timer
        $firebase($scope.rootRef.child(".info/serverTimeOffset")).$bind($scope, "serverTimeOffset").then(function() {
            // Create a 3-way binding with the current game
            $firebase($scope.rootRef.child("currentGame")).$bind($scope, "currentGame").then(function(unbind) {
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
                $scope.suggestions = null;

                // Turn off any Firebase event listeners
                $scope.rootRef.child("suggestions").off();
                $scope.rootRef.child(".info/connected").off();

                // Clear the update time interval
                if ($scope.isHost) {
                    window.clearInterval($scope.updateTimerInterval);
                }
            });
        };


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

        /* Initializes a new game, wiping out any existing game */
        $scope.resetCurrentGame = function() {
            // Initialize a new game
            $scope.currentGame = {
                whoseTurn: (Math.random() > 0.5) ? "github" : "twitter",
                hasHost: true,
                winner: "",
                grids: $scope.getEmptyGrid(""),
                uberGrid: [
                    [ "", "", "" ],
                    [ "", "", "" ],
                    [ "", "", "" ]
                ],
                previousMove: false,
                validGridsForNextMove: "0,1,2,3,4,5,6,7,8",
                timeOfNextMove: $scope.generateTimeOfNextMove(5)
            };

            // Initialize the suggestions grid
            $scope.suggestions = $scope.getEmptyGrid(0);

            // Create a new game event
            $scope.events.$add({
                imageUrl: "./images/ticTacTicTacToeLogo.png",
                text: "A new game has started!",
                type: "newGame"
            });
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

                    // If the host is getting disconnected, specify that the current game has no host
                    if ($scope.isHost) {
                        $scope.rootRef.child("currentGame/hasHost").onDisconnect().set(false);
                    }
                }
            });

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
                $scope.loggedInUser.currentSuggestion = null;
            });

            // If the current game does not have a host, reset the game and make the logged-in user host
            if (!$scope.currentGame.hasHost) {
                // Reset the current game
                $scope.resetCurrentGame();

                // Set the logged-in user as host
                $scope.isHost = true;
            }

            // Update the game message text
            $scope.setGameMessage();
        };


        /***********************/
        /*  UPDATE GAME STATE  */
        /***********************/
        /* Adds a suggestion from the logged-in users for his team's move */
        $scope.suggestMove = function(gridIndex, rowIndex, columnIndex) {
            // Make sure a game has started, the logged-in user's team is up, and the move is valid
            if ($scope.currentGame && $scope.loggedInUser && $scope.loggedInUser.provider == $scope.currentGame.whoseTurn && $scope.isMoveValid(gridIndex, rowIndex, columnIndex)) {
                // Ignore the suggesetion if it hasn't changed
                if (!$scope.loggedInUser.currentSuggestion || $scope.loggedInUser.currentSuggestion.gridIndex != gridIndex || $scope.loggedInUser.currentSuggestion.rowIndex != rowIndex || $scope.loggedInUser.currentSuggestion.columnIndex != columnIndex) {
                    // Get the username, image URL, and user URL of the logged-in user
                    var username = $scope.loggedInUser.username;
                    var imageUrl = ($scope.loggedInUser.provider == "github") ? $scope.loggedInUser.avatar_url : $scope.loggedInUser.profile_image_url_https;
                    var userUrl = ($scope.loggedInUser.provider == "github") ?  "https://github.com/" + username : "https://twitter.com/" + username;

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

        /* Makes a move for the current team by choosing the most popular suggestion */
        $scope.makeMove = function() {
            // Get the number of suggestions
            var numSuggestions = $scope.getNumSuggestions();

            // Create a variable to hold the most suggested cell
            var maxSuggestion = {
                gridIndex: null,
                rowIndex: null,
                cellIndex: null,
                numTimesSuggested: 0
            };

            // If there were no suggestions, just select a random valid cell
            if (numSuggestions == 0) {
                maxSuggestion = $scope.getRandomValidMove();
            }

            // Otherwise, select the most popular cell
            else {
                for (var i = 0; i < 9; ++i) {
                    for (var j = 0; j < 3; ++j) {
                        for (var k = 0; k < 3; ++k) {
                            var numTimesSuggested = $scope.suggestions[i][j][k];
                            if (numTimesSuggested > maxSuggestion.numTimesSuggested || (numTimesSuggested == maxSuggestion.numTimesSuggested && Math.random() > 0.5)) {
                                maxSuggestion = {
                                    gridIndex: i,
                                    rowIndex: j,
                                    columnIndex: k,
                                    numTimesSuggested: numTimesSuggested
                                };
                            }
                        }
                    }
                }
            }

            // Add the move to the board
            $scope.addMove(maxSuggestion.gridIndex, maxSuggestion.rowIndex, maxSuggestion.columnIndex);
        };

        /* Adds a new move to the board */
        $scope.addMove = function(gridIndex, rowIndex, columnIndex) {
            // Update the inputted cell's value
            $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] = $scope.currentGame.whoseTurn;

            // Get the image URL and team name of the team who is making the move
            var imageUrl = ($scope.currentGame.whoseTurn == "github") ? "./images/gitHubLogo.png" : "./images/twitterLogo.png";
            var team = ($scope.currentGame.whoseTurn == "github") ? "GitHub" : "Twitter";

            // Create an event for the move
            $scope.events.$add({
                imageUrl: imageUrl,
                teamName: team,
                text: " played [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                type: "move"
            });

            // Update whose turn it is
            $scope.currentGame.whoseTurn = ($scope.currentGame.whoseTurn == "github") ? "twitter" : "github";

            // Store this move as the previous move
            $scope.currentGame.previousMove = {
                gridIndex: gridIndex,
                rowIndex: rowIndex,
                columnIndex: columnIndex
            };

            // Clear the move suggestions
            $scope.rootRef.child("suggestions").remove();

            // Update the uber grid if the current grid was won
            $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3] = $scope.getGridWinner($scope.currentGame.grids[gridIndex]);

            // Get the grids in which the next move can be made
            $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove(rowIndex, columnIndex);

            // Check if the uber grid was won and the game should end
            var uberGridWinner = $scope.getGridWinner($scope.currentGame.uberGrid);
            if (uberGridWinner) {
                // Add a game over event to the play by play ticker
                var team = (uberGridWinner == "github") ? "GitHub" : "Twitter";
                $scope.events.$add({
                    imageUrl: "./images/ticTacTicTacToeLogo.png",
                    teamName: team,
                    text: " won!",
                    type: "gameOver"
                });

                // Specify who won the game
                $scope.currentGame.winner = uberGridWinner;

                // Wait ten seconds until the next game starts
                $scope.currentGame.timeOfNextMove += 10000;

                // Increment the number of teams wins
                if (uberGridWinner == "github") {
                    $scope.wins.github += 1;
                }
                else {
                    $scope.wins.twitter += 1;
                }

                // Append the current game to the games history
                $firebase($scope.rootRef.child("history")).$add($scope.currentGame);
            }

            // Otherwise, if there is no winner, set the next move to be made in five seconds
            else {
                $scope.currentGame.timeOfNextMove += 5000;
            }
        };

        /* Set the text of the game message */
        $scope.setGameMessage = function(currentGame) {
            // If a game is not complete, set the message telling whose turn it is
            currentGame = currentGame || $scope.currentGame;
            if (!currentGame.winner) {
                // Get the team whose turn it is and the logged-in user's team
                var whoseTurnTeam = (currentGame.whoseTurn == "github") ? "GitHub" : "Twitter";
                var loggedInUsersTeam = ($scope.loggedInUser.provider == "github") ? "GitHub" : "Twitter";

                // If it is the logged-in user's team's turn, tell them how much time is left to make it
                if (whoseTurnTeam == loggedInUsersTeam) {
                    $scope.gameMessage = "Suggest a move for Team " + whoseTurnTeam + "!";
                }
                // Otherwise, just say that they are waiting for the other team to move
                else {
                    $scope.gameMessage = "Waiting for Team " + whoseTurnTeam + " to make a move.";
                }
            }

            // Otherwise, set the message telling who won the previous game and how long it is until the next game
            else {
                var winningTeam = (currentGame.winner == "github") ? "GitHub" : "Twitter";
                $scope.gameMessage = "Team " + winningTeam + " wins! A new game will start soon.";
            }
        };

        /***********/
        /*  TIMER  */
        /***********/
        /* Returns the time at which the next move should be made */
        $scope.generateTimeOfNextMove = function(numSecondsUntilNextMove) {
            return new Date().getTime() + $scope.serverTimeOffset + (numSecondsUntilNextMove * 1000);
        };

        /* Resets the timer every time the time for the next move is updated */
        $scope.rootRef.child("currentGame").on("value", function(dataSnapshot) {
            // Get the time of the next move
            var currentGame = dataSnapshot.val();

            // Clear the current update timer interval
            window.clearInterval($scope.updateTimerInterval);

            // Update the number of seconds until the next move
            $scope.numSecondsUntilNextMove = Math.ceil((currentGame.timeOfNextMove - $scope.serverTimeOffset - new Date().getTime()) / 1000);
            if ($scope.numSecondsUntilNextMove <= 0) {
                $scope.numSecondsUntilNextMove = 5;
            }

            // Update the timer every second
            $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);

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
                if ($scope.numSecondsUntilNextMove == 0)
                {
                    // Clear the current update timer interval
                    window.clearInterval($scope.updateTimerInterval);

                    if ($scope.isHost) {
                        // If there is not a winner, reset the timer in Firebase and make a move for the current team
                        if (!$scope.currentGame.winner) {
                            $scope.makeMove();
                        }
                        // Otherwise, reset the game since it has been won
                        else {
                            $scope.resetCurrentGame();
                        }
                    }
                }
            });
        };


        /**********************/
        /*  HELPER FUNCTIONS  */
        /**********************/
        /* Returns a random grid cell in which the next move can be made */
        $scope.getRandomValidMove = function() {
            // Get the valid grids for next move as an array
            var validGridsForNextMove = $scope.currentGame.validGridsForNextMove.split(",");

            // Randomly choose one of the valid grids to make a move in
            var numValidGridsForNextMove = validGridsForNextMove.length;
            var gridIndex = parseInt(validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)]);

            // Keep looping until we find cell coordinates for an open cell
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

        /* Returns the total number of total suggestions the current team has made */
        $scope.getNumSuggestions = function() {
            var numSuggestions = 0;
            for (var i = 0; i < 9; ++i) {
                for (var j = 0; j < 3; ++j) {
                    for (var k = 0; k < 3; ++k) {
                        numSuggestions += $scope.suggestions[i][j][k];
                    }
                }
            }
            return numSuggestions;
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
        };

        /* Returns the winner of the inputted grid or "" if no one has won the grid */
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

        /* Returns the CSS class the current cell should have */
        $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
            if ($scope.currentGame && !$scope.currentGame.winner)
            {
                if ($scope.loggedInUser && $scope.loggedInUser.provider == $scope.currentGame.whoseTurn && $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) != -1) {
                    if ($scope.loggedInUser.currentSuggestion && $scope.loggedInUser.currentSuggestion.gridIndex == gridIndex && $scope.loggedInUser.currentSuggestion.rowIndex == rowIndex && $scope.loggedInUser.currentSuggestion.columnIndex == columnIndex) {
                        return "suggestedMove";
                    }
                    else {
                        return "validForMove";
                    }
                }
                else if ($scope.currentGame.previousMove && $scope.currentGame.previousMove.gridIndex == gridIndex && $scope.currentGame.previousMove.rowIndex == rowIndex && $scope.currentGame.previousMove.columnIndex == columnIndex) {
                    return "previousMove";
                }
            }
        };

        /* Returns the CSS class the current team container should have */
        $scope.getTeamContainerClass = function(team) {
            if ($scope.currentGame && !$scope.currentGame.winner && $scope.currentGame.whoseTurn == team) {
                return "activeTeam";
            }
        };

        /* Returns the CSS class the current grid winner should have */
        $scope.getGridWinnerClass = function(gridIndex) {
            if ($scope.currentGame && $scope.currentGame.winner && $scope.currentGame.winner == $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3]){
                return "winningTeam";
            }
        };
    }
]);