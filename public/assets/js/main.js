/*
    Eventually by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

import { functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

(function () {
  "use strict";

  // Define `canUse` globally.
  window.canUse = function (property) {
    const testElement = document.createElement("div");
    const capitalizedProperty = property.charAt(0).toUpperCase() + property.slice(1);

    return (
      property in testElement.style ||
      `Moz${capitalizedProperty}` in testElement.style ||
      `Webkit${capitalizedProperty}` in testElement.style ||
      `O${capitalizedProperty}` in testElement.style ||
      `ms${capitalizedProperty}` in testElement.style
    );
  };

  const $body = document.querySelector("body");

  // Play initial animations on page load.
  window.addEventListener("load", function () {
    window.setTimeout(function () {
      $body.classList.remove("is-preload");
    }, 100);
  });

  // Slideshow Background.
  (function () {
    const settings = {
      images: {
        "images/image1.jpg": "center",
        "images/image2.jpg": "center",
        "images/image3.jpg": "center",
        "images/image4.jpg": "center",
        "images/image5.jpg": "center",
      },
      delay: 6000,
    };

    let pos = 0,
      lastPos = 0,
      $wrapper,
      $bgs = [],
      $bg,
      k;

    $wrapper = document.createElement("div");
    $wrapper.id = "bg";
    $body.appendChild($wrapper);

    for (k in settings.images) {
      $bg = document.createElement("div");
      $bg.style.backgroundImage = `url("${k}")`;
      $bg.style.backgroundPosition = settings.images[k];
      $wrapper.appendChild($bg);
      $bgs.push($bg);
    }

    $bgs[pos].classList.add("visible");
    $bgs[pos].classList.add("top");

    if ($bgs.length === 1 || !canUse("transition")) return;

    window.setInterval(function () {
      lastPos = pos;
      pos++;

      if (pos >= $bgs.length) pos = 0;

      $bgs[lastPos].classList.remove("top");
      $bgs[pos].classList.add("visible");
      $bgs[pos].classList.add("top");

      window.setTimeout(function () {
        $bgs[lastPos].classList.remove("visible");
      }, settings.delay / 2);
    }, settings.delay);
  })();

  // Update Background Based on Character
  function updateBackground(character) {
    const bgWrapper = document.querySelector("#bg");
    const newBackground = `url('images/characters/${character}.jpg')`;

    if (!bgWrapper) {
      $body.style.backgroundImage = newBackground;
      $body.style.backgroundSize = "cover";
      $body.style.backgroundPosition = "center";
    } else {
      const newBgDiv = document.createElement("div");
      newBgDiv.style.backgroundImage = newBackground;
      newBgDiv.style.backgroundPosition = "center";
      newBgDiv.style.backgroundSize = "cover";
      newBgDiv.classList.add("visible", "top");

      bgWrapper.appendChild(newBgDiv);

      const currentBg = bgWrapper.querySelector(".visible:not(.top)");
      if (currentBg) {
        window.setTimeout(function () {
          currentBg.classList.remove("visible");
          bgWrapper.removeChild(currentBg);
        }, 1500);
      }
    }
  }

  // Signup Form with Background Change on Submit and Email Functionality.
  (function () {
    const $form = document.querySelector("#signup-form"),
      $submit = document.querySelector("#signup-form input[type='submit']"),
      $mainContent = document.querySelector("#mainContent");

    if (!("addEventListener" in $form)) return;

    $form.addEventListener("submit", async function (event) {
      event.stopPropagation();
      event.preventDefault();

      $submit.disabled = true;

      const email = document.getElementById("email").value;
      const status = document.getElementById("status").value;
      const character = document.getElementById("character").value;

      // Update background.
      updateBackground(character);

      // Hide mainContent.
      if ($mainContent) {
        $mainContent.style.display = "none";
      }

      // Send email with character details.
      try {
        const sendEmail = httpsCallable(functions, "sendCharacterEmail");
        const emailResponse = await sendEmail({
          email,
          character,
          status,
        });

        if (emailResponse.data.success) {
          console.log("Email sent successfully.");
        } else {
          console.error("Error sending email:", emailResponse.data.message);
        }
      } catch (error) {
        console.error("Error calling email function:", error);
      }

      // Reset form and re-enable submit.
      window.setTimeout(function () {
        $form.reset();
        $submit.disabled = false;
      }, 750);
    });
  })();
})();
