import React from 'react';
import { theme, ThemeProvider, CSSReset, Flex, Spinner, Text} from "@chakra-ui/core";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { useAmbientUser, AppUser } from 'ambient-react';
import { Index } from './trackable';
import {LoginPage} from './login/login'
import {RegisterPage} from './login/register'
import { TrackablePage } from './trackable/trackable';
import { Provider } from 'react-redux'
import rootReducer from './reducers'
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: rootReducer
})

export const userNamespace = 'local-only-tracker'

AppUser.setUserNamespace(userNamespace)

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function AuthenticatedRoute({ children, ...rest }: any) {

  const { loading, user } = useAmbientUser()

  if (loading) {
    return (
      <Flex align="center" justify="center" h="100%">
        <Spinner />
        <Text ml="1rem">Loading up Tupelo</Text>
      </Flex>
    )
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user ? (
          children
        ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location }
              }}
            />
          )
      }
    />
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CSSReset />
      <Provider store={store}>
      <Router>
          <Switch>
            <Route path="/login">
              <LoginPage />
            </Route>
            <Route path="/register">
              <RegisterPage />
            </Route>
            <Route path="/trackables/:trackableId">
              <TrackablePage />
            </Route>
            <AuthenticatedRoute path="/">
              <Index />
            </AuthenticatedRoute>
          </Switch>
      </Router>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
