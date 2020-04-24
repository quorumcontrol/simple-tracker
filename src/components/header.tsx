import React from "react";
import { Box, Heading, Flex, Button } from "@chakra-ui/core";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { LOGOUT_USER, CURRENT_USER } from "../store/queries";

const Header = () => {
  const [show, setShow] = React.useState(false);
  const handleToggle = () => setShow(!show);

  const userQuery = useQuery(CURRENT_USER)
  const userLoading = userQuery.loading
  const userError = userQuery.error

  let user:any
  if (!userLoading && !userError) {
    user = userQuery.data.me
  }

  const [logout,] = useMutation(LOGOUT_USER)

  const handleLogout = (_evt:any) => {
    logout({variables: {did: 'current'}})
  }

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1.5rem"
      bg="teal.500"
      color="white"
    >
      <Flex align="center" mr={5}>
        <Heading as="h1" size="lg">
          <Link to="/">
            GivingChain
          </Link>
        </Heading>
      </Flex>

      <Box display={{ sm: "block", md: "none" }} onClick={handleToggle}>
        <svg
          fill="white"
          width="12px"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Menu</title>
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
        </svg>
      </Box>

      <Box
        display={{ sm: show ? "block" : "none", md: "flex" }}
        width={{ sm: "full", md: "auto" }}
        alignItems="center"
        flexGrow={1}
      >
      </Box>

      { !userLoading && !userError && user && user.loggedIn &&
      <Box
        display={{ sm: show ? "block" : "none", md: "block" }}
        mt={{ base: 4, md: 0 }}
      >
        <Button bg="transparent" border="1px" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      }
    </Flex>
  );
};

export default Header;