import { functions } from "./firebase.js";
import { getRandomCharacter } from "./naughtyNice.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";
import { addUser } from "./firebase.js";

(function () {
  "use strict";

  const $body = document.querySelector("body");

  window.addEventListener("load", () => {
    setTimeout(() => $body.classList.remove("is-preload"), 100);
  });

  // Slideshow Background, Update Background, Popup Code unchanged...

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
        const sendEmail = httpsCallable(functions, "sendCharacterEmail");
        const emailResponse = await sendEmail({ email, character, status });

        if (emailResponse.data.success) {
          console.log("Email sent successfully.");
        } else {
          console.error("Error sending email:", emailResponse.data.message);
        }
      } catch (error) {
        console.error("Error sending email:", error);
      }

      setTimeout(() => {
        $form.reset();
        $submit.disabled = false;
      }, 99999999999999);
    });
  })();
})();
