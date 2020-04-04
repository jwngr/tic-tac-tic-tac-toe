import {connect} from 'react-redux';

import Stats from './index';

const mapStateToProps = ({currentGame, numSecondsUntilNextMove}) => ({
  currentGame,
  numSecondsUntilNextMove,
});

export default connect(mapStateToProps)(Stats);
