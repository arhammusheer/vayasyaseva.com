import {
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";
import { ServiceCard } from "../content/types";

export default function ServicesSection({ id }: { id: string }) {
  const servicesSection = content.servicesSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");
  return (
    <Box as="section" py={16} px={8} id={id} w="full" maxW="container.xl">
      {/* Section Title */}
      <Heading as="h2" size="xl" mb={8} color={headingColor}>
        {servicesSection.title}
      </Heading>

      {/* Cards Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {servicesSection.cards.map((card, index) => (
          <SingleService
            key={index}
            title={card.title}
            description={card.description}
            image={card.image}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}


const SingleService = ({ title, description, image }: ServiceCard) => {
  const bg = useColorModeValue("brand.100", "brand.900");
  const backdrop = useColorModeValue("whiteAlpha.700", "blackAlpha.800");
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
      bgImage={image}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
    >
      <Box
        p={4}
        bg={backdrop}
        h="full"
        // Make inner border radius match outer border radius and adjust padding
        borderRadius="xl"
      >
        <Heading as="h3" size="lg" color={headingColor}>
          {title}
        </Heading>
        <Text fontSize="lg">{description}</Text>
      </Box>
    </Stack>
  );
};
