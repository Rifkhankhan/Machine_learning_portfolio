import { useLocation, Link } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Text,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Collapse,
  VStack,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

const Navbar = () => {
  const location = useLocation();
  const { isOpen, onToggle } = useDisclosure();

  const getLinkStyle = (path) => ({
    color: location.pathname === path ? "white" : "gray.200",
    fontWeight: location.pathname === path ? "bold" : "normal",
    textDecoration: "none",
    transition: "color 0.3s ease, transform 0.3s ease",
    _hover: {
      color: "white",
      transform: "scale(1.1)",
    },
  });

  return (
    <Box
      px={6}
      py={4}
      borderRadius="md"
      bgGradient="linear(to-r, blue.600, teal.600)"
      boxShadow="lg"
      position="sticky"
      top={0}
      zIndex={1000}
      width="full"
      color="white"
    >
      <Container maxW="container.xl">
        <Flex
          h="16"
          alignItems="center"
          justifyContent="space-between"
          position="relative"
        >
          {/* Left side */}
          <Flex
            alignItems="center"
            gap={3}
            display={{ base: "flex", md: "flex" }}
            flex="1"
          >
            <Link to="/" style={getLinkStyle("/")}>
              <img src="/react.png" alt="React logo" width={40} height={40} />
            </Link>
            <Text
              as={Link}
              to="/"
              fontSize="lg"
              fontWeight="bold"
              color="white"
              _hover={{ textDecoration: "underline" }}
            >
              Muhammed Rifkhan
            </Text>
          </Flex>

          {/* Mobile Menu Button */}
          <IconButton
            aria-label="Toggle Navigation"
            icon={isOpen ? <CloseIcon fontSize={"small"} /> : <HamburgerIcon />}
            variant="solid"
            colorScheme="orange" // Use a visible color scheme
            bg="blue.500" // Custom background color for better visibility
            color="white"
            display={{ base: "flex", md: "none" }}
            onClick={onToggle}
            position="absolute"
            right={0}
            top={4}
            _hover={{
              bg: "orange.500", // Darker shade on hover
              transform: "scale(1.1)", // Slightly enlarge on hover
            }}
          />

          {/* Right side */}
          <Flex
            gap={6}
            alignItems="center"
            display={{ base: "none", md: "flex" }}
          >
            <Text as={Link} to="/" style={getLinkStyle("/")}>
              Models
            </Text>

            <Text as={Link} to="/about" style={getLinkStyle("/about")}>
              About
            </Text>

            <Text as={Link} to="/contact" style={getLinkStyle("/contact")}>
              Contact
            </Text>
          </Flex>
        </Flex>

        {/* Mobile Menu */}
        <Collapse in={isOpen}>
          <VStack
            spacing={4}
            align="start"
            mt={4}
            display={{ base: "flex", md: "none" }}
          >
            <Text as={Link} to="/" style={getLinkStyle("/")}>
              Models
            </Text>

            <Text as={Link} to="/about" style={getLinkStyle("/about")}>
              About
            </Text>

            <Text as={Link} to="/contact" style={getLinkStyle("/contact")}>
              Contact
            </Text>
          </VStack>
        </Collapse>
      </Container>
    </Box>
  );
};

export default Navbar;
