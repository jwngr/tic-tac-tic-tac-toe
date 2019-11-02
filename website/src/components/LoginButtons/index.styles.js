import styled from 'styled-components';

export const LoginButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 650px;
  margin: 0 auto 30px auto;
  text-align: center;
`;

const LoginButton = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px 0;
  border: solid 5px ${({theme}) => theme.colors.black};

  &:hover {
    background: ${({theme}) => theme.colors.gray};
  }

  img {
    padding: 4px;
    width: 34px;
    height: 34px;
    margin-right: 6px;
  }

  p {
    margin: 4px 0 0 0;
    font-family: 'Norwester';
    font-size: 30px;
  }
`;

export const GitHubLoginButton = styled(LoginButton)`
  margin-right: 20px;
`;

export const TwitterLoginButton = styled(LoginButton)`
  margin-left: 20px;
`;

export const ErrorMessage = styled.p`
  width: 650px;
  margin: -10px auto 0 auto;
  text-align: center;
  color: ${({theme}) => theme.colors.red};
  font-family: 'Clear Sans';
`;
