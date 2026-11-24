
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  if (!form) return;

  const message = form.querySelector(".form-message");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    message.textContent = "";
    message.style.color = "";

    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      message.style.color = "#ef4444";
      return;
    }

    if (username.length < 3 || username.length > 30) {
      message.textContent = "Username must be 3-30 characters.";
      message.style.color = "#ef4444";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";

    try {
      const response = await fetch(
        "http://192.168.145.128:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: username,
            email: email,
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        message.textContent = data.message || "Registration failed.";
        message.style.color = "#ef4444";
        return;
      }

      message.textContent = "Account created successfully! Redirecting to login...";
      message.style.color = "#22c55e";

      form.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);

      message.textContent = "Cannot connect to the server. Please try again.";
      message.style.color = "#ef4444";

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
    }
  });
});
