import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";

export default function AboutSection({ id }: { id: string }) {
  const aboutSection = content.aboutSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");

  return (
    <Flex
      id={id}
      minH={"500px"}
      w={"full"}
      maxW={"100vw"}
      bgGradient={useColorModeValue(
        "linear(to-b, brand.50, brand.200, brand.50)",
        "linear(to-b, brand.950, brand.800, brand.950)"
      )}
      align={"center"}
      justify={"center"}
      tabIndex={-1}
    >
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
        }}
        maxW={"container.xl"}
        gap={{
          base: 12,
          md: 6,
        }}
        w={"full"}
        p={{
          base: 8,
          md: 16,
        }}
      >
        <GridItem tabIndex={0}>
          <Heading
            fontWeight={"bold"}
            as={"h1"}
            size={{
              base: "3xl",
              md: "4xl",
            }}
            color={headingColor}
          >
            {aboutSection.title}
          </Heading>
        </GridItem>
        <GridItem tabIndex={0}>
          <Flex w={"full"} h={"full"} maxW={"600px"}>
            <Box>
              <Text
                fontSize={"xl"}
                mt={4}
                align={{ base: "left", md: "justify" }}
              >
                {aboutSection.description}
              </Text>
            </Box>
          </Flex>
        </GridItem>
      </Grid>
    </Flex>
  );
}
