import {connect} from 'react-redux';

import {setErrorMessage} from '../../actions';

import LogoutButton from './index';

const mapStateToProps = ({loggedInUser, initialAuthStateFetched}) => ({
  loggedInUser,
  initialAuthStateFetched,
});

const mapDispatchToProps = (dispatch) => {
  return {
    setErrorMessage: (errorMessage) => {
      dispatch(setErrorMessage(errorMessage));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LogoutButton);
