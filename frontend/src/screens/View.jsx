import React, { useState } from "react";
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
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

const View = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={6}>
        {/* Header */}
        <Heading as="h1" size="xl" textAlign="center">
          Student Performance Dataset
        </Heading>

        {/* Introduction */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            About Dataset
          </Heading>
          <Text fontSize="md">
            The Student Performance Dataset is designed to evaluate and predict
            student outcomes based on various factors that can influence
            academic success. This synthetic dataset includes features that are
            commonly considered in educational research and real-world
            scenarios, such as attendance, study habits, previous academic
            performance, and participation in extracurricular activities. The
            goal is to understand how these factors correlate with the final
            grades of students and to build a predictive model that can forecast
            student performance.
          </Text>
        </Box>

        {/* Dataset Features */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Dataset Features
          </Heading>
          <List spacing={3}>
            <ListItem>
              <strong>StudentID:</strong> A unique identifier for each student.
            </ListItem>
            <ListItem>
              <strong>Name:</strong> The name of the student.
            </ListItem>
            <ListItem>
              <strong>Gender:</strong> The gender of the student (Male/Female).
            </ListItem>
            <ListItem>
              <strong>AttendanceRate:</strong> The percentage of classes
              attended by the student.
            </ListItem>
            <ListItem>
              <strong>StudyHoursPerWeek:</strong> The number of hours the
              student spends studying each week.
            </ListItem>
            <ListItem>
              <strong>PreviousGrade:</strong> The grade the student achieved in
              the previous semester (out of 100).
            </ListItem>
            <ListItem>
              <strong>ExtracurricularActivities:</strong> The number of
              extracurricular activities the student is involved in.
            </ListItem>
            <ListItem>
              <strong>ParentalSupport:</strong> A qualitative assessment of the
              level of support provided by the student's parents
              (High/Medium/Low).
            </ListItem>
            <ListItem>
              <strong>FinalGrade:</strong> The final grade of the student (out
              of 100), which serves as the target variable for prediction.
            </ListItem>
          </List>
        </Box>

        {/* Use Cases */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Use Cases
          </Heading>
          <List spacing={3}>
            <ListItem>
              Predicting Student Performance: The dataset can be used to build
              machine learning models that predict the final grade of students
              based on the other features. This can help educators identify
              students who may need additional support to improve their
              outcomes.
            </ListItem>
            <ListItem>
              Exploratory Data Analysis: Researchers and data scientists can
              explore the relationships between different factors (like
              attendance or study habits) and student performance. For example,
              understanding whether higher attendance correlates with better
              grades.
            </ListItem>
            <ListItem>
              Feature Importance Analysis: The dataset allows for the
              examination of which features are most predictive of student
              success, providing insights into key areas of focus for
              educational interventions.
            </ListItem>
            <ListItem>
              Educational Interventions: By identifying patterns in the data,
              schools and educational institutions can implement targeted
              interventions to help students improve in specific areas, such as
              increasing study hours or encouraging participation in
              extracurricular activities.
            </ListItem>
          </List>
        </Box>

        {/* Potential Insights */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Potential Insights
          </Heading>
          <List spacing={3}>
            <ListItem>
              Correlation Between Study Habits and Performance: The dataset can
              be used to determine how much study time contributes to academic
              success.
            </ListItem>
            <ListItem>
              Impact of Attendance on Grades: Analysis can reveal the extent to
              which regular attendance influences final grades.
            </ListItem>
            <ListItem>
              Role of Extracurricular Activities: The dataset can help assess
              whether participation in extracurricular activities positively or
              negatively impacts academic performance.
            </ListItem>
            <ListItem>
              Influence of Parental Support: The data allows for the examination
              of how different levels of parental support affect student
              outcomes.
            </ListItem>
          </List>
        </Box>

        {/* Conclusion */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Conclusion
          </Heading>
          <Text fontSize="md">
            The Student Performance Dataset is a versatile tool for educators,
            data scientists, and researchers interested in understanding and
            predicting student success. By analyzing this data, stakeholders can
            gain valuable insights into the factors that contribute to academic
            performance and develop strategies to enhance educational outcomes.
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
                  <FormControl id="modelName" isRequired>
                    <FormLabel>Model Name</FormLabel>
                    <Input placeholder="Enter model name" />
                  </FormControl>

                  <FormControl id="modelDescription" isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input placeholder="Enter model description" />
                  </FormControl>

                  <FormControl id="dateCreated" isRequired>
                    <FormLabel>Date Created</FormLabel>
                    <Input type="date" />
                  </FormControl>
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
  );
};

export default View;
