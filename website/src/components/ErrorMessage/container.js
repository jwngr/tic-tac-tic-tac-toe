import {connect} from 'react-redux';

import ErrorMessage from './index';

const mapStateToProps = ({errorMessage}) => ({errorMessage});

export default connect(mapStateToProps)(ErrorMessage);
