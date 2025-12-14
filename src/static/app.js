document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to derive initials from an email/name
  function getInitials(identifier) {
    const name = (identifier || "").split("@")[0];
    const parts = name.split(/[\.\-_ ]+/).filter(Boolean);
    const initials = parts.map(p => p[0]?.toUpperCase() || "").slice(0, 2).join("");
    return initials || "?";
  }

  // Function to fetch activities from API and render
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description || ""}</p>
          <p><strong>Schedule:</strong> ${details.schedule || ""}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (!Array.isArray(details.participants) || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item empty";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            badge.textContent = getInitials(p);

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            // Delete/unregister button
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-icon";
            deleteBtn.title = `Unregister ${p}`;
            deleteBtn.textContent = "🗑️";
            deleteBtn.addEventListener("click", () => unregisterParticipant(name, p));

            li.appendChild(deleteBtn);
            li.appendChild(badge);
            li.appendChild(nameSpan);
            participantsList.appendChild(li);
          });
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown (avoid duplicates)
        if (![...activitySelect.options].some(o => o.value === name)) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Unregister a participant from an activity
  async function unregisterParticipant(activityName, participantEmail) {
    try {
      const url = `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`;
      const response = await fetch(url, { method: "DELETE", cache: 'no-store' });
      if (!response.ok) {
        console.error("Failed to unregister:", await response.text());
      }
      await fetchActivities();
    } catch (error) {
      console.error("Error unregistering participant:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST", cache: 'no-store' }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);

      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
