import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { content } from "../content/content";
import { Statistic } from "../content/types";

export default function ImpactSection({ id }: { id: string }) {
  const impactSection = content.impactSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");

  return (
    <Box as="section" py={16} px={8} id={id} maxW="container.xl" w="full">
      {/* Section title */}
      <Heading as="h2" size="xl" mb={8} color={headingColor}>
        {impactSection.title}
      </Heading>

      {/* Statistics grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={1}>
        {impactSection.statistics.map((statItem, index) => (
          <SingleStat
            key={index}
            stat={statItem.stat}
            description={statItem.description}
            image={statItem.image}
            isRollingNumber={statItem.isRollingNumber}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}

const SingleStat = ({
  stat,
  description,
  image,
  isRollingNumber,
}: Statistic) => {
  const [displayStat, setDisplayStat] = useState(stat);

  const headingColor = useColorModeValue("brand.800", "brand.100");

  useEffect(() => {
    if (isRollingNumber) {
      const numberMatch = stat.match(/(\d+)/);
      if (numberMatch) {
        const number = parseInt(numberMatch[0], 10);
        let currentNumber = 0;
        const increment = Math.ceil(number / 100);

        const interval = setInterval(() => {
          currentNumber += increment;
          if (currentNumber >= number) {
            clearInterval(interval);
            setDisplayStat(stat);
          } else {
            setDisplayStat(
              stat.replace(numberMatch[0], currentNumber.toString())
            );
          }
        }, 30);

        return () => clearInterval(interval);
      }
    }
  }, [stat, isRollingNumber]);

  return (
    <VStack
      spacing={4}
      w={"full"}
      backgroundImage={image}
      minH={200}
      justify="center"
      textAlign="center"
    >
      <Heading as="h3" size="xl" color={headingColor}>
        {displayStat}
      </Heading>
      <Text fontSize="lg">
        {description}
      </Text>
    </VStack>
  );
};
