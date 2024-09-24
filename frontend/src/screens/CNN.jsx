import UserGrid from "../components/UserGrid";
import { useEffect, useState } from "react";
import { USERS } from "../dummy/dummy";
import Papa from "papaparse";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Textarea,
  Stack,
  IconButton,
  Select,
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

import { BASE_URL } from "../App";
import CNNGrid from "../components/CNNGrid";

function CNN() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: passwordisOpen,
    onOpen: passwordonOpen,
    onClose: passwordonClose,
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [models, setModels] = useState();
  const [datasetFeatures, setDatasetFeatures] = useState();
  const [newModel, setNewModel] = useState({
    name: "",
    objectives: "",
    filename: null,
    result: [""],
    source_link: "",
    password: "",
  });
  const toast = useToast();

  useEffect(() => {
    const getModels = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${BASE_URL}/cnn?page=${currentPage}&per_page=10`
        );

        if (response.ok) {
          const result = await response.json();

          console.log(result.models);

          setModels([...result.models]);

          setTotalPages(result.pagination.total_pages);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getModels();
  }, [setCurrentPage, currentPage]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    setNewModel({ ...newModel, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    console.log(file);

    if (file) {
      // Update the file in newModel state
      setNewModel({ ...newModel, [name]: file });

      // Check if the file is a CSV and then parse it
      if (file.type === "text/csv") {
        const reader = new FileReader();

        reader.onload = (event) => {
          Papa.parse(event.target.result, {
            complete: (result) => {
              const data = result.data;
              const csvHeadings = data[0]; // First row (headings)
              const allrows = data.slice(1); // Next 5 rows for analysis
              const features = analyzeColumns(csvHeadings, allrows);
              setDatasetFeatures(features);
              // Update the state with CSV headings and column analysis
              setNewModel((prevModel) => ({
                ...prevModel,
                features, // Data type and description for each column in the desired format
              }));
            },
            header: false,
          });
        };

        reader.readAsText(file);
      }
    }
  };

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

  // Handle save changes
  const formatTheDatas = async () => {
    try {
      // e.stopPropagation(); // Prevent triggering card click
      passwordonOpen(); // Open the modal

      console.log(newModel);
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

  const handleAddModel = async () => {
    if (newModel.filename) {
      const formData = new FormData();
      formData.append("filename", newModel.filename);

      formData.append("result", JSON.stringify(newModel.result));
      formData.append("name", newModel.name);
      formData.append("objectives", newModel.objectives);
      formData.append("source_link", newModel.source_link);
      formData.append("password", newModel.password);

      try {
        const response = await fetch(`${BASE_URL}/cnn`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setModels([...models, { ...result }]);
          toast({
            title: "Model added.",
            description: "Your new model has been added successfully.",
            status: "success",
            duration: 2000,
            isClosable: true,
            position: "top-right",
          });
          passwordonClose();
          onClose();
        } else {
          const error = await response.json();
          toast({
            title: "Error adding model.",
            description:
              error.error || "An error occurred while adding the model.",
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
    } else {
      toast({
        title: "File(s) missing.",
        description: "Please upload Model .pkl file",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleArrayChange = (index, e, field) => {
    const values = [...newModel[field]];
    values[index] = e.target.value;
    setNewModel({ ...newModel, [field]: values });
  };

  const handleAddField = (field) => {
    setNewModel({ ...newModel, [field]: [...newModel[field], ""] });
  };

  const handleRemoveField = (index, field) => {
    const values = [...newModel[field]];
    values.splice(index, 1);
    setNewModel({ ...newModel, [field]: values });
  };

  return (
    <Box>
      <Button
        position="fixed"
        bottom={6}
        right={6}
        zIndex={"1"}
        colorScheme="teal"
        size="lg"
        borderRadius="full"
        onClick={onOpen}
      >
        + Add CNN Model
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a New CNN Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={newModel.name}
                  onChange={handleInputChange}
                  placeholder="Enter model name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Objective</FormLabel>
                <Textarea
                  name="objectives"
                  value={newModel.objectives}
                  onChange={handleInputChange}
                  placeholder="Enter the  datasetFiles"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Model File(.h5)</FormLabel>
                <Input
                  type="file"
                  name="filename"
                  onChange={handleFileChange}
                  accept=".h5"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Classifications</FormLabel>
                {newModel.result.map((algo, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      value={algo}
                      onChange={(e) => handleArrayChange(index, e, "result")}
                      placeholder={`Classification ${index + 1}`}
                    />
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveField(index, "result")}
                      disabled={newModel.result.length === 1}
                    />
                    {index === newModel.result.length - 1 && (
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
                  value={newModel.source_link}
                  onChange={handleInputChange}
                  placeholder="Enter source link"
                />
              </FormControl>
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
                  value={newModel.password}
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
            <Button colorScheme="teal" onClick={handleAddModel}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <CNNGrid
        models={models}
        setModels={setModels}
        isLoading={isLoading}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </Box>
  );
}

export default CNN;
