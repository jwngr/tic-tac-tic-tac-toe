var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

/* Returns a list of items in reverse order */
app.filter("reverse", function() {
    return function(items) {
        if (items == undefined) {
            return [];
        }

        // Limit the number of events to show to 100
        if (items.length > 100) {
            items = items.splice(0, 1);
        }

        return items.slice().reverse();
    };
});

app.controller("TicTacTicTacToeController", ["$scope", "$firebase", "$firebaseSimpleLogin", "$timeout",
    function($scope, $firebase, $firebaseSimpleLogin, $timeout) {
        // Get a reference to the root of the Firebase
        $scope.rootRef = new Firebase("https://tic-tac-tic-tac-toe.firebaseio.com/");

        // Initialize the Firebase simple login factory
        $scope.loginObj = $firebaseSimpleLogin($scope.rootRef);

        /* Returns a completely empty grid */
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

        /* Resets state so that a new game can be started and empties the grid */
        $scope.resetCurrentMMOGame = function() {
            // Initialize a new game
            $scope.currentGame = {
                type: "mmo",
                whoseTurn: (Math.random() > 0.5) ? "github" : "twitter",
                hasStarted: true,
                winner: "",
                grids: $scope.getEmptyGrid(""),
                uberGrid: [
                    [ "", "", "" ],
                    [ "", "", "" ],
                    [ "", "", "" ]
                ],
                suggestions: $scope.getEmptyGrid(0),
                previousMove: false,
                validGridsForNextMove: "0,1,2,3,4,5,6,7,8",
                numSecondsUntilNextMove: 5
            };

            // Create the new game event
            if (!$scope.stats.events) {
                $scope.stats.events = [];
            }
            $scope.stats.events.push({
                imageUrl: "./images/ticTacTicTacToeLogo.png",
                text: "New game has started!",
                type: "newGame"
            });
            /*$firebase($scope.rootRef).$child("stats/events").$add({
                imageUrl: "./images/ticTacTicTacToeLogo.png",
                text: "New game has started!",
                type: "newGame"
            });*/
        };

        // Load the current MMO game
        var mmoGameRef = $firebase($scope.rootRef.child("/mmo/current/"));
        mmoGameRef.$on("loaded", function(initialData) {
            // Create a 3-way binding between the DOM, the current game object, and the newly created Firebase game node
            $scope.currentGame = initialData;
            mmoGameRef.$bind($scope, "currentGame");

            // Reset the logged-in user's guess every time the grids are updated
            $firebase($scope.rootRef).$child("/mmo/current/grids/").$on("change", function(dataSnapshot) {
                if ($scope.loggedInUser) {
                    $scope.loggedInUser.suggestedMove = null;
                }
            });

            // If the current user is logged in, store them and setup the MMO game
            $scope.loginObj.$getCurrentUser().then(function(loggedInUser) {
                if (loggedInUser) {
                    // Store the user locally
                    $scope.loggedInUser = loggedInUser;
                    console.log(loggedInUser);

                    // Populate the scoreboard
                    var statsRef = $firebase($scope.rootRef).$child("stats");
                    statsRef.$on("loaded", function(initialData) {
                        $scope.stats = initialData;
                        statsRef.$bind($scope, "stats");

                        // Set up the MMO game
                        $scope.setupMMOGame();
                    });
                }
            });
        });

        /* Logs the logged-in user out */
        $scope.logoutUser = function() {
            // Log the user out of Firebase
            $scope.loginObj.$logout();

            // Clear the local logged-in user
            $scope.loggedInUser = null;

            // Clear the update time interval
            window.clearInterval($scope.updateTimerInterval);
        }

        /* Returns the CSS class the current cell should have */
        $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
            if ($scope.currentGame.hasStarted && !$scope.currentGame.winner)
            {
                if ($scope.loggedInUser && $scope.loggedInUser.provider == $scope.currentGame.whoseTurn && $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] == "" && $scope.currentGame.validGridsForNextMove.indexOf(gridIndex) != -1) {
                    if ($scope.loggedInUser.suggestedMove && $scope.loggedInUser.suggestedMove.gridIndex == gridIndex && $scope.loggedInUser.suggestedMove.rowIndex == rowIndex && $scope.loggedInUser.suggestedMove.columnIndex == columnIndex) {
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

        /* Logs the current user in and joins the current MMO game */
        $scope.joinMMOGame = function(provider) {
            $scope.loginObj.$login(provider).then(
                function(loggedInUser) {
                    // Store the user globally
                    $scope.loggedInUser = loggedInUser;

                    // Set up the MMO game
                    $scope.setupMMOGame();
            }, function(error) {
               console.error("Login failed: ", error);
            });
        };

        /* Sets up the current MMO game so that the logged-in user can join it */
        $scope.setupMMOGame = function() {
            // If there is no active MMO, start a new one and make the logged-in user host
            if (!$scope.currentGame.hasStarted) {
                // Reset the current MMO game
                $scope.resetCurrentMMOGame();

                // Set this player as the host
                $scope.isMMOHost = true;
            }

            // Update the game message text
            $scope.setMMOGameMessage();

            // Update the timer every second
            $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);
        };

        /* Updates the timer (if the logged-in user is the host) and the game message text */
        $scope.updateTimer = function() {
            // Decrement the timer if the logged-in user is the host
            if ($scope.isMMOHost) {
                $scope.currentGame.numSecondsUntilNextMove -= 1;

                // If time is up, make a move for the current team and reset the time if a game has started or reset the current MMO game and start a new one otherwise
                if ($scope.currentGame.numSecondsUntilNextMove == 0) {
                    if (!$scope.currentGame.winner) {
                        $scope.currentGame.numSecondsUntilNextMove = 5;
                        $scope.makeMMOMove();
                    }
                    else {
                        $scope.resetCurrentMMOGame();
                    }
                }
            }

            // Update the game message text
            $timeout(function() {
                $scope.setMMOGameMessage();
            });
        };

        $scope.setMMOGameMessage = function() {
            // If a game is not yet complete, set the message telling whose turn it is
            if (!$scope.currentGame.winner) {
                // Get the team whose turn it is and the logged-in user's team
                var whoseTurnTeam = ($scope.currentGame.whoseTurn == "github") ? "GitHub" : "Twitter";
                var loggedInUsersTeam = $scope.getLoggedInUsersTeam();

                // If it is the logged-in user's team's turn, tell them how much time is left to make it
                if (whoseTurnTeam == loggedInUsersTeam) {
                    $scope.message = "Suggest a move for Team " + whoseTurnTeam + "!";
                }
                // Otherwise, just say that they are waiting for the other team to move
                else {
                    $scope.message = "Waiting for Team " + whoseTurnTeam + " to make a move.";
                }
            }
            // Otherwise, set the message telling who won the previous game and how long it is until the next game
            else {
                var uberGridWinner = $scope.getGridWinner($scope.currentGame.uberGrid);
                var winningTeam = (uberGridWinner == "github") ? "GitHub" : "Twitter";
                $scope.message = "Team " + winningTeam + " wins! A new game will start soon.";
            }
        };

        $scope.makeMMOMove = function() {
            // Get the number of suggestion
            var numSuggestions = $scope.getNumSuggestions();

            // Create a variable to hold the most suggested cell
            var maxSuggestion = {
                gridIndex: null,
                rowIndex: null,
                cellIndex: null,
                numTimesSuggested: 0
            }

            // If there were no suggestions, just select a random valid cell
            if (numSuggestions == 0) {
                maxSuggestion = $scope.getRandomValidMove();
            }
            else {
                for (var i = 0; i < 9; ++i) {
                    for (var j = 0; j < 3; ++j) {
                        for (var k = 0; k < 3; ++k) {
                            var numTimesSuggested = $scope.currentGame.suggestions[i][j][k];
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

        /* Returns the properly formatted name of the logged-in user's team */
        $scope.getLoggedInUsersTeam = function() {
            return ($scope.loggedInUser.provider == "github") ? "GitHub" : "Twitter";
        };

        /* Adds a suggestion from the logged-in player for his team's move */
        $scope.suggestMove = function(gridIndex, rowIndex, columnIndex) {
            // Make sure a game has started, the logged-in player's team is up, they have not guessed before, and the move is valid
            if ($scope.currentGame.hasStarted && $scope.loggedInUser && $scope.loggedInUser.provider == $scope.currentGame.whoseTurn && !$scope.loggedInUser.suggestedMove && $scope.isMoveValid(gridIndex, rowIndex, columnIndex)) {
                // Get the username, image URL, and user URL of the logged-in player
                var username = $scope.loggedInUser.username;
                var imageUrl = ($scope.loggedInUser.provider == "github") ? $scope.loggedInUser.avatar_url : $scope.loggedInUser.profile_image_url_https;
                var userUrl = ($scope.loggedInUser.provider == "github") ?  "https://github.com/" + username : "https://twitter.com/" + username;

                // Create an event for the logged-in player's suggestion
                $scope.stats.events.push({
                    imageUrl: imageUrl,
                    userUrl: userUrl,
                    text: " chose [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                    username: username,
                    type: "suggestion"
                });
                /*$firebase($scope.rootRef).$child("stats/events").$add({
                    imageUrl: imageUrl,
                    text: username + " chose [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                    type: "suggestion"
                });*/

                // Add the suggestion to Firebase
                $scope.currentGame.suggestions[gridIndex][rowIndex][columnIndex] += 1;

                // Save the logged-in users's suggested guess so they cannot guess again until the next round
                $scope.loggedInUser.suggestedMove = {
                    gridIndex: gridIndex,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex
                };
            }
        };

        /* Returns the number of suggestions for the current move */
        $scope.getNumSuggestions = function() {
            var numSuggestions = 0;
            for (var i = 0; i < 9; ++i) {
                for (var j = 0; j < 3; ++j) {
                    for (var k = 0; k < 3; ++k) {
                        numSuggestions += $scope.currentGame.suggestions[i][j][k];
                    }
                }
            }
            return numSuggestions;
        }

        /* Add a new move to the board */
        $scope.addMove = function(gridIndex, rowIndex, columnIndex) {
            // Update the correct cell in grids
            $scope.currentGame.grids[gridIndex][rowIndex][columnIndex] = $scope.currentGame.whoseTurn;

            // Get the image URL and team name of the team whose turn it is
            var imageUrl = ($scope.currentGame.whoseTurn == "github") ? "./images/gitHubLogo.png" : "./images/twitterLogo.png";
            var team = ($scope.currentGame.whoseTurn == "github") ? "GitHub" : "Twitter";

            // Create an event for the current team's move
            $scope.stats.events.push({
                imageUrl: imageUrl,
                teamName: team,
                text: " played [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                type: "move"
            });
            /*$firebase($scope.rootRef).$child("stats/events").$add({
                imageUrl: imageUrl,
                text: "Team " + team + " played [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                type: "move"
            });*/

            // Update the number of players for the current team
            var numSuggestions = $scope.getNumSuggestions();
            if ($scope.currentGame.whoseTurn == "github") {
                $scope.stats.numCurrentPlayers.github = numSuggestions;
            }
            else {
                $scope.stats.numCurrentPlayers.twitter = numSuggestions;
            }

            // Update whose turn it is
            $scope.currentGame.whoseTurn = ($scope.currentGame.whoseTurn == "github") ? "twitter" : "github";

            // Set the previous move
            $scope.currentGame.previousMove = {
                gridIndex: gridIndex,
                rowIndex: rowIndex,
                columnIndex: columnIndex
            };

            // Clear the move suggestions
            $scope.currentGame.suggestions = $scope.getEmptyGrid(0);

            // Update the uber grid if the current grid was won
            $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3] = $scope.getGridWinner($scope.currentGame.grids[gridIndex]);

            // Get the grids in which the next move can be made
            $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove(rowIndex, columnIndex);

            // Check if the uber grid was won and the game should end
            var uberGridWinner = $scope.getGridWinner($scope.currentGame.uberGrid);
            if (uberGridWinner) {
                // Add a game over event to the play by play ticker
                var team = (uberGridWinner == "github") ? "GitHub" : "Twitter";
                $scope.stats.events.push({
                    imageUrl: "./images/ticTacTicTacToeLogo.png",
                    teamName: team,
                    text: " won!",
                    type: "gameOver"
                });
                /*$firebase($scope.rootRef).$child("stats/events").$add({
                    imageUrl: "./images/ticTacTicTacToeLogo.png",
                    text: "Team " + team + " won!",
                    type: "gameOver"
                });*/

                // Specify who won the game in Firebase
                $scope.currentGame.winner = uberGridWinner;

                // Increment the number of teams wins
                if (uberGridWinner == "github") {
                    $scope.stats.wins.github += 1;
                }
                else {
                    $scope.stats.wins.twitter += 1;
                }

                // Append the current game to the history node in Firebase
                $firebase($scope.rootRef).$child("mmo/history").$add($scope.currentGame);

                // Update the game message text
                var winningTeam = (uberGridWinner == "github") ? "GitHub" : "Twitter";
                $scope.message = "Team " + winningTeam + " wins! New game starting in 10 seconds.";

                // Update the number of seconds until the next move (aka the  next game)
                $scope.currentGame.numSecondsUntilNextMove = 10;
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

            // Return the winner of the grid or "" if no one has won the grid yet
            return gridWinner;
        };
    }
]);