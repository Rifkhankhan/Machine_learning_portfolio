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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Select,
  Checkbox,
  useDisclosure,
  CardFooter,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

import { BiTrash, BiEdit } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_URL } from "../App";

const UserCard = ({ model, setModels }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: passwordisOpen,
    onOpen: passwordonOpen,
    onClose: passwordonClose,
  } = useDisclosure();
  const {
    isOpen: deletepasswordisOpen,
    onOpen: deletepasswordonOpen,
    onClose: deletepasswordonClose,
  } = useDisclosure();
  const [editedModel, setEditedModel] = useState({
    id: model?.id,
    name: model?.name,
    description: model?.description,
    filename: model?.filename,
    encodingfile: model?.encodingfile,
    scalerfile: model?.scalerfile,
    about_dataset: model?.about_dataset,
    best_algorithm: model?.best_algorithm,
    heatmap_image: model?.heatmap_image,
    features: [...model?.features],
    algorithm_used: [...model?.algorithm_used],
    model_type: model?.model_type,
    source_link: model?.source_link,
    password: "",
  }); // State to hold the edited model

  // Handle input changes in the modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedModel((prevModel) => ({
      ...prevModel,
      [name]: value,
    }));
  };

  // Handle changes to the feature input fields
  const handleFeatureChange = (index, e, field) => {
    const updatedFeatures = [...editedModel.features];
    if (field === "calculate") {
      updatedFeatures[index][field] = e.target.checked;
    } else {
      updatedFeatures[index][field] = e.target.value;
    }
    setEditedModel({ ...editedModel, features: updatedFeatures });
  };

  // Fix for handleAddFeature
  const handleAddFeature = () => {
    setEditedModel({
      ...editedModel,
      features: [
        ...editedModel.features, // Fix from `newModel.features` to `editedModel.features`
        { name: "", datatype: "", desc: "", calculate: false },
      ],
    });
  };
  // Handle removing a feature
  const handleRemoveFeature = (index) => {
    const updatedFeatures = [...editedModel.features];
    updatedFeatures.splice(index, 1);
    setEditedModel({ ...editedModel, features: updatedFeatures });
  };

  const handleAddField = (field) => {
    setEditedModel({ ...editedModel, [field]: [...editedModel[field], ""] });
  };

  const handleRemoveField = (index, field) => {
    const values = [...editedModel[field]];
    values.splice(index, 1);
    setEditedModel({ ...editedModel, [field]: values });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setEditedModel((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    }
  };

  // Handle save changes
  const formatTheDatas = async () => {
    try {
      // e.stopPropagation(); // Prevent triggering card click
      passwordonOpen(); // Open the modal
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

  const handleSaveChanges = async () => {
    try {
      const formData = new FormData();

      // Manually serialize complex data (e.g., arrays/objects to JSON)
      const serializedModel = { ...editedModel };
      serializedModel.features = JSON.stringify(editedModel.features); // Convert features to JSON string
      serializedModel.algorithm_used = JSON.stringify(
        editedModel.algorithm_used
      ); // Convert algorithm_used to JSON string

      // Append serialized data to formData
      Object.keys(serializedModel).forEach((key) => {
        formData.append(key, serializedModel[key]);
      });

      const res = await fetch(`${BASE_URL}/models/${model.id}`, {
        method: "PATCH",

        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      // Update the models list after saving
      setModels((prevModels) =>
        prevModels.map((m) => (m.id === model.id ? editedModel : m))
      );
      toast({
        status: "success",
        title: "Success",
        description: "Model updated successfully.",
        duration: 2000,
        position: "top-center",
      });
      passwordonClose();
      onClose();
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

  const deletePasswordModelHandler = async (e) => {
    e.stopPropagation();

    deletepasswordonOpen();
    if (editedModel.password !== "") {
      handleDeleteModel();
    }
  };

  const handleDeleteModel = async () => {
    try {
      const formData = new FormData();
      formData.append("password", editedModel.password);
      const res = await fetch(`${BASE_URL}/models/${model.id}`, {
        method: "DELETE",
        body: formData,
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

  // Suggested modification for handleArrayChange to ensure immutability
  const handleArrayChange = (index, e, field) => {
    const updatedArray = editedModel[field].map((item, i) =>
      i === index ? e.target.value : item
    );
    setEditedModel({ ...editedModel, [field]: updatedArray });
  };

  return (
    <>
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
            <Flex gap={2}>
              <IconButton
                icon={<BiEdit />}
                aria-label="Edit Model"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering card click
                  onOpen(); // Open the modal
                }}
                size="sm"
                isRound
              />
              <IconButton
                icon={<BiTrash />}
                aria-label="Delete Model"
                colorScheme="red"
                onClick={deletePasswordModelHandler}
                size="sm"
                isRound
              />
            </Flex>
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

        <CardFooter
          bg={useColorModeValue("gray.100", "gray.700")}
          px={4}
          py={2}
          borderTopWidth={1}
          borderTopColor={useColorModeValue("gray.200", "gray.600")}
        >
          <Text fontSize="sm" color="gray.500">
            Best Algorithm: {model?.best_algorithm}
          </Text>
        </CardFooter>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={editedModel.name}
                  onChange={handleInputChange}
                  placeholder="Enter model name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={editedModel.description}
                  onChange={handleInputChange}
                  placeholder="Enter a brief description"
                />
              </FormControl>

              <FormControl>
                <FormLabel>About Dataset</FormLabel>
                <Textarea
                  name="about_dataset"
                  value={editedModel.about_dataset}
                  onChange={handleInputChange}
                  placeholder="Enter information about the dataset"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Need to change or upload the Model File then upload (.pkl)
                </FormLabel>
                <Input
                  type="file"
                  name="filename"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.filename &&
                typeof editedModel.filename === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>Selected file: {editedModel.filename.name}</Text>
                ) : editedModel.filename &&
                  typeof editedModel.filename === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.filename}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>
                  Need to change or upload the encoding of categorical file then
                  upload(.pkl)
                </FormLabel>
                <Input
                  type="file"
                  name="encodingfile"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.encodingfile &&
                typeof editedModel.encodingfile === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.encodingfile.name}
                  </Text>
                ) : editedModel.encodingfile &&
                  typeof editedModel.encodingfile === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.encodingfile}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>
                  Need to change or upload the Feature Scalling file then
                  upload(.pkl)
                </FormLabel>
                <Input
                  type="file"
                  name="scalerfile"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.scalerfile &&
                typeof editedModel.scalerfile === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.scalerfile.name}
                  </Text>
                ) : editedModel.scalerfile &&
                  typeof editedModel.scalerfile === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.scalerfile}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Heatmap Image</FormLabel>
                <Input
                  type="file"
                  name="heatmap_image"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.heatmap_image &&
                typeof editedModel.heatmap_image === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.heatmap_image.name}
                  </Text>
                ) : editedModel.heatmap_image &&
                  typeof editedModel.heatmap_image === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.heatmap_image}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Features</FormLabel>
                {editedModel.features.map((feature, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      placeholder="Feature Name"
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(index, e, "name")}
                    />
                    <Input
                      placeholder="Data Type"
                      value={feature.datatype}
                      onChange={(e) =>
                        handleFeatureChange(index, e, "datatype")
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={feature.desc}
                      onChange={(e) => handleFeatureChange(index, e, "desc")}
                    />
                    <Checkbox
                      isChecked={feature.calculate}
                      onChange={(e) =>
                        handleFeatureChange(index, e, "calculate")
                      }
                    >
                      Calculate Feature
                    </Checkbox>
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={editedModel.features.length === 1}
                    />
                    {index === editedModel.features.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={handleAddFeature}
                      />
                    )}
                  </Stack>
                ))}
              </FormControl>

              <FormControl>
                <FormLabel>Algorithm Used</FormLabel>
                {editedModel.algorithm_used.map((algo, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      value={algo}
                      onChange={(e) =>
                        handleArrayChange(index, e, "algorithm_used")
                      }
                      placeholder={`Algorithm ${index + 1}`}
                    />
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveField(index, "algorithm_used")}
                      disabled={editedModel.algorithm_used.length === 1}
                    />
                    {index === editedModel.algorithm_used.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={() => handleAddField("algorithm_used")}
                      />
                    )}
                  </Stack>
                ))}
              </FormControl>

              <FormControl>
                <FormLabel>Model Type</FormLabel>
                <Select
                  name="model_type"
                  value={editedModel.model_type}
                  onChange={handleInputChange}
                  placeholder="Select model type"
                >
                  <option value="classification">Classification</option>
                  <option value="regression">Regression</option>
                  <option value="clustering">Clustering</option>
                  <option value="dimensionality_reduction">
                    Dimensionality Reduction
                  </option>
                  <option value="time_series">Time Series</option>
                  <option value="natural_language_processing">
                    Natural Language Processing
                  </option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Source Link</FormLabel>
                <Input
                  name="source_link"
                  value={editedModel.source_link}
                  onChange={handleInputChange}
                  placeholder="Enter source link"
                />
              </FormControl>
              {/* Repeat for other fields like dataset, algorithms, etc. */}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={formatTheDatas}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* password Modal */}
      <Modal isOpen={passwordisOpen} onClose={passwordonClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  required
                  name="password"
                  value={editedModel.password}
                  onChange={handleInputChange}
                  placeholder="Enter the password"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={passwordonClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveChanges}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* delete Modal */}
      <Modal
        isOpen={deletepasswordisOpen}
        onClose={deletepasswordonClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  required
                  name="password"
                  value={editedModel.password}
                  onChange={handleInputChange}
                  placeholder="Enter the password"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={deletepasswordonClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={deletePasswordModelHandler}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserCard;
