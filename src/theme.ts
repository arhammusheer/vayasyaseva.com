// theme.js

// 1. import `extendTheme` function
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// 2. Add your color mode config
const config = {
  initialColorMode: "light",
  useSystemColorMode: true,
} as ThemeConfig;

// 3. extend the theme
const setup = extendTheme({
  config,
  colors: {
    gray: {
      950: "#0f0f12",
    },
    red: {
      950: "#1f0808",
    },
    pink: {
      950: "#2c0514",
    },
    purple: {
      950: "#1a032e",
    },
    cyan: {
      950: "#051b24",
    },
    blue: {
      950: "#0c142e",
    },
    teal: {
      950: "#021716",
    },
    green: {
      950: "#03190c",
    },
    yellow: {
      950: "#281304",
    },
    orange: {
      950: "#220a04",
    },
  },
  fonts: {
    heading: "Poppins",
  },
});

const theme = extendTheme(setup, {
  colors: {
    brand: setup.colors["yellow"],
  },
});

export default theme;
