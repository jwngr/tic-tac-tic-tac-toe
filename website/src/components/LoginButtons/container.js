import {connect} from 'react-redux';

import LogoutButton from './index';

const mapStateToProps = ({loggedInUser, initialAuthStateFetched}) => ({
  loggedInUser,
  initialAuthStateFetched,
});

export default connect(mapStateToProps)(LogoutButton);
