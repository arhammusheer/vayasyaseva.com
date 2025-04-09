import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";
import { FAQQuestion } from "../content/types";

export default function FAQSection({ id }: { id: string }) {
  const faqSection = content.faqSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");
  const bg = useColorModeValue("brand.100", "brand.900");
	const borderColor = useColorModeValue("brand.200", "brand.700");

  return (
    <Box
      as="section"
      py={16}
      px={8}
      id={id}
      maxW="container.xl"
      w="full"
      bg={bg}
      borderRadius={"3xl"}
			border={"1px"}
			borderColor={borderColor}
      p={4}
    >
      {/* Section title */}
      <Heading as="h2" size="xl" mb={8} color={headingColor} p={4}>
        {faqSection.title}
      </Heading>

      {/* FAQ questions */}
      <Accordion allowToggle allowMultiple>
        {faqSection.questions.map((q, index) => (
          <SingleFAQ key={index} question={q.question} answer={q.answer} />
        ))}
      </Accordion>
    </Box>
  );
}

const SingleFAQ = ({ question, answer }: FAQQuestion) => {
  const headingColor = useColorModeValue("brand.800", "brand.100");

  return (
    <AccordionItem border={0}>
      <AccordionButton>
        <Box flex="1" textAlign="left" color={headingColor}>
          <Heading as="h3" size="lg">
            {question}
          </Heading>
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4}>
        <Text fontSize="lg">{answer}</Text>
      </AccordionPanel>
    </AccordionItem>
  );
};
