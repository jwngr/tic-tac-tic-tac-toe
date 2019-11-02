import {connect} from 'react-redux';

import {setErrorMessage} from '../../actions';

import GameBoard from './index';

const mapStateToProps = ({currentGame}) => ({currentGame});

const mapDispatchToProps = (dispatch) => {
  return {
    setErrorMessage: (errorMessage) => {
      dispatch(setErrorMessage(errorMessage));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GameBoard);
