import { functions } from "./firebase.js";
import { getRandomCharacter } from "./naughtyNice.js";
import { addUser } from "./firebase.js";

(function () {
  "use strict";

  const $body = document.querySelector("body");

  // Play initial animations on page load
  window.addEventListener("load", () => {
    setTimeout(() => $body.classList.remove("is-preload"), 100);
  });

  // Slideshow Background
  (function () {
    const settings = {
      images: ["images/image1.jpg", "images/image2.jpg", "images/image3.jpg", "images/image4.jpg", "images/image5.jpg"],
      delay: 6000,
    };

    let pos = 0;

    const $wrapper = document.createElement("div");
    $wrapper.id = "bg";
    $body.appendChild($wrapper);

    const $bgs = settings.images.map((src) => {
      const $bg = document.createElement("div");
      $bg.style.backgroundImage = `url(${src})`;
      $wrapper.appendChild($bg);
      return $bg;
    });

    $bgs[pos].classList.add("visible", "top");

    if ($bgs.length > 1) {
      setInterval(() => {
        const lastPos = pos;
        pos = (pos + 1) % $bgs.length;

        $bgs[lastPos].classList.remove("top");
        $bgs[pos].classList.add("visible", "top");

        setTimeout(() => $bgs[lastPos].classList.remove("visible"), settings.delay / 2);
      }, settings.delay);
    }
  })();

  // Update Background
  function updateBackground(character) {
    const bgWrapper = document.querySelector("#bg");
    const newBackground = `url('images/characters/${character.toLowerCase().replace(/ /g, "_")}.jpg')`;

    const newBgDiv = document.createElement("div");
    newBgDiv.style.backgroundImage = newBackground;
    newBgDiv.style.backgroundPosition = "center";
    newBgDiv.style.backgroundSize = "cover";
    newBgDiv.classList.add("visible", "top");

    bgWrapper.appendChild(newBgDiv);

    const currentBg = bgWrapper.querySelector(".visible:not(.top)");
    if (currentBg) {
      setTimeout(() => {
        currentBg.classList.remove("visible");
        bgWrapper.removeChild(currentBg);
      }, 1500);
    }
  }

  // Show Popup
  function showPopup(firstName, status, character) {
    const popup = document.getElementById("popup");
    const popupContent = document.getElementById("popup-content");

    if (popup && popupContent) {
      const icon = status.toLowerCase() === "nice" ? "🎅" : "😈";
      const statusColor = status.toLowerCase() === "nice" ? "green" : "red";

      popupContent.innerHTML = `
        <div class="popup-header" style="background: linear-gradient(135deg, #1cb495, #ff2361);">
          <div class="icon">${icon}</div>
          <h2>Thank You, ${firstName}!</h2>
        </div>
        <div class="popup-body">
          <p>You are on the <strong style="color: ${statusColor};">${status.toUpperCase()}</strong> list!</p>
          <p>Your character is <strong class="character">${character}</strong>.</p>
        </div>
      `;

      popup.style.display = "flex";

      // Automatically hide the popup after 5 seconds
      setTimeout(() => {
        popup.style.display = "none";
      }, 9999999999);
    } else {
      console.error("Popup or popup content is missing in the DOM.");
    }
  }

  // Signup Form
  (function () {
    const $form = document.querySelector("#signup-form");
    const $submit = $form.querySelector("input[type='submit']");
    const $mainContent = document.querySelector("#mainContent");

    $form.addEventListener("submit", async (event) => {
      event.preventDefault();

      $submit.disabled = true;

      const firstName = $form.firstName.value;
      const lastName = $form.lastName.value;
      const email = $form.email.value;

      if (!firstName || !lastName || !email) {
        alert("Please fill out all fields.");
        $submit.disabled = false;
        return;
      }

      const { status, character } = await getRandomCharacter();
      const userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      addUser(userId, firstName, lastName, email, status, character);

      updateBackground(character);

      showPopup(firstName, status, character);

      if ($mainContent) {
        $mainContent.style.display = "none";
      }

      try {
        const response = await fetch("https://us-central1-christmas-app-e9bf7.cloudfunctions.net/sendCharacterEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, character, status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error sending email:", errorData.message);
          return;
        }

        console.log("Email sent successfully.");
      } catch (error) {
        console.error("Error in fetch request:", error);
      }

      setTimeout(() => {
        $form.reset();
        $submit.disabled = false;
      }, 750);
    });
  })();
})();
