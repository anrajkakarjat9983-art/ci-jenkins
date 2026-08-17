const form = document.getElementById("registrationForm");

if (form) {

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const studentName =
            document.getElementById("studentName").value;

        const email =
            document.getElementById("email").value;

        const mobile =
            document.getElementById("mobile").value;

        const branch =
            document.getElementById("branch").value;

        const password =
            document.getElementById("password").value;


        try {

            const response = await fetch("/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    studentName,
                    email,
                    mobile,
                    branch,
                    password

                })

            });


            const result = await response.json();

            const message =
                document.getElementById("message");


            if (result.success) {

                message.textContent =
                    "Registration Successful";

                message.style.color = "green";

                form.reset();

            } else {

                message.textContent =
                    result.message;

                message.style.color = "red";

            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").textContent =
                "Unable to connect to server";

        }

    });

}