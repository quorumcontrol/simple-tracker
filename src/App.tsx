import React from 'react';
import { theme, ThemeProvider, CSSReset, Flex, Spinner, Text} from "@chakra-ui/core";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { useAmbientUser, AppUser } from 'ambient-react';
import { Index } from './pages';
import {LoginPage} from './pages/login'
import {RegisterPage} from './pages/register'
import { ObjectPage, LocationWidget } from './pages/object';
import './store'; // for side effects only


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
      <Router>
          <Switch>
            <Route path="/login">
              <LoginPage />
            </Route>
            <Route path="/register">
              <RegisterPage />
            </Route>
            <AuthenticatedRoute path="/objects/:objectId">
              <ObjectPage />
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/">
              <Index />
            </AuthenticatedRoute>
          </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;
