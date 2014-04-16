var app = angular.module("tic-tac-tic-tac-toe-app", ["firebase"]);

/* Returns a list of items in reverse order */
app.filter("reverse", function() {
    return function(items) {
        return items ? items.slice().reverse() : [];
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
                //suggestions: $scope.getEmptyGrid(0),
                previousMove: false,
                validGridsForNextMove: "0,1,2,3,4,5,6,7,8",
                numSecondsUntilNextMove: 5
            };

            $scope.suggestions = $scope.getEmptyGrid("");

            // Create a new game event
            /*$firebase($scope.rootRef).$child("events").$add({
                imageUrl: "./images/ticTacTicTacToeLogo.png",
                text: "A new game has started!",
                type: "newGame"
            });*/
        };

        // Keep track of the last certain number of game events in a list
        /*$scope.events = [];
        $scope.rootRef.child("events").limit(100).on("child_added", function(newChildSnapshot) {
            var numEventsToKeep = 100;
            $scope.events.push(newChildSnapshot.val());
            if ($scope.events.length > numEventsToKeep) {
                $scope.events.splice(numEventsToKeep, 1);
            }
        });*/

        // Keep track of the number of GitHub users
        $scope.numGitHubUsers = 0;
        var gitHubUsersRef = $firebase($scope.rootRef).$child("loggedInUsers/github");
        gitHubUsersRef.$on("child_added", function(dataSnapshot) {
            $scope.numGitHubUsers += 1;
        });
        gitHubUsersRef.$on("child_removed", function(dataSnapshot) {
            $scope.numGitHubUsers -= 1;
        });

        // Keep track of the number of Twitter users
        $scope.numTwitterUsers = 0;
        var twitterUsersRef = $firebase($scope.rootRef).$child("loggedInUsers/twitter");
        twitterUsersRef.$on("child_added", function(dataSnapshot) {
            $scope.numTwitterUsers += 1;
        });
        twitterUsersRef.$on("child_removed", function(dataSnapshot) {
            $scope.numTwitterUsers -= 1;
        });

        // Load the current game
        var currentGameRef = $firebase($scope.rootRef.child("currentGame"));
        currentGameRef.$on("loaded", function(initialData) {
            // Create a 3-way binding between the DOM, the current game object, and the newly created Firebase game node
            $scope.currentGame = initialData;
            currentGameRef.$bind($scope, "currentGame");

            // Reset the logged-in user's guess every time the grids are updated
            $firebase($scope.rootRef).$child("currentGame/grids").$on("change", function(dataSnapshot) {
                if ($scope.loggedInUser) {
                    $scope.loggedInUser.suggestedMove = null;
                }
            });

            // If the current user is logged in, store them and setup the current game
            $scope.loginObj.$getCurrentUser().then(function(loggedInUser) {
                if (loggedInUser) {
                    $scope.setupGame(loggedInUser);
                }
            });
        });

        /*currentGameRef.$child("grids").$on("change", function(newData) {
            console.log($scope.currentGame)
            var imageUrl = ($scope.currentGame.whoseTurn == "github") ? "./images/twitterLogo.png" : "./images/gitHubLogo.png";
            var team = ($scope.currentGame.whoseTurn == "github") ? "Twitter" : "GitHub";

            $scope.events.push({
                imageUrl: imageUrl,
                teamName: team,
                text: " played [" + $scope.currentGame.previousMove.gridIndex + "," + $scope.currentGame.previousMove.rowIndex + "," + $scope.currentGame.previousMove.columnIndex + "]",
                type: "move"
            });
        });*/

        /* Logs the logged-in user out */
        $scope.logoutUser = function() {
            // Remove the user from their team's logged-in users node
            $scope.rootRef.child("loggedInUsers/" + $scope.loggedInUser.provider + "/" + $scope.loggedInUser.uid).remove(function() {
                // Log the user out of Firebase
                $scope.loginObj.$logout();

                // Clear the local logged-in user
                $scope.loggedInUser = null;

                // Clear the update time interval
                window.clearInterval($scope.updateTimerInterval);
            });
        }

        /* Returns the CSS class the current cell should have */
        $scope.getCellClass = function(gridIndex, rowIndex, columnIndex) {
            if ($scope.currentGame && !$scope.currentGame.winner)
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

        $scope.getTeamContainerClass = function(team) {
            if ($scope.currentGame && $scope.currentGame.whoseTurn == team) {
                return "activeTeam";
            }
        }

        $scope.hasSuggestions = function(gridIndex, rowIndex, columnIndex) {
            return ($scope.suggestions && $scope.suggestions[gridIndex][rowIndex][columnIndex]);
        };

        /* Logs the current user in and joins the current game */
        $scope.joinGame = function(provider) {
            $scope.loginObj.$login(provider).then(
                function(loggedInUser) {
                    $scope.setupGame(loggedInUser);
            }, function(error) {
               console.error("Login failed: ", error);
            });
        };

        /* Sets up the current game so that the logged-in user can join it */
        $scope.setupGame = function(loggedInUser) {
            // Store the user locally
            $scope.loggedInUser = loggedInUser;
            console.log(loggedInUser);

            // Keep track of the logged-in user in Firebase when the logged-in user is connected or disconnected
            $scope.rootRef.child(".info/connected").on("value", function(dataSnapshot) {
                if (dataSnapshot.val() === true) {
                    // Remove the user from the logged-in users list when they get disconnected
                    var loggedInUsersRef = $scope.rootRef.child("loggedInUsers/" + $scope.loggedInUser.provider + "/" + $scope.loggedInUser.uid);
                    loggedInUsersRef.onDisconnect().remove();

                    // Add the user to the logged-in users list when they get connected
                    $firebase(loggedInUsersRef).$set(true);

                    // If the host is getting disconnected, set that the current game has no host
                    if ($scope.isHost) {
                        $scope.rootRef.child("currentGame/hasHost").onDisconnect().set(false);
                    }
                }
            });

            // Create a 3-way binding with the scoreboard wins
            $firebase($scope.rootRef).$child("wins").$bind($scope, "wins");

            // Create a 3-way binding with the move suggestions
            $firebase($scope.rootRef).$child("suggestions").$bind($scope, "suggestions");

            // If there one actively hosting the current game, start a new game and make the logged-in user host
            if (!$scope.currentGame.hasHost) {
                // Reset the current game
                $scope.resetCurrentGame();

                // Set this player as the host
                $scope.isHost = true;
            }

            // Update the game message text
            $scope.setGameMessage();

            // Update the timer every second
            $scope.updateTimerInterval = window.setInterval($scope.updateTimer, 1000);
        };

        /* Updates the timer (if the logged-in user is the host) and the game message text */
        $scope.updateTimer = function() {
            $timeout(function() {
                // Decrement the timer if the logged-in user is the host
                if ($scope.isHost) {
                    $scope.currentGame.numSecondsUntilNextMove -= 1;

                    if ($scope.currentGame.numSecondsUntilNextMove == 0) {
                        // If there is not a winner, reset the timer and make a move for the current team
                        if (!$scope.currentGame.winner) {
                            $scope.currentGame.numSecondsUntilNextMove = 5;
                            $scope.makeMove();
                        }
                        // Otherwise, reset the game since it has been won
                        else {
                            $scope.resetCurrentGame();
                        }
                    }
                }

                // Set the game message
                $scope.setGameMessage();
            });
        };

        $scope.setGameMessage = function() {
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

        $scope.makeMove = function() {
            // Get the number of suggestion
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
            else {
                for (var i = 0; i < 9; ++i) {
                    for (var j = 0; j < 3; ++j) {
                        for (var k = 0; k < 3; ++k) {
                            var numTimesSuggested = $scope.suggestions[i][j][k] ? $scope.suggestions[i][j][k] : 0;
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
            var gridIndex = parseInt(validGridsForNextMove[Math.floor(Math.random() * numValidGridsForNextMove)]);

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
            if ($scope.currentGame && $scope.loggedInUser && $scope.loggedInUser.provider == $scope.currentGame.whoseTurn && !$scope.loggedInUser.suggestedMove && $scope.isMoveValid(gridIndex, rowIndex, columnIndex)) {
                // Save the logged-in users's suggested guess so they cannot guess again until the next round
                $scope.loggedInUser.suggestedMove = {
                    gridIndex: gridIndex,
                    rowIndex: rowIndex,
                    columnIndex: columnIndex
                };

                // Get the username, image URL, and user URL of the logged-in player
                var username = $scope.loggedInUser.username;
                var imageUrl = ($scope.loggedInUser.provider == "github") ? $scope.loggedInUser.avatar_url : $scope.loggedInUser.profile_image_url_https;
                var userUrl = ($scope.loggedInUser.provider == "github") ?  "https://github.com/" + username : "https://twitter.com/" + username;

                // Create an event for the logged-in player's suggestion
                /*$firebase($scope.rootRef).$child("events").$add({
                    imageUrl: imageUrl,
                    userUrl: userUrl,
                    text: " chose [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                    username: username,
                    type: "suggestion"
                });*/

                // Add the suggestion to Firebase
                var numCurrentSuggestions = $scope.suggestions[gridIndex][rowIndex][columnIndex];
                if (numCurrentSuggestions) {
                    $scope.suggestions[gridIndex][rowIndex][columnIndex] += 1;
                }
                else {
                    $scope.suggestions[gridIndex][rowIndex][columnIndex] = 1;
                }
            }
        };

        /* Returns the number of suggestions for the current move */
        $scope.getNumSuggestions = function() {
            var numSuggestions = 0;
            for (var i = 0; i < 9; ++i) {
                for (var j = 0; j < 3; ++j) {
                    for (var k = 0; k < 3; ++k) {
                        numSuggestions += $scope.suggestions[i][j][k] ? $scope.suggestions[i][j][k] : 0;
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
            /*$firebase($scope.rootRef).$child("events").$add({
                imageUrl: imageUrl,
                teamName: team,
                text: " played [" + gridIndex + "," + rowIndex + "," + columnIndex + "]",
                type: "move"
            });*/

            // Update whose turn it is
            $scope.currentGame.whoseTurn = ($scope.currentGame.whoseTurn == "github") ? "twitter" : "github";

            // Set the previous move
            $scope.currentGame.previousMove = {
                gridIndex: gridIndex,
                rowIndex: rowIndex,
                columnIndex: columnIndex
            };

            // Clear the move suggestions
            $scope.suggestions = $scope.getEmptyGrid("");

            // Update the uber grid if the current grid was won
            $scope.currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3] = $scope.getGridWinner($scope.currentGame.grids[gridIndex]);

            // Get the grids in which the next move can be made
            $scope.currentGame.validGridsForNextMove = $scope.getValidGridsForNextMove(rowIndex, columnIndex);

            // Check if the uber grid was won and the game should end
            var uberGridWinner = $scope.getGridWinner($scope.currentGame.uberGrid);
            if (uberGridWinner) {
                // Add a game over event to the play by play ticker
                var team = (uberGridWinner == "github") ? "GitHub" : "Twitter";
                /*$firebase($scope.rootRef).$child("events").$add({
                    imageUrl: "./images/ticTacTicTacToeLogo.png",
                    teamName: team,
                    text: " won!",
                    type: "gameOver"
                });*/

                // Specify who won the game in Firebase
                $scope.currentGame.winner = uberGridWinner;

                // Increment the number of teams wins
                if (uberGridWinner == "github") {
                    $scope.wins.github += 1;
                }
                else {
                    $scope.wins.twitter += 1;
                }

                // Append the current game to the history node in Firebase
                $firebase($scope.rootRef.child("history")).$add($scope.currentGame);

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