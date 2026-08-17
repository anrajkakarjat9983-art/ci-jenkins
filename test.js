const fs = require("fs");
const path = require("path");

const {
    validateRegistration
} = require("./script.js");


let passed = 0;
let failed = 0;


function test(testId, description, condition) {

    if (condition) {
        console.log(`${testId} PASS - ${description}`);
        passed++;
    } else {
        console.log(`${testId} FAIL - ${description}`);
        failed++;
    }

}


/*
=================================================
TC-01: Check index.html exists
=================================================
*/

test(
    "TC-01",
    "Check index.html exists",
    fs.existsSync(path.join(__dirname, "index.html"))
);


/*
=================================================
TC-02: Check style.css exists
=================================================
*/

test(
    "TC-02",
    "Check style.css exists",
    fs.existsSync(path.join(__dirname, "style.css"))
);


/*
=================================================
TC-03: Check script.js exists
=================================================
*/

test(
    "TC-03",
    "Check script.js exists",
    fs.existsSync(path.join(__dirname, "script.js"))
);


/*
=================================================
TC-04: Check students.json exists
=================================================
*/

test(
    "TC-04",
    "Check students.json exists",
    fs.existsSync(path.join(__dirname, "students.json"))
);


/*
=================================================
TC-05: Student Name should not be empty
=================================================
*/

const validData = {
    studentName: "Uday Pratap Singh",
    email: "uday@gmail.com",
    mobile: "9876543210",
    branch: "Computer Science",
    password: "123456"
};

const emptyName = validateRegistration({
    ...validData,
    studentName: ""
});

test(
    "TC-05",
    "Student Name should not be empty",
    emptyName.valid === false
);


/*
=================================================
TC-06: Email should contain @
=================================================
*/

const invalidEmail = validateRegistration({
    ...validData,
    email: "udaygmail.com"
});

test(
    "TC-06",
    "Email should contain @",
    invalidEmail.valid === false
);


/*
=================================================
TC-07: Mobile exactly 10 digits
=================================================
*/

const invalidMobile = validateRegistration({
    ...validData,
    mobile: "987654321"
});

test(
    "TC-07",
    "Mobile Number should contain exactly 10 digits",
    invalidMobile.valid === false
);


/*
=================================================
TC-08: Password at least 6 characters
=================================================
*/

const invalidPassword = validateRegistration({
    ...validData,
    password: "123"
});

test(
    "TC-08",
    "Password should contain at least 6 characters",
    invalidPassword.valid === false
);


/*
=================================================
TC-09: Branch should be selected
=================================================
*/

const invalidBranch = validateRegistration({
    ...validData,
    branch: ""
});

test(
    "TC-09",
    "Branch should be selected",
    invalidBranch.valid === false
);


/*
=================================================
TC-10: Registration Successful message
=================================================
*/

const successfulRegistration = validateRegistration(validData);

test(
    "TC-10",
    "Registration Successful message displayed",
    successfulRegistration.valid === true &&
    successfulRegistration.message === "Registration Successful"
);


/*
=================================================
FINAL RESULT
=================================================
*/

console.log("");
console.log("======================================");
console.log("Student Registration Test Summary");
console.log("======================================");

console.log(`Total Tests : ${passed + failed}`);
console.log(`Passed      : ${passed}`);
console.log(`Failed      : ${failed}`);

console.log("======================================");


if (failed > 0) {

    console.log("TEST RESULT: FAILED");

    process.exit(1);

} else {

    console.log("TEST RESULT: ALL TESTS PASSED");

    process.exit(0);

}