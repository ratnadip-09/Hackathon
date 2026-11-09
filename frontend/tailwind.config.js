export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14202B",
        paper: "#F2F4F5",
        line: "#D5DBE0",
        mute: "#5B6B78",
        signal: "#0E7C86",
        ok: "#2F7D4F",
        caution: "#B7791F",
        danger: "#B42318",
      },
      fontFamily: { sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"] },
    },
  },
};
