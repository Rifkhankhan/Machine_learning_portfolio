import UserGrid from "./../components/UserGrid";
import { useEffect, useState } from "react";
import { USERS } from "./../dummy/dummy";
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
  const [newModel, setNewModel] = useState({
    name: "",
    description: "",
    objective: "",
    dataset: null,
    filename: null,
    data_cleaning: [],
    feature_creation: [{ name: "", datatype: "", desc: "", calculate: false }],
    encodingfile: null,
    scalerfile: null,
    cross_validation: "",
    about_dataset: "",
    best_algorithm: "",
    heatmap_image: null,
    features: [{ name: "", datatype: "", desc: "", calculate: false }],
    hyperparameter: [{ name: "", value: "" }],
    matrices: [
      { name: "Accuracy", value: "", type: "classification" },
      { name: "Precision", value: "", type: "classification" },
      { name: "Recall (Sensitivity)", value: "", type: "classification" },
      { name: "F1 Score", value: "", type: "classification" },
      {
        name: "Area Under the ROC Curve (AUC-ROC)",
        value: "",
        type: "classification",
      },
      {
        name: "Area Under the Precision-Recall Curve (AUC-PR)",
        value: "",
        type: "classification",
      },
      {
        name: "Matthews Correlation Coefficient (MCC)",
        value: "",
        type: "classification",
      },

      { name: "Mean Absolute Error (MAE)", value: "", type: "regression" },
      { name: "Mean Squared Error (MSE)", value: "", type: "regression" },
      { name: "Root Mean Squared Error (RMSE)", value: "", type: "regression" },
      {
        name: "R-squared (Coefficient of Determination)",
        value: "",
        type: "regression",
      },
      {
        name: "Mean Absolute Percentage Error (MAPE)",
        value: "",
        type: "regression",
      },

      { name: "Silhouette Score", value: "", type: "clustering" },
      { name: "Davies-Bouldin Index", value: "", type: "clustering" },
      { name: "Calinski-Harabasz Index", value: "", type: "clustering" },

      { name: "Mean Reciprocal Rank (MRR)", value: "", type: "ranking" },
      {
        name: "Normalized Discounted Cumulative Gain (NDCG)",
        value: "",
        type: "ranking",
      },
      { name: "Precision at k (P@k)", value: "", type: "ranking" },
    ],
    confusion_matrices: [
      {
        algorithm: "", // Example algorithm
        metrics: [
          { name: "TP", value: "" },
          { name: "TN", value: "" },
          { name: "FP", value: "" },
          { name: "FN", value: "" },
        ],
      },
    ],
    algorithm_used: [""],
    model_type: "",
    source_link: "",
    password: "",
  });

  console.log(newModel);

  const toast = useToast();

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

  const handleCreatedFeatureChange = (index, e, field) => {
    const updatedFeatures = [...newModel.feature_creation];
    if (field === "calculate") {
      updatedFeatures[index][field] = e.target.checked;
    } else {
      updatedFeatures[index][field] = e.target.value;
    }
    setNewModel({ ...newModel, feature_creation: updatedFeatures });
  };

  const handleParameterChange = (index, e, field) => {
    const updatedFeatures = [...newModel.hyperparameter];

    setNewModel({ ...newModel, hyperparameter: updatedFeatures });
  };

  const handleMatricChange = (index, e, field) => {
    const updatedFeatures = [...newModel.matrices];

    setNewModel({ ...newModel, matrices: updatedFeatures });
  };

  // Handle adding new features

  const handleAddFeature = () => {
    setNewModel((prevModel) => ({
      ...prevModel,
      features: [
        ...prevModel.features,
        { name: "", datatype: "", desc: "", calculate: false },
      ],
      matrices: [
        ...prevModel.matrices,
        {
          algorithm: "",
          metrics: [{ name: "", value: "" }],
        },
      ],
    }));
  };

  const handleAddParameter = () => {
    setNewModel({
      ...newModel,
      hyperparameter: [...newModel.hyperparameter, { name: "", value: "" }],
    });
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

  const handleAddMatriceFeature = () => {
    setNewModel({
      ...newModel,
      matrices: [...newModel.matrices, { name: "", value: "", desc: "" }],
    });
  };

  // Handle removing a feature
  const handleRemoveFeature = (index) => {
    // Remove the feature at the specified index
    const updatedFeatures = [...newModel.features];
    updatedFeatures.splice(index, 1);

    // Remove the corresponding matrix entry
    const updatedMatrices = [...newModel.matrices];
    updatedMatrices.splice(index, 1);

    setNewModel({
      ...newModel,
      features: updatedFeatures,
      matrices: updatedMatrices,
    });
  };

  const handleRemoveParameter = (index) => {
    const updatedFeatures = [...newModel.hyperparameter];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, hyperparameter: updatedFeatures });
  };

  const handleCreatedFeatureRemoveFeature = (index) => {
    const updatedFeatures = [...newModel.feature_creation];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, feature_creation: updatedFeatures });
  };

  const handleRemoveMatrices = (index) => {
    const updatedFeatures = [...newModel.matrices];
    updatedFeatures.splice(index, 1);
    setNewModel({ ...newModel, matrices: updatedFeatures });
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
    const { name, value } = e.target;
    setNewModel({ ...newModel, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setNewModel({ ...newModel, [name]: e.target.files[0] });
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
      formData.append("scalerfile", newModel.scalerfile);
      formData.append("encodingfile", newModel.encodingfile);
      formData.append("heatmap_image", newModel.heatmap_image);
      formData.append("name", newModel.name);
      formData.append("description", newModel.description);
      formData.append("about_dataset", newModel.about_dataset);
      formData.append("best_algorithm", newModel.best_algorithm);
      formData.append("features", JSON.stringify(newModel.features)); // Features now include `calculate`
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

  // confusion matrices
  const handleConfusionMatricesInputChange = (
    algorithm,
    metricName,
    newValue
  ) => {
    setNewModel((prevModel) => ({
      ...prevModel,
      confusion_matrices: prevModel.confusion_matrices.map((item) =>
        item.algorithm === algorithm
          ? {
              ...item,
              metrics: item.metrics.map((metric) =>
                metric.name === metricName
                  ? { ...metric, value: newValue }
                  : metric
              ),
            }
          : item
      ),
    }));
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
                  name="description"
                  value={newModel.objective}
                  onChange={handleInputChange}
                  placeholder="Enter a brief description"
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
                <FormLabel>Confusion Matrix Metrics</FormLabel>
                {newModel.confusion_matrices.map((matrix) => (
                  <Stack key={matrix.algorithm} direction="row" align="center">
                    {/* <div key={matrix.algorithm}> */}
                    <FormLabel>{matrix.algorithm}</FormLabel>
                    {matrix.metrics.map((metric) => (
                      <FormControl key={metric.name}>
                        <FormLabel>{metric.name}</FormLabel>
                        <Input
                          type="number"
                          value={metric.value}
                          onChange={(e) =>
                            handleInputChange(
                              matrix.algorithm,
                              metric.name,
                              e.target.value
                            )
                          }
                        />
                      </FormControl>
                    ))}
                    {/* </div> */}
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
              {newModel.model_type && (
                <FormControl>
                  <FormLabel>Matrices</FormLabel>
                  {newModel.matrices
                    .filter(
                      (feature) =>
                        feature.type === newModel.model_type.toLowerCase()
                    )
                    .map((feature, index) => (
                      <Stack key={index} direction="row" align="center" mb={2}>
                        <Input
                          placeholder=""
                          value={feature.name}
                          onChange={(e) => handleMatricChange(index, e, "name")}
                        />
                        <Input
                          placeholder="Value"
                          value={feature.value}
                          onChange={(e) =>
                            handleMatricChange(index, e, "value")
                          }
                        />

                        <IconButton
                          icon={<MinusIcon />}
                          colorScheme="red"
                          onClick={() => handleRemoveMatrices(index)}
                          disabled={newModel.matrices.length === 1}
                        />
                        {index === newModel.matrices.length - 1 && (
                          <IconButton
                            icon={<AddIcon />}
                            colorScheme="teal"
                            onClick={handleAddMatriceFeature}
                          />
                        )}
                      </Stack>
                    ))}
                </FormControl>
              )}
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
