import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  List,
  ListItem,
  Stack,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  useToast,
  IconButton,
  Spinner,
  Flex,
  Image,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";

export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://127.0.0.1:5000/api" : "/api";

const View = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [model, setModel] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({});

  console.log(formData);

  console.log(model);

  const toast = useToast();
  const { id } = useParams();

  useEffect(() => {
    const getModel = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/models/${id}`);
        if (response.ok) {
          const result = await response.json();
          setModel(result);
          initializeFormData(result.features);
        }
      } catch (error) {
        console.error("Failed to fetch model:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getModel();
  }, [id]);

  const initializeFormData = (features) => {
    const initialFormData = {};

    features.forEach((feature) => {
      if (feature.calculate) {
        switch (feature.datatype) {
          case "string":
            initialFormData[feature.name] = ""; // Initialize with empty string
            break;
          case "number":
            initialFormData[feature.name] = 0; // Initialize with zero
            break;
          case "boolean":
            initialFormData[feature.name] = false; // Initialize with false
            break;
          default:
            initialFormData[feature.name] = ""; // Fallback to empty string if type is unknown
        }
      }
    });

    setFormData(initialFormData);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Implement form submission logic here
    toast({
      title: "Form submitted.",
      description: "Your data has been submitted successfully.",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top-center",
    });
    onClose(); // Close the modal after submission
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  return (
    <>
      {isLoading && (
        <Flex justifyContent={"center"} mt={4}>
          <Spinner size={"xl"} />
        </Flex>
      )}
      <Container maxW="container.md" py={8}>
        <Stack spacing={6}>
          {/* Header */}
          <Heading as="h1" size="xl" textAlign="center">
            {model?.name}
          </Heading>

          {/* About Dataset */}
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              About Dataset
            </Heading>
            <Text fontSize="md">{model?.about_dataset}</Text>
          </Box>

          {/* Algorithm Details */}
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Algorithm Details
            </Heading>
            <Text fontSize="md">
              <strong>Algorithm Used:</strong>{" "}
              {model?.algorithm_used?.join(", ") || "N/A"}
              <br />
              <strong>Best Algorithm:</strong> {model?.best_algorithm || "N/A"}
            </Text>
          </Box>

          {/* Model Description */}
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Model Description
            </Heading>
            <Text fontSize="md">
              {model?.description || "No description available"}
            </Text>
          </Box>

          {/* Dataset Features */}
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Dataset Features
            </Heading>
            <List spacing={3}>
              {model?.features?.map((feature, index) =>
                feature ? (
                  <ListItem key={index}>
                    <strong>{feature.name}:</strong> {feature.desc}
                  </ListItem>
                ) : null
              )}
            </List>
          </Box>

          {/* Visualization Image */}
          <Box mb={4}>
            <Heading as="h2" size="lg" mb={4}>
              Visualization Image
            </Heading>
            {model?.heatmap_image && (
              <Image
                src={`${BASE_URL}/heatmaps/${model.heatmap_image}`} // Construct URL for heatmap image
                alt="Visualization"
                borderRadius="md"
                boxSize="full"
                objectFit="cover"
              />
            )}
          </Box>

          {/* File Information */}
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              File Information
            </Heading>
            <Text fontSize="md">
              <strong>Filename:</strong>{" "}
              {model?.filename || "No file available"}
              <br />
              <strong>Model Type:</strong> {model?.model_type || "N/A"}
              <br />
              <strong>Source Link:</strong>{" "}
              <a
                href={model?.source_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {model?.source_link || "No source link"}
              </a>
            </Text>
          </Box>

          {/* Floating Button */}
          <IconButton
            aria-label="Add Model"
            icon={<AddIcon />}
            position="fixed"
            bottom={4}
            right={4}
            colorScheme="blue"
            borderRadius="full"
            boxShadow="lg"
            size="lg"
            fontSize="xl"
            onClick={onOpen}
          />

          {/* Modal */}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Submit Your Model</ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    {model?.features
                      ?.filter((feature) => feature.calculate)
                      .map((feature, index) => (
                        <FormControl id={feature.name} key={index} isRequired>
                          <FormLabel>{feature.name}</FormLabel>
                          <Input
                            placeholder={feature.desc}
                            type={
                              feature.datatype === "int"
                                ? "number"
                                : feature.datatype === "float"
                                ? "number"
                                : "text"
                            }
                            value={formData[feature.name] || ""}
                            onChange={handleChange}
                          />
                        </FormControl>
                      ))}
                  </Stack>
                </form>
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
                  Submit
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Stack>
      </Container>
    </>
  );
};

export default View;
