import {connect} from 'react-redux';

import GameMessage from './index';

const mapStateToProps = ({currentGame, loggedInUser}) => ({currentGame, loggedInUser});

export default connect(mapStateToProps)(GameMessage);
