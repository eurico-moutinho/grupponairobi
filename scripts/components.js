// Generic function to load components
const loadComponent = (targetSelector, componentPath, initializeCallback = null) => {
  const target = document.querySelector(targetSelector);
  if (!target) {
    console.error(`${targetSelector} element not found`);
    return;
  }

  fetch(componentPath)
    .then((res) => {
      if (res.ok) return res.text();
      throw new Error(`Failed to fetch ${componentPath}`);
    })
    .then((html) => {
      target.innerHTML = html;
      if (initializeCallback && typeof initializeCallback === "function") {
        initializeCallback();
      }
    })
    .catch((error) => {
      console.error(`Error loading ${componentPath}:`, error);
    });
};

// Initialize function for Get Involved (TwitchClient)
const initializeTwitchClientAfterLoad = () => {
  if (typeof window.initializeTwitchClient === "function") {
    window.initializeTwitchClient();
  } else {
    setTimeout(() => {
      if (typeof window.initializeTwitchClient === "function") {
        window.initializeTwitchClient();
      } else {
        console.warn("TwitchClient initialization function not available");
      }
    }, 100);
  }
};

// Initialize function for Core Components (Footer and Header)
const initializeCoreAfterLoad = () => {
  if (typeof window.initializeCoreComponents === "function") {
    window.initializeCoreComponents();
  }
};

// Components to load
const components = [
  { selector: ".header", path: "./components/header.html", init: initializeCoreAfterLoad },
  { selector: ".hero", path: "./components/hero.html" },
  { selector: "#our-why", path: "./components/ourWhy.html" },
  { selector: "#the-project", path: "./components/project.html" },
  { selector: "#get-involved", path: "./components/streamers.html", init: initializeTwitchClientAfterLoad },
  { selector: "#support-project", path: "./components/supportProject.html" },
  { selector: "#who-we-are", path: "./components/team.html" },
  { selector: "#donate", path: "./components/cta.html" },
  { selector: ".footer-container", path: "./components/footer.html", init: initializeCoreAfterLoad }
];

// Load all components when DOM is ready
const loadAllComponents = () => {
  components.forEach(({ selector, path, init }) => {
    loadComponent(selector, path, init);
  });
};

// Load when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAllComponents);
} else {
  loadAllComponents();
}
