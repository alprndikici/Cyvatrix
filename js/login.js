
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (!form) return;

  const message = form.querySelector(".form-message");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "";
    message.style.color = "";

    submitButton.disabled = true;
    submitButton.textContent = "Signing In...";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
        signal: AbortSignal.timeout(15000)
      });

      const data = await response.json();

      if (!response.ok) {
        message.textContent =
          data.message || "Login failed. Please try again.";
        message.style.color = "#ef4444";
        return;
      }

      message.textContent =
        `Welcome back, ${data.user.name}! Redirecting to dashboard...`;

      message.style.color = "#22c55e";

      form.reset();

      setTimeout(() => {
        window.location.replace("dashboard.html");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);

      message.textContent =
        "Unable to connect to the server. Please try again.";
      message.style.color = "#ef4444";

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  });
});
