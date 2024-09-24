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
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { BASE_URL } from "../App";
import EditModal from "../components/EditModal";

const ViewCNN = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [model, setModel] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [formData, setFormData] = useState(new FormData());
  const [error, setError] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const toast = useToast();
  const { id } = useParams();
  const [modelId, setModelId] = useState(id); // Assuming there's a model selection
  const [csvData, setCsvData] = useState([]);
  console.log(error);

  useEffect(() => {
    const getModel = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/cnn/${id}`);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate form before submission
    if (!formData.get("image")) {
      setError("Image file is required.");
      return;
    }
    if (!modelId) {
      setError("Model ID is required.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/cnn/predict`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Prediction result:", result.prediction);
        // Handle the successful prediction result

        // Display an alert with SweetAlert2
        onClose();
        Swal.fire({
          title: "Prediction result!",
          html: `
        <strong>Predicted Class:</strong> ${result?.predicted_class}<br>
        <strong>Predicted Probability:</strong> ${result?.predicted_probability.toFixed(
          4
        )}
    `,
          icon: "success",
        });
      } else {
        console.error("Error:", result.error);
        setError(result.error); // Set error from the backend if any
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again later.");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    // Validate if file is an image
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(URL.createObjectURL(file)); // Set image URL for preview
      const formData = new FormData();
      formData.append("image", file); // Append image to FormData
      formData.append("modelId", modelId); // Append modelId if available
      setFormData(formData); // Set formData state
      setError(""); // Clear error
    } else {
      // Set error message if the selected file is not an image
      setError("Please select a valid image file.");
      setSelectedImage(null);
    }
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
          <Heading as="h1" size="xl" texstAlign="center">
            {model?.name}
          </Heading>

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
              Classifications
            </Heading>
            <Text fontSize="md">
              <strong>Classifications:</strong>{" "}
              {model?.result?.join(", ") || "N/A"}
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
              <ModalHeader>Upload Your Image</ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <FormControl id="image" isInvalid={formErrors.image}>
                      <FormLabel>Image Upload</FormLabel>
                      <Input
                        type="file"
                        accept="image/*" // Allows only image files
                        onChange={handleImageChange} // New function to handle image selection
                      />
                      {error && <Text color="red.500">{error}</Text>}
                    </FormControl>

                    {/* Image Preview */}
                    {selectedImage && (
                      <Image
                        src={selectedImage}
                        alt="Selected Image Preview"
                        boxSize="200px"
                        objectFit="cover"
                        mt={4}
                      />
                    )}
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

export default ViewCNN;
