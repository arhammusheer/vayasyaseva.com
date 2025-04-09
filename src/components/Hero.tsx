import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";
import { Link } from "react-scroll";

export default function Hero({ id }: { id: string }) {
  const videoCoverGradient = useColorModeValue(
    "linear(to-b, brand.50, transparent, brand.50)",
    "linear(to-b, brand.950,transparent, brand.950)"
  );
  const bg = useColorModeValue("whiteAlpha.300", "blackAlpha.300");

  const textColor = useColorModeValue("brand.900", "brand.100");
  return (
    <Box
      position="relative"
      id={id}
      overflow="hidden"
      width={"100%"}
      height={"80vh"}
      color={textColor}
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src="/assets/hero-background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content overlay */}
      <Stack
        position="relative"
        bgGradient={videoCoverGradient}
        height={"100%"}
        justify={"center"}
        color={textColor}
      >
        <Container
          maxW="container.xl"
          bg={bg}
          backdropFilter={"blur(10px)"}
          borderRadius={"3xl"}
          py={16}
          px={8}
        >
          <Heading as="h1" size="3xl" mb={4} py={2} px={4}>
            {content.heroSection.headline}
          </Heading>
          <Text fontSize="xl" mb={8} py={2} px={4}>
            {content.heroSection.subheading}
          </Text>

          <Button
            size="lg"
            colorScheme="brand"
            borderRadius={"2xl"}
            as={Link}
            to={content.heroSection.ctaButton.href}
          >
            {content.heroSection.ctaButton.label}
          </Button>
        </Container>
      </Stack>
    </Box>
  );
}
