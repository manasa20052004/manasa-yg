const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    navLinks.classList.toggle("is-open", !isExpanded);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      navLinks.classList.remove("is-open");
    }
  });
}

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const apiBaseUrl = typeof window.PORTFOLIO_API_URL === "string"
  ? window.PORTFOLIO_API_URL.trim().replace(/\/+$/, "")
  : "";

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const buttonText = submitButton.textContent;

    if (!apiBaseUrl) {
      formStatus.dataset.state = "error";
      formStatus.textContent = "The contact service is not configured yet. Please try again later.";
      return;
    }

    submitButton.disabled = true;
    formStatus.dataset.state = "";
    formStatus.textContent = "Sending your message…";

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Your message could not be sent. Please try again.");
      }

      formStatus.dataset.state = "success";
      formStatus.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      formStatus.dataset.state = "error";
      formStatus.textContent = error instanceof TypeError
        ? "Could not reach the contact service. Please check your connection and try again."
        : error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = buttonText;
    }
  });
}
