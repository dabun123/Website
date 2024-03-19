function checkForm() {
    let name = document.getElementById("fullName").value;
    let password = document.getElementById("password").value;
    let pass = false;
    let formProblems = [];
    let userExists = false;
    //Checks if either the username or the password is empty
    if(name == "" || name == null){
        formProblems.push("Full Name is Empty");
    }
    if(password == "" || password == null){
        formProblems.push("Password is Empty");
    }



    // Only set pass to true if both name and password are not empty
    if(name != "" && name != null && password != "" && password != null){
        let xml = new XMLHttpRequest;
        xml.open("POST", "/userInfo");
        xml.setRequestHeader("Content-Type", "application/json");
         
        const data = {
            name: name,
            password: password,
        }
        xml.onreadystatechange = function () {
            if (xml.readyState === XMLHttpRequest.DONE) {
              if (xml.status === 200) {
                  // Successful response
                  const response = JSON.parse(xml.responseText);
                  if(response){
                    window.location.href = "/homePage";
                  }
                
              } else {
                  alert("Not Valid Credentials");
                  // Error handling for non-200 status codes
                  console.error("Error:", xml.statusText);
              }
          }
          }
          xml.send(JSON.stringify(data));
    }


   


    let issues = document.getElementById("formErrors");
    issues.innerHTML = " \n  " + formProblems.join("<br>  ");
    console.log("\n  " + formProblems.join("\n  "));

}


document.getElementById("submit").addEventListener("click", function(event) {
    checkForm();
    event.preventDefault();
});
