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
import Swal from "sweetalert2";
import { BASE_URL } from "../App";

const View = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [model, setModel] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
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
            initialFormData[feature.name] = "";
            break;
          case "number":
            initialFormData[feature.name] = 0;
            break;
          case "boolean":
            initialFormData[feature.name] = false;
            break;
          default:
            initialFormData[feature.name] = "";
        }
      }
    });
    setFormData(initialFormData);
  };

  // Validation Logic
  const validateForm = () => {
    const errors = {};
    model.features
      .filter((feature) => feature.calculate)
      .forEach((feature) => {
        if (feature.required && !formData[feature.name]) {
          errors[feature.name] = `${feature.name} is required`;
        } else if (
          feature.datatype === "number" &&
          isNaN(formData[feature.name])
        ) {
          errors[feature.name] = `${feature.name} must be a number`;
        }
      });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation error.",
        description: "Please fix the errors before submitting.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    // Prepare form data
    const submissionData = {
      formData,
      modelId: model?.id,
    };

    try {
      const response = await fetch(`${BASE_URL}/models/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();

        console.log(result?.prediction);

        // Display an alert with SweetAlert2
        onClose();
        Swal.fire({
          title: "Prediction result!",
          text:
            result?.prediction === 0
              ? "No"
              : result?.prediction === 1
              ? "Yes"
              : result?.prediction,
          icon: "success",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error Prediction.",
          description: error.error || "An error occurred while Predicting.",
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      toast({
        title: "Network error.",
        description: "Failed to connect to the server.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
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
          <Heading as="h1" size="xl" textAlign="center">
            {model?.name}
          </Heading>
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Model Overview
            </Heading>
            <Text fontSize="md">
              {model?.description || "No description available"}
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Model Objectives
            </Heading>
            <Text fontSize="md">
              {model?.objectives || "No description available"}
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              About Dataset
            </Heading>
            <Text fontSize="md">{model?.about_dataset}</Text>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Dataset Features
            </Heading>
            <List spacing={3}>
              {model?.features?.map((feature, index) => (
                <ListItem key={index}>
                  <strong>{feature.name}:</strong> {feature.desc}
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Dataset
            </Heading>
            <Text fontSize="md">{model?.dataset}</Text>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Data Cleaning Process
            </Heading>
            <Text fontSize="md">{model?.data_cleaning}</Text>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Feature Creation
            </Heading>
            <Text fontSize="md">{model?.data_cleaning}</Text>
          </Box>

          {model?.heatmap_image && (
            <Box mb={4}>
              <Heading as="h2" size="lg" mb={4}>
                Visualization Image
              </Heading>

              <Image
                src={`${BASE_URL}/heatmaps/${model.heatmap_image}`}
                alt="Visualization"
                borderRadius="md"
                boxSize="full"
                objectFit="cover"
              />
            </Box>
          )}

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
                        <FormControl
                          id={feature.name}
                          key={index}
                          isInvalid={formErrors[feature.name]}
                        >
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
                          {formErrors[feature.name] && (
                            <Text color="red.500">
                              {formErrors[feature.name]}
                            </Text>
                          )}
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
