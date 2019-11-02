import React from 'react';

import gitHubLogo from '../../../images/gitHubLogo.png';
import twitterLogo from '../../../images/twitterLogo.png';

import {Row, Cell, Grid, GridWinner, UberGridWrapper} from './index.styles';

import {db} from '../../../lib/loadFirebase';
import {getProvider, isMoveValid, getEmptyGrid} from '../../../lib/utils';

const rootRef = db.ref();
const suggestionsRef = rootRef.child('suggestions');

class UberGrid extends React.Component {
  state = {
    suggestions: getEmptyGrid(0),
    loggedInUserSuggestion: null,
  };

  componentDidMount = () => {
    // Keep track of the move suggestions.
    this.suggestionsChildAddedListener = suggestionsRef.on('child_added', (childSnapshot) => {
      var suggestion = childSnapshot.val();

      this.setState(({suggestions}) => {
        // Add the users' suggestion to the suggestions grid.
        suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;

        return {suggestions};
      });
    });

    this.suggestionsChildChangedListener = suggestionsRef.on('child_changed', (childSnapshot) => {
      var suggestion = childSnapshot.val();

      this.setState(({suggestions}) => {
        // Remove the user's previous suggestion from the suggestions grid.
        suggestions[suggestion.previousSuggestion.gridIndex][
          suggestion.previousSuggestion.rowIndex
        ][suggestion.previousSuggestion.columnIndex] -= 1;

        // Add the user's current suggestion to the suggestions grid.
        suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] += 1;

        return {suggestions};
      });
    });

    this.suggestionsChildRemovedListener = suggestionsRef.on('child_removed', (childSnapshot) => {
      var suggestion = childSnapshot.val();

      this.setState(({suggestions}) => {
        // Remove the user's suggestion from the suggestions grid.
        suggestions[suggestion.gridIndex][suggestion.rowIndex][suggestion.columnIndex] -= 1;

        return {suggestions, loggedInUserSuggestion: null};
      });
    });
  };

  componentWillUnmount = () => {
    suggestionsRef.off('child_added', this.suggestionsChildAddedListener);
    suggestionsRef.off('child_changed', this.suggestionsChildChangedListener);
    suggestionsRef.off('child_removed', this.suggestionsChildRemovedListener);
  };

  /* Suggests a move for the logged-in user's team */
  suggestMove = (gridIndex, rowIndex, columnIndex) => {
    const {loggedInUserSuggestion} = this.state;
    const {loggedInUser, currentGame, setErrorMessage} = this.props;

    if (loggedInUser) {
      // Make sure the logged-in user's team is up and the suggested move is valid.
      if (
        getProvider(loggedInUser) === currentGame.whoseTurn &&
        isMoveValid(currentGame, gridIndex, rowIndex, columnIndex)
      ) {
        // Ignore the suggesetion if it hasn't changed
        if (
          loggedInUserSuggestion === null ||
          loggedInUserSuggestion.gridIndex !== gridIndex ||
          loggedInUserSuggestion.rowIndex !== rowIndex ||
          loggedInUserSuggestion.columnIndex !== columnIndex
        ) {
          // Add the suggestion to the /suggestions/ node
          suggestionsRef.child(loggedInUser.uid).set(
            {
              gridIndex,
              rowIndex,
              columnIndex,
              previousSuggestion: loggedInUserSuggestion || false,
            },
            (error) => {
              if (error) {
                setErrorMessage(`Failed to write suggestion to Firebase: ${error.message}`);
              } else {
                setErrorMessage(null);
              }
            }
          );
        }
      }
    }

    // Save the logged-in users's current suggestion
    this.setState({
      loggedInUserSuggestion: {
        gridIndex: gridIndex,
        rowIndex: rowIndex,
        columnIndex: columnIndex,
      },
    });
  };

  /* Returns the CSS class the current cell should have */
  getCellClass = (gridIndex, rowIndex, columnIndex) => {
    const {loggedInUserSuggestion} = this.state;
    const {loggedInUser, currentGame} = this.props;

    if (currentGame.winner) {
      return '';
    }

    if (
      loggedInUser &&
      getProvider(loggedInUser) === currentGame.whoseTurn &&
      currentGame.grids[gridIndex][rowIndex][columnIndex] === '' &&
      currentGame.validGridsForNextMove.indexOf(gridIndex) !== -1
    ) {
      if (
        loggedInUserSuggestion &&
        loggedInUserSuggestion.gridIndex === gridIndex &&
        loggedInUserSuggestion.rowIndex === rowIndex &&
        loggedInUserSuggestion.columnIndex === columnIndex
      ) {
        return 'suggestedMove';
      } else {
        return 'validForMove';
      }
    } else if (
      currentGame.previousMove &&
      currentGame.previousMove.gridIndex === gridIndex &&
      currentGame.previousMove.rowIndex === rowIndex &&
      currentGame.previousMove.columnIndex === columnIndex
    ) {
      return 'previousMove';
    }
  };

  render() {
    const {currentGame} = this.props;
    const {suggestions} = this.state;

    const gridsContent = currentGame.grids.map((grid, gridIndex) => {
      const gridWinner = currentGame.uberGrid[Math.floor(gridIndex / 3)][gridIndex % 3];

      if (gridWinner) {
        const imageContent =
          gridWinner === 'github' ? (
            <img src={gitHubLogo} alt={`GitHub logo`} />
          ) : (
            <img src={twitterLogo} alt={`Twitter logo`} />
          );
        return (
          <Grid key={`grid-${gridIndex}`}>
            <GridWinner className={currentGame.winner === gridWinner ? 'winningTeam' : ''}>
              {imageContent}
            </GridWinner>
          </Grid>
        );
      }

      return (
        <Grid key={`grid-${gridIndex}`}>
          {grid.map((row, rowIndex) => {
            return (
              <Row key={`row-${gridIndex}-${rowIndex}`}>
                {row.map((cell, columnIndex) => {
                  let cellContent;
                  if (cell === '') {
                    const suggestionsCount = suggestions[gridIndex][rowIndex][columnIndex];
                    cellContent = suggestionsCount !== 0 && <p>{suggestionsCount}</p>;
                  } else if (cell === 'github') {
                    cellContent = <img src={gitHubLogo} alt="GitHub logo" />;
                  } else if (cell === 'twitter') {
                    cellContent = <img src={twitterLogo} alt="Twitter logo" />;
                  }

                  return (
                    <Cell
                      key={`cell-${gridIndex}-${rowIndex}-${columnIndex}`}
                      className={this.getCellClass(gridIndex, rowIndex, columnIndex)}
                      onClick={() => this.suggestMove(gridIndex, rowIndex, columnIndex)}
                    >
                      {cellContent}
                    </Cell>
                  );
                })}
              </Row>
            );
          })}
        </Grid>
      );
    });

    return <UberGridWrapper>{gridsContent}</UberGridWrapper>;
  }
}

export default UberGrid;
