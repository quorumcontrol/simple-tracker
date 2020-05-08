import React from 'react';
import { theme, ThemeProvider, CSSReset, Flex, Spinner, Text } from "@chakra-ui/core";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
} from "react-router-dom";
import { Index } from './pages';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { DonatePage } from './pages/donate';
import { DonationThanksPage } from './pages/donationThanks';
import { DonationStatusPage } from './pages/donationStatus';
import { ObjectPage, LocationWidget } from './pages/object';
import './store'; // for side effects only
import { ApolloProvider, useQuery } from '@apollo/client';
import { client } from './store/index';
import { CURRENT_USER } from './store/queries';
import { SummaryPage } from './pages/summary';
import { PickUpsPage } from './pages/pickups';

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function AuthenticatedRoute({ children, ...rest }: any) {
    const query = useQuery(CURRENT_USER);
    const loading = query.loading
    const error = query.error

    let user: any
    if (!loading && !error) {
        user = query.data.me
    }

    if (error) {
        return (
            <Flex align="center" justify="center" h="100%">
                <Text ml="1rem">Error: {error}</Text>
            </Flex>
        )
    }

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
                (user && user.loggedIn) ? (
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
            <ApolloProvider client={client}>
                <Router>
                    {process.env.NODE_ENV === 'production' && <Route path="/" render={({ location }) => {
                        (window as any).gtag('config', 'UA-165951313-1', {
                            'page_title': document.title,
                            'page_location': window.location.href,
                            'page_path': location.pathname
                        });

                        return null;
                    }} /> }
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
                        <AuthenticatedRoute path="/summary">
                            <SummaryPage />
                        </AuthenticatedRoute>
                        <AuthenticatedRoute path="/pickups">
                            <PickUpsPage />
                        </AuthenticatedRoute>
                        <Route path="/donate">
                            <DonatePage />
                        </Route>
                        <Route path="/donation/:trackableId/thanks">
                            <DonationThanksPage />
                        </Route>
                        <Route path="/donation/:trackableId">
                            <DonationStatusPage />
                        </Route>
                        <Route path="/">
                            <Index />
                        </Route>
                    </Switch>
                </Router>
            </ApolloProvider>
        </ThemeProvider>
    );
}

export default App;
