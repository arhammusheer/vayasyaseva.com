import {
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";
import { ProductCard } from "../content/types";

export default function ProductSection({ id }: { id: string }) {
  const productSection = content.productSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");

  return (
    <Box as="section" py={16} px={8} id={id} w="full" maxW="container.xl">
      <Heading as="h2" size="xl" mb={8} color={headingColor}>
        {productSection.title}
      </Heading>
      <Box fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
        {productSection.description}
      </Box>

      <Box h={8} />

      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={4}>
        {productSection.cards.map((card, index) => (
          <SingleProduct
            key={index}
            title={card.title}
            description={card.description}
            images={card.images}
            pills={card.pills}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}

const SingleProduct = ({ title, description, images, pills }: ProductCard) => {
  const bg = useColorModeValue("brand.100", "brand.900");
  const backdrop = useColorModeValue("whiteAlpha.600", "blackAlpha.800");
  const headingColor = useColorModeValue("brand.800", "brand.100");
  const border = useColorModeValue("brand.200", "brand.700");

  return (
    <Stack
      borderRadius="xl"
      borderWidth={1}
      borderColor={border}
      spacing={4}
      bg={bg}
      position="relative"
    >
      <Box
        p={4}
        bg={backdrop}
        h="full"
        // Make inner border radius match outer border radius and adjust padding
        borderRadius="xl"
      >
        <Stack direction={"row"} justify={"space-between"} align={"center"}>
          <Heading as="h3" size="lg" color={headingColor}>
            {title}
          </Heading>
          {pills &&
            pills.map((pill, index) => <Pill key={index} text={pill} />)}
        </Stack>
        <Box h={2} />
        <Text fontSize="lg">{description}</Text>
        <Stack mt={4} direction={"row"} spacing={4}>
          {images.map((image, index) => (
            <Box
              key={index}
              w={"100%"}
              h={56}
              bgImage={image}
              bgSize="cover"
              bgPosition="center"
              bgRepeat="no-repeat"
              borderRadius={"md"}
							borderWidth={1}
							borderColor={border}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};

const Pill = ({ text }: { text: string }) => {
  const color = useColorModeValue("brand.800", "brand.100");
  const bg = useColorModeValue("brand.200", "brand.900");
  return (
    <Box>
      <Box bg={bg} color={color} px={2} py={1} borderRadius={"xl"}>
        <Text fontSize={"sm"}>{text}</Text>
      </Box>
    </Box>
  );
};
