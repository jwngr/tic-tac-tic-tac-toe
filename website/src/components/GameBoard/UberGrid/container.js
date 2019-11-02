import {connect} from 'react-redux';

import {setErrorMessage} from '../../../actions';

import UberGrid from './index';

const mapStateToProps = ({loggedInUser, currentGame}) => ({loggedInUser, currentGame});

const mapDispatchToProps = (dispatch) => {
  return {
    setErrorMessage: (errorMessage) => {
      dispatch(setErrorMessage(errorMessage));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UberGrid);
