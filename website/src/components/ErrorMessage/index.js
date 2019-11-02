import React from 'react';

import {ErrorMessageWrapper} from './index.styles';

export default ({errorMessage}) => {
  if (errorMessage === null) {
    return null;
  }

  return <ErrorMessageWrapper>{errorMessage}</ErrorMessageWrapper>;
};
