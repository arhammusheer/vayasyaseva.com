import {
  Box,
  Container,
  Image,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { content } from "../content/content";

export const Footer = () => {
  return (
    <Container maxW={"container.xl"}>
      <Stack
        minH={"20vh"}
        w={"full"}
        align={"center"}
        justify={"center"}
        direction={"column"}
      >
        <BrandedDivider />
        <Text>{content.footer.copyright}</Text>
        {content.footer.GSTIN || content.footer.MSME ? (
          <Text fontSize={"xs"} color={"gray.500"}>
            {content.footer.GSTIN && `GSTIN: ${content.footer.GSTIN}`}
            {content.footer.MSME && ` | MSME: ${content.footer.MSME}`}
          </Text>
        ) : null}
      </Stack>
    </Container>
  );
};

const BrandedDivider = () => {
  const borderColor = useColorModeValue("brand.200", "brand.700");
  return (
    <Stack
      direction={"row"}
      w={"full"}
      align={"center"}
      justify={"center"}
      spacing={4}
      py={4}
    >
      <Box w={"full"} h={"1px"} bg={borderColor} />
      <Image src={"/assets/VSPL-logo.png"} alt={"FSWS logo"} boxSize={8} />
      <Box w={"full"} h={"1px"} bg={borderColor} />
    </Stack>
  );
};

export default Footer;
