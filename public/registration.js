function checkForm() {
    let name = document.getElementById("fullName").value;
    let password = document.getElementById("password").value;
    let formProblems = [];
    let birthday = document.getElementById("birthday")
    let pass = false;

    //Checks if either the username or the password is empty
    if(name == "" || name == null){
        formProblems.push("Full Name is Empty");
    }
    if(password == "" || password == null){
        formProblems.push("Password is Empty");
    }

    // Only set pass to true if both name and password are not empty
    if(name != "" && name != null && password != "" && password != null){
        pass = true;
    }

    // Check if the user has a birthday in the database, first check if the birthday id exists, since it alternates based on login and register
    if(birthday){
        let birthdayVal = document.getElementById("birthday").value;
        if(birthdayVal == "" || birthdayVal == null){
            formProblems.push("Birthday is Empty");
            pass = false;
        }
        else{
            pass = true;
        }
    }

    let issues = document.getElementById("formErrors");
    issues.innerHTML = " \n  " + formProblems.join("<br>  ");
    console.log("\n  " + formProblems.join("\n  "));

    //Sends in user data
    if (pass) {
        let userData = {
          name: name,
          password: password,
          birthday: birthday.value,
        };
      
        req = new XMLHttpRequest();
        req.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
              console.log("hi");
              // Redirect only after a successful response
              window.location.href = "/homePage";
            } else {
              console.error("Failed to send user data. Status code: " + this.status);
              // Handle error or show an alert/message to the user
            }
          }
        };
      
        req.open("POST", "/users");
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(userData));
      }

  
}

document.getElementById("submit").addEventListener("click", function(event) {
    checkForm();
    event.preventDefault();
});
