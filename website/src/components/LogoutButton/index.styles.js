import styled from 'styled-components';

export const LogoutButtonWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  border: solid 5px ${({theme}) => theme.colors.black};
  padding: 10px;
  cursor: pointer;
  font-family: 'Norwester';
  font-size: 14px;

  &:hover {
    background: ${({theme}) => theme.colors.gray};
  }
`;
