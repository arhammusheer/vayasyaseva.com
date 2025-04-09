import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  Link,
  Stack,
  Textarea,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { content } from "../content/content";

export default function ContactSection({ id }: { id: string }) {
  const contactSection = content.contactSection;
  const headingColor = useColorModeValue("brand.600", "brand.100");

  return (
    <Box as="section" py={8} id={id} maxW="container.xl" w="full">
      {/* Contact Methods */}
      <Box h={24} />
      <Box p={8}>
        <Heading as="h2" size="xl" mb={8} color={headingColor}>
          {contactSection.contactMethodsTitle}
        </Heading>
        <Stack spacing={8} direction={{ base: "column", md: "row" }}>
          {contactSection.contactMethods.map((method, index) => (
            <Box key={index}>
              <Heading as="h3" size="xl" color={headingColor}>
                <Icon as={method.icon} mr={2} />
                {method.name}
              </Heading>
              <Heading size="xl" href={method.href} as={Link}>
                {method.value}
              </Heading>
            </Box>
          ))}
        </Stack>
      </Box>
      {/* Contact Form */}

      <Box h={24} />
      {content.contactSection.enableForm && <ContactForm />}
    </Box>
  );
}

function ContactForm() {
  const contactSection = content.contactSection;
  const fields = contactSection.fields;

  const boxBg = useColorModeValue("brand.100", "brand.800");
  const borderColor = useColorModeValue("brand.200", "brand.700");
  const headingColor = useColorModeValue("brand.600", "brand.100");

  return (
    <Box
      bg={boxBg}
      borderRadius={"3xl"}
      py={8}
      px={8}
      border={"1px"}
      borderColor={borderColor}
    >
      <Heading as="h2" size="xl" mb={8} color={headingColor}>
        {contactSection.title}
      </Heading>
      <VStack spacing={4} as="form">
        {fields.map((field, index) => (
          <FormControl key={index} isRequired>
            <FormLabel>{field.label}</FormLabel>
            {field.type === "textarea" ? (
              <Textarea placeholder={field.placeholder} />
            ) : (
              <Input type={field.type} placeholder={field.placeholder} />
            )}
          </FormControl>
        ))}
        <Button type="submit" colorScheme="brand" width="full" size="lg">
          Submit
        </Button>
      </VStack>
    </Box>
  );
}
