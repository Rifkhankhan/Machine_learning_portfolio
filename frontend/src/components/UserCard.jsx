import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  IconButton,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../App";

const UserCard = ({ model, setModels }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const handleDeleteModel = async (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      const res = await fetch(`${BASE_URL}/models/${model.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      setModels((prevModel) => prevModel.filter((u) => u.id !== model.id));
      toast({
        status: "success",
        title: "Success",
        description: "Model deleted successfully.",
        duration: 2000,
        position: "top-center",
      });
    } catch (error) {
      toast({
        title: "An error occurred",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-center",
      });
    }
  };

  const handleCardClick = () => {
    navigate(`/model/${model.id}`);
  };

  return (
    <Card
      maxW="md"
      borderRadius="md"
      overflow="hidden"
      boxShadow="lg"
      bg={useColorModeValue("white", "gray.600")}
      transition="transform 0.2s"
      _hover={{
        transform: "scale(1.03)",
        boxShadow: "xl",
      }}
      cursor="pointer"
      onClick={handleCardClick}
    >
      <CardHeader
        bg={useColorModeValue("gray.100", "gray.700")}
        px={4}
        py={2}
        borderBottomWidth={1}
        borderBottomColor={useColorModeValue("gray.200", "gray.600")}
      >
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="md">{model.name}</Heading>
            <Text fontSize="sm" color="gray.500">
              {model.createdAt}
            </Text>
          </Box>
          <IconButton
            icon={<BiTrash />}
            aria-label="Delete Model"
            colorScheme="red"
            onClick={handleDeleteModel} // Call the delete function
            size="sm"
            isRound
          />
        </Flex>
      </CardHeader>

      <CardBody>
        <Text
          mb={4}
          noOfLines={5}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="normal"
          maxH="6.4em"
        >
          {model.description}
        </Text>
      </CardBody>
    </Card>
  );
};

export default UserCard;
