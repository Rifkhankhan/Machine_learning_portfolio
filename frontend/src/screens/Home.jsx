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
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://127.0.0.1:5000/api" : "/api";

function Home() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [models, setModels] = useState();
  const [newModel, setNewModel] = useState({
    name: "",
    description: "",
    filename: null,
    about_dataset: "",
    best_algorithm: "",
    heatmap_image: null,
    features: [{ name: "", datatype: "", desc: "", calculate: false }],
    algorithm_used: [""],
    model_type: "",
    source_link: "",
  });
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
    const { name, value } = e.target;
    setNewModel({ ...newModel, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setNewModel({ ...newModel, [name]: e.target.files[0] });
  };

  const handleAddModel = async () => {
    if (newModel.filename && newModel.heatmap_image) {
      const formData = new FormData();
      formData.append("filename", newModel.filename);
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
        description: "Please upload both the .pkl file and the heatmap image.",
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
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={newModel.description}
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
                <FormLabel>Model File(.pkl)</FormLabel>
                <Input
                  type="file"
                  name="filename"
                  onChange={handleFileChange}
                  accept=".pkl,.ipynb,.py"
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

              {/* <FormControl>
                <FormLabel>Features</FormLabel>
                {newModel.features.map((feature, index) => (
                  <Stack key={index} direction="row" align="center" mb={2}>
                    <Input
                      value={feature}
                      onChange={(e) => handleArrayChange(index, e, "features")}
                      placeholder={`Feature ${index + 1}`}
                    />
                    <IconButton
                      icon={<MinusIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveField(index, "features")}
                      disabled={newModel.features.length === 1}
                    />
                    {index === newModel.features.length - 1 && (
                      <IconButton
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={() => handleAddField("features")}
                      />
                    )}
                  </Stack>
                ))}
              </FormControl> */}

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
