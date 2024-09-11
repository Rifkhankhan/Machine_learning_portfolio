import UserGrid from "./../components/UserGrid";
import { useEffect, useState } from "react";
import { USERS } from "./../dummy/dummy";
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

function Home() {
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
    description: "",
    objectives: "",
    dataset: "",
    filename: null,
    data_cleaning: [],
    feature_creation: [{ name: "", datatype: "", desc: "", calculate: false }],
    cross_validation: "",
    hyperparameter: [{ name: "", value: "" }],
    matrices: null,
    confusion_matrices: null,
    final_confusion_matrices: null,
    final_matrices: null,
    encodingfile: null,
    scalerfile: null,
    about_dataset: "",
    best_algorithm: "",
    heatmap_image: null,
    features: [{ name: "", datatype: "", desc: "", calculate: false }],
    algorithm_used: [""],
    model_type: "",
    result: [],
    source_link: "",
    password: "",
  });
  const toast = useToast();
  console.log(newModel);

  // Handle changes to the feature input fields
  const handleFeatureChange = (index, e, field) => {
    const updatedFeatures = [...newModel.features];
    if (field === "calculate") {
      updatedFeatures[index][field] = e.target.checked;
    } else {
      updatedFeatures[index][field] = e.target.value;
    }
    setNewModel({ ...newModel, features: updatedFeatures });
  };

  // Handle adding new features
  const handleAddFeature = () => {
    setNewModel({
      ...newModel,
      features: [
        ...newModel.features,
        { name: "", datatype: "", desc: "", calculate: false },
      ],
    });
  };

  // Handle removing a feature
  const handleRemoveFeature = (index) => {
    const updatedFeatures = [...newModel.features];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, features: updatedFeatures });
  };

  useEffect(() => {
    const getModels = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${BASE_URL}/models?page=${currentPage}&per_page=10`
        );

        if (response.ok) {
          const result = await response.json();

          console.log(result);

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

  useEffect(() => {}, [models]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "result") {
      value = datasetFeatures[value];
    }
    setNewModel({ ...newModel, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];

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
      formData.append("matrices", newModel.matrices);
      formData.append("confusion_matrices", newModel.confusion_matrices);
      formData.append("final_matrices", newModel.final_matrices);
      formData.append(
        "final_confusion_matrices",
        newModel.final_confusion_matrices
      );
      formData.append("scalerfile", newModel.scalerfile);
      formData.append("result", newModel.result);
      formData.append("encodingfile", newModel.encodingfile);
      formData.append("dataset", newModel.dataset);
      formData.append("heatmap_image", newModel.heatmap_image);
      formData.append("name", newModel.name);
      formData.append("objectives", newModel.objectives);
      formData.append("description", newModel.description);
      formData.append("about_dataset", newModel.about_dataset);
      formData.append("cross_validation", newModel.cross_validation);
      formData.append("best_algorithm", newModel.best_algorithm);
      formData.append("features", JSON.stringify(newModel.features)); // Features now include `calculate`
      formData.append(
        "hyperparameter",
        JSON.stringify(newModel.hyperparameter)
      );
      formData.append(
        "feature_creation",
        JSON.stringify(newModel.feature_creation)
      );
      formData.append(
        "algorithm_used",
        JSON.stringify(newModel.algorithm_used)
      );
      formData.append("model_type", newModel.model_type);
      formData.append("source_link", newModel.source_link);
      formData.append("password", newModel.password);

      console.log(newModel);

      try {
        const response = await fetch(`${BASE_URL}/models`, {
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

  const handleCheckboxChange = (values) => {
    // Update the model state with the selected values
    setNewModel((prevModel) => ({
      ...prevModel,
      data_cleaning: values,
    }));
  };

  // new features
  const handleCreatedFeatureChange = (index, e, field) => {
    const updatedFeatures = [...newModel.feature_creation];
    if (field === "calculate") {
      updatedFeatures[index][field] = e.target.checked;
    } else {
      updatedFeatures[index][field] = e.target.value;
    }
    setNewModel({ ...newModel, feature_creation: updatedFeatures });
  };

  const handleCreatedFeatureRemoveFeature = (index) => {
    const updatedFeatures = [...newModel.feature_creation];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, feature_creation: updatedFeatures });
  };

  const handleAddCreateFeature = () => {
    setNewModel({
      ...newModel,
      feature_creation: [
        ...newModel.feature_creation,
        { name: "", datatype: "", desc: "", calculate: false },
      ],
    });
  };

  // for hyperparameter

  const handleParameterChange = (index, e, field) => {
    const updatedFeatures = [...newModel.hyperparameter];
    updatedFeatures[index][field] = e.target.value;

    setNewModel({ ...newModel, hyperparameter: updatedFeatures });
  };

  const handleRemoveParameter = (index) => {
    const updatedFeatures = [...newModel.hyperparameter];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, hyperparameter: updatedFeatures });
  };

  const handleAddParameter = () => {
    setNewModel({
      ...newModel,
      hyperparameter: [...newModel.hyperparameter, { name: "", value: "" }],
    });
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
        + Add Model
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a New Model</ModalHeader>
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
                <FormLabel>Overview</FormLabel>
                <Textarea
                  name="description"
                  value={newModel.description}
                  onChange={handleInputChange}
                  placeholder="Enter a brief description"
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
                <FormLabel>About Dataset</FormLabel>
                <Textarea
                  name="about_dataset"
                  value={newModel.about_dataset}
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
              </FormControl>

              <FormControl as="fieldset">
                <FormLabel as="legend">Data Cleaning Operations</FormLabel>
                <CheckboxGroup
                  value={newModel.data_cleaning}
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
                <FormLabel>Model File(.pkl)</FormLabel>
                <Input
                  type="file"
                  name="filename"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  For this if you did encoding of categorical features(.pkl)
                </FormLabel>
                <Input
                  type="file"
                  name="encodingfile"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  For this if you did Feature Scalling to scale your numerical
                  features(.pkl)
                </FormLabel>
                <Input
                  type="file"
                  name="scalerfile"
                  onChange={handleFileChange}
                  accept=".pkl"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Heatmap Image</FormLabel>
                <Input
                  type="file"
                  name="heatmap_image"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Features</FormLabel>
                {newModel.features.map((feature, index) => (
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
                      disabled={newModel.features.length === 1}
                    />
                    {index === newModel.features.length - 1 && (
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
                <FormLabel>Model Type</FormLabel>
                <Select
                  name="model_type"
                  value={newModel.model_type}
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

              {newModel?.model_type.toLowerCase() === "classification" && (
                <FormControl>
                  <FormLabel>Final Result</FormLabel>
                  <Select
                    name="result"
                    value={datasetFeatures.findIndex(
                      (algo) => algo.name === newModel.result.name
                    )}
                    onChange={handleInputChange}
                    disabled={datasetFeatures.length === 0}
                  >
                    <option value="" disabled>
                      Select the result feature
                    </option>
                    {datasetFeatures.map((algo, index) => (
                      <option key={index} value={index}>
                        {algo.name} - {algo.desc}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl>
                <FormLabel>Created New Features</FormLabel>
                {newModel.feature_creation.map((feature, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      placeholder="Feature Name"
                      value={feature.name}
                      onChange={(e) =>
                        handleCreatedFeatureChange(index, e, "name")
                      }
                    />
                    <Input
                      placeholder="Data Type"
                      value={feature.datatype}
                      onChange={(e) =>
                        handleCreatedFeatureChange(index, e, "datatype")
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={feature.desc}
                      onChange={(e) =>
                        handleCreatedFeatureChange(index, e, "desc")
                      }
                    />
                    <Checkbox
                      isChecked={feature.calculate}
                      onChange={(e) =>
                        handleCreatedFeatureChange(index, e, "calculate")
                      }
                    >
                      Calculate Feature
                    </Checkbox>
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleCreatedFeatureRemoveFeature(index)}
                      disabled={newModel.feature_creation.length === 1}
                    />
                    {index === newModel.feature_creation.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={handleAddCreateFeature}
                      />
                    )}
                  </Stack>
                ))}
              </FormControl>

              <FormControl>
                <FormLabel>Algorithm Used</FormLabel>
                {newModel.algorithm_used.map((algo, index) => (
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
                      disabled={newModel.algorithm_used.length === 1}
                    />
                    {index === newModel.algorithm_used.length - 1 && (
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
                <FormLabel>Best Algorithm</FormLabel>
                <Select
                  name="best_algorithm"
                  value={newModel.best_algorithm}
                  onChange={handleInputChange}
                  placeholder="Select the best algorithm"
                  disabled={newModel.algorithm_used.length === 0}
                >
                  {newModel.algorithm_used.map((algo, index) => (
                    <option key={index} value={algo}>
                      {algo}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Cross Validation</FormLabel>

                <Input
                  name="cross_validation"
                  value={newModel.cross_validation}
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
              </FormControl>

              <FormControl>
                <FormLabel>Confusion matrices</FormLabel>
                <Input
                  type="file"
                  name="confusion_matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Hyperparameter</FormLabel>
                {newModel.hyperparameter.map((feature, index) => (
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
                      disabled={newModel.hyperparameter.length === 1}
                    />
                    {index === newModel.hyperparameter.length - 1 && (
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
              </FormControl>

              <FormControl>
                <FormLabel>Matrices After using Hyperparameter</FormLabel>
                <Input
                  type="file"
                  name="final_matrices"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg"
                />
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

      <UserGrid
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

export default Home;
