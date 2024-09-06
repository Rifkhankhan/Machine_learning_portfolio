import { Flex, Grid, Spinner, Text, Button, HStack } from "@chakra-ui/react";
import UserCard from "./UserCard";
import { useEffect, useState } from "react";

const UserGrid = ({
  models,
  setModels,
  isLoading,
  totalPages,
  currentPage,
  setCurrentPage,
}) => {
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {}, [models]);

  console.log(models);

  return (
    <>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={4}
      >
        {models?.map((model) => (
          <UserCard key={model.id} model={model} setModels={setModels} />
        ))}
      </Grid>

      {isLoading && (
        <Flex justifyContent={"center"} mt={4}>
          <Spinner size={"xl"} />
        </Flex>
      )}
      {!isLoading && models?.length === 0 && (
        <Flex justifyContent={"center"} mt={4}>
          <Text fontSize={"xl"}>
            <Text as={"span"} fontSize={"2xl"} fontWeight={"bold"} mr={2}>
              Poor you! 🥺
            </Text>
            No Models found.
          </Text>
        </Flex>
      )}

      {!isLoading && totalPages > 1 && (
        <Flex justifyContent={"center"} mt={4}>
          <HStack spacing={4}>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Text fontSize={"lg"}>
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </>
  );
};

export default UserGrid;
