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

const UserCard = ({ model, setModels }) => {
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
    description: model?.description,
    objectives: model?.objectives,
    dataset: model?.dataset,
    data_cleaning: model?.data_cleaning,
    feature_creation: model?.feature_creation,
    cross_validation: model?.cross_validation,
    hyperparameter: model?.hyperparameter,
    matrices: model?.matrices,
    confusion_matrices: model?.confusion_matrices,
    final_confusion_matrices: model?.final_confusion_matrices,
    final_matrices: model?.final_matrices,
    result: model?.result,
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
    if (name === "result") {
      value = editedModel.features[value];
    }
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

    const file = e.target.files[0];

    if (name === "dataset") {
      editedModel.result = [];
    }

    if (files && files[0]) {
      // Update the file in newModel state
      setEditedModel((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));

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
              setEditedModel((prevModel) => ({
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

      serializedModel.features = JSON.stringify(editedModel.features); // Convert features to JSON string

      serializedModel.algorithm_used = JSON.stringify(
        editedModel.algorithm_used
      );

      serializedModel.hyperparameter = JSON.stringify(
        editedModel.hyperparameter
      );

      serializedModel.feature_creation = JSON.stringify(
        editedModel.feature_creation
      );

      serializedModel.data_cleaning = JSON.stringify(editedModel.data_cleaning);
      serializedModel.result = JSON.stringify(editedModel.result);

      console.log(serializedModel);

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

  // for hyperparameter

  const handleParameterChange = (index, e, field) => {
    const updatedFeatures = [...editedModel.hyperparameter];
    updatedFeatures[index][field] = e.target.value;

    setEditedModel({ ...editedModel, hyperparameter: updatedFeatures });
  };

  const handleRemoveParameter = (index) => {
    const updatedFeatures = [...editedModel.hyperparameter];
    updatedFeatures.splice(index, 1);
    setEditedModel({ ...editedModel, hyperparameter: updatedFeatures });
  };

  const handleAddParameter = () => {
    setEditedModel({
      ...editedModel,
      hyperparameter: [...editedModel.hyperparameter, { name: "", value: "" }],
    });
  };

  // data cleaning
  // Handle checkbox changes
  const handleCheckboxChange = (values) => {
    // Update the model state with the selected values
    setEditedModel((prevModel) => ({
      ...prevModel,
      data_cleaning: values,
    }));
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
                <FormLabel>Overview</FormLabel>
                <Textarea
                  name="description"
                  value={editedModel.description}
                  onChange={handleInputChange}
                  placeholder="Enter a brief Overview"
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
                <FormLabel>About Dataset</FormLabel>
                <Textarea
                  name="about_dataset"
                  value={editedModel.about_dataset}
                  onChange={handleInputChange}
                  placeholder="Enter information about the dataset"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Dateset File(.csv)</FormLabel>
                <Input
                  type="file"
                  name="dataset"
                  onChange={handleFileChange}
                  accept=".csv"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.dataset &&
                typeof editedModel.dataset === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>Selected file: {editedModel.dataset.name}</Text>
                ) : editedModel.dataset &&
                  typeof editedModel.dataset === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.dataset}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl as="fieldset">
                <FormLabel as="legend">Data Cleaning Operations</FormLabel>
                <CheckboxGroup
                  value={editedModel.data_cleaning}
                  onChange={handleCheckboxChange}
                >
                  <Stack spacing={2} direction="column">
                    <Checkbox value="remove_duplicates">
                      Remove Duplicates
                    </Checkbox>
                    <Checkbox value="handle_missing_values">
                      Handle Missing Values
                    </Checkbox>
                    <Checkbox value="normalize">Normalize</Checkbox>
                    <Checkbox value="standardize">Standardize</Checkbox>
                    <Checkbox value="encode_categorical">
                      Encode Categorical Variables
                    </Checkbox>
                    <Checkbox value="outlier_removal">Outlier Removal</Checkbox>
                    <Checkbox value="scale_features">Scale Features</Checkbox>
                  </Stack>
                </CheckboxGroup>
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
                <FormLabel>Visual Image</FormLabel>
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

              {editedModel?.model_type.toLowerCase() === "classification" && (
                <FormControl>
                  <FormLabel>Final Result</FormLabel>
                  <Select
                    name="result"
                    value={editedModel?.features.findIndex(
                      (algo) => algo.name === editedModel.result.name
                    )}
                    onChange={handleInputChange}
                    disabled={datasetFeatures?.length === 0}
                  >
                    <option value="" disabled>
                      Select the result feature
                    </option>
                    {editedModel?.features?.map((algo, index) => (
                      <option key={index} value={index}>
                        {algo.name} - {algo.desc}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl>
                <FormLabel>Cross Validation</FormLabel>

                <Input
                  name="cross_validation"
                  value={editedModel.cross_validation}
                  onChange={handleInputChange}
                  placeholder="Enter information about the dataset"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Matrices</FormLabel>
                <Input
                  type="file"
                  name="matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.matrices &&
                typeof editedModel.matrices === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>Selected file: {editedModel.matrices.name}</Text>
                ) : editedModel.matrices &&
                  typeof editedModel.matrices === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>Existing file: {editedModel.matrices}</Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Confusion matrices</FormLabel>
                <Input
                  type="file"
                  name="confusion_matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.confusion_matrices &&
                typeof editedModel.confusion_matrices === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.confusion_matrices.name}
                  </Text>
                ) : editedModel.confusion_matrices &&
                  typeof editedModel.confusion_matrices === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>
                    Existing file: {editedModel.confusion_matrices}
                  </Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Hyperparameter</FormLabel>
                {editedModel.hyperparameter.map((feature, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      placeholder="Parameter Name"
                      value={feature.name}
                      onChange={(e) => handleParameterChange(index, e, "name")}
                    />
                    <Input
                      placeholder="Value"
                      value={feature.value}
                      onChange={(e) => handleParameterChange(index, e, "value")}
                    />

                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveParameter(index)}
                      disabled={editedModel.hyperparameter.length === 1}
                    />
                    {index === editedModel.hyperparameter.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={handleAddParameter}
                      />
                    )}
                  </Stack>
                ))}
              </FormControl>

              <FormControl>
                <FormLabel>
                  Confusion Matrices After using Hyperparameter
                </FormLabel>
                <Input
                  type="file"
                  name="final_confusion_matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.final_confusion_matrices &&
                typeof editedModel.final_confusion_matrices === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.final_confusion_matrices.name}
                  </Text>
                ) : editedModel.final_confusion_matrices &&
                  typeof editedModel.final_confusion_matrices === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>
                    Existing file: {editedModel.final_confusion_matrices}
                  </Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Matrices After using Hyperparameter</FormLabel>
                <Input
                  type="file"
                  name="final_matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
                {/* Check if there is an existing file in editedModel.filename */}
                {editedModel.final_matrices &&
                typeof editedModel.final_matrices === "object" ? (
                  // If the user selects a new file, display the new file name
                  <Text mt={2}>
                    Selected file: {editedModel.final_matrices.name}
                  </Text>
                ) : editedModel.final_matrices &&
                  typeof editedModel.final_matrices === "string" ? (
                  // If there is an existing file name (from previously uploaded data), show that
                  <Text mt={2}>
                    Existing file: {editedModel.final_matrices}
                  </Text>
                ) : (
                  // If no file has been uploaded yet
                  <Text mt={2}>No file chosen</Text>
                )}
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
