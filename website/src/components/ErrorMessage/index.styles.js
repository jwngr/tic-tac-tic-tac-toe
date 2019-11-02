import styled from 'styled-components';

export const ErrorMessageWrapper = styled.div`
  font-family: 'Clear Sans';
  text-align: center;
  margin-bottom: 30px;
  font-size: 30px;
  color: ${({theme}) => theme.colors.red};
`;
