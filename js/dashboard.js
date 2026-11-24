
document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("dashboard-content");
  const status = document.getElementById("dashboard-status");
  const logoutButton = document.getElementById("logout-button");

  // Verify the user's session.
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 401) {
      window.location.replace("login.html");
      return;
    }

    if (!response.ok) {
      throw new Error("Session verification failed.");
    }

    const data = await response.json();

    if (!data.authenticated || !data.user) {
      throw new Error("Invalid authentication response.");
    }

    // Display authenticated user information.
    document.getElementById("welcome-message").textContent =
      `Welcome back, ${data.user.name}!`;

    document.getElementById("user-name").textContent =
      data.user.name;

    document.getElementById("user-email").textContent =
      data.user.email;

    document.getElementById("user-id").textContent =
      data.user.id;

    status.hidden = true;
    content.hidden = false;
    logoutButton.hidden = false;

  } catch (error) {
    console.error("Session error:", error);

    status.textContent =
      "Unable to verify your session. Please refresh the page.";
    return;
  }

  // Logout
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging Out...";

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error("Logout request failed.");
      }

      window.location.replace("login.html");

    } catch (error) {
      console.error("Logout error:", error);

      status.hidden = false;
      status.textContent =
        "Logout failed. Please try again.";

      logoutButton.disabled = false;
      logoutButton.textContent = "Logout";
    }
  });
});
