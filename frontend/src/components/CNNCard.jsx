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
  CheckboxGroup,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import Papa from "papaparse";

import { BiTrash, BiEdit } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BASE_URL } from "../App";

const CNNCard = ({ model, setModels }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [datasetFeatures, setDatasetFeatures] = useState();

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
    objectives: model?.objectives,
    filename: model?.filename,
    result: [...model?.result],
    source_link: model?.source_link,
    password: "",
  }); // State to hold the edited model

  useEffect(() => {
    // console.log(model);
  }, []);

  // Analyze each column and determine data type, description, and set calculate to false
  const analyzeColumns = (headings, rows) => {
    return headings.map((heading, colIndex) => {
      const colData = rows.map((row) => row[colIndex]); // Get data for each column
      const datatype = detectDataType(colData); // Detect data type (int, float, string)
      const desc = generateDescription(colData, datatype); // Generate description based on data type

      return {
        name: heading,
        datatype,
        desc,
        calculate: false, // Default value for calculate
      };
    });
  };

  // Detect the data type for a column (int, float, or string)
  const detectDataType = (colData) => {
    let isInt = true;
    let isFloat = true;

    for (const value of colData) {
      if (!isNaN(value)) {
        if (value.includes(".")) {
          isInt = false;
        }
      } else {
        isInt = false;
        isFloat = false;
        break;
      }
    }

    if (isInt) return "int";
    if (isFloat) return "float";
    return "string";
  };

  // Generate description based on data type
  const generateDescription = (colData, dataType) => {
    if (dataType === "int" || dataType === "float") {
      return `Contains numerical data`;
    } else if (dataType === "string") {
      const uniqueValues = [...new Set(colData)];
      if (uniqueValues.length <= 10) {
        return `Categorical data with values: ${uniqueValues.join(", ")}`;
      } else {
        return `Contains string data`;
      }
    }
  };
  // Handle input changes in the modal
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    setEditedModel((prevModel) => ({
      ...prevModel,
      [name]: value,
    }));
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
    const { name } = e.target;
    const file = e.target.files[0];

    if (file) {
      // Update the file in newModel state
      setEditedModel({ ...editedModel, [name]: file });
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
      console.log(serializedModel);

      serializedModel.result = JSON.stringify(editedModel.result);

      console.log(serializedModel);

      // Append serialized data to formData
      Object.keys(serializedModel).forEach((key) => {
        formData.append(key, serializedModel[key]);
      });

      const res = await fetch(`${BASE_URL}/cnn/${model.id}`, {
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
      const res = await fetch(`${BASE_URL}/cnn/${model.id}`, {
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
    navigate(`/cnn/${model.id}`);
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
            {model.objectives}
          </Text>
        </CardBody>
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
                <FormLabel>Objective</FormLabel>
                <Textarea
                  name="objectives"
                  value={editedModel.objectives}
                  onChange={handleInputChange}
                  placeholder="Enter the  datasetFiles"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Need to change or upload the Model File then upload (.h5)
                </FormLabel>
                <Input
                  type="file"
                  name="filename"
                  onChange={handleFileChange}
                  accept=".h5,.hdf5"
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
                <FormLabel>Classification</FormLabel>
                {editedModel.result.map((algo, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      value={algo}
                      onChange={(e) => handleArrayChange(index, e, "result")}
                      placeholder={`Algorithm ${index + 1}`}
                    />
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveField(index, "result")}
                      disabled={editedModel.result.length === 1}
                    />
                    {index === editedModel.result.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={() => handleAddField("result")}
                      />
                    )}
                  </Stack>
                ))}
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

export default CNNCard;
