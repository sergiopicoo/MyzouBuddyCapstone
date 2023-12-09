async function submitRegisterForm() {
    try {
        const registerUsername = document.getElementById("registerUsername").value;
        const registerPassword = document.getElementById("registerPassword").value;

        const response = await fetch("https://api.myzoubuddy.app/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: registerUsername, password: registerPassword })
        });

        const data = await response.json();
        const registerMessageElement = document.getElementById("registerMessage");

        if (response.ok) {
            registerMessageElement.style.color = "green";
            registerMessageElement.textContent = data.message;
        } else {
            registerMessageElement.style.color = "red";
            registerMessageElement.textContent = data.error;
        }
    } catch (error) {
        console.error("Error during fetch:", error); 
    }
}

async function submitLoginForm() {
    console.log('Login button clicked');
    const username = document.getElementById("loginUsername").value; 
    const password = document.getElementById("loginPassword").value; 

    const response = await fetch("https://api.myzoubuddy.app/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    const messageElement = document.getElementById("loginMessage");
    if (response.ok) {
        localStorage.setItem('token', data.token);
        messageElement.style.color = "green";
        messageElement.textContent = data.message;
        window.location.href = 'main.html'; 
    } else {
        messageElement.style.color = "red";
        messageElement.textContent = data.error;
    }
}

function logout() {
    localStorage.removeItem('token');
}

async function displayUserClasses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch("https://api.myzoubuddy.app/getclasses", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (response.ok) {
            const classTextBox1 = document.getElementById('classTextBox1');
            const classTextBox2 = document.getElementById('classTextBox2');
            if (classTextBox1) {
                classTextBox1.value = data.classes[0] || '';
            }
            if (classTextBox2) {
                classTextBox2.value = data.classes[1] || '';
            }
        } else {
            console.error("Error fetching user's classes:", data.error);
        }
    } catch (error) {
        console.error("Error during fetch:", error);
    }
}

async function removeClass(removeClassName) {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch("https://api.myzoubuddy.app/removeclass", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ className: removeClassName }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Class removed successfully:", removeClassName);
            
            await displayUserClasses();
        } else {
            console.error("Error removing class:", data.error);
        }
    } catch (error) {
        console.error("Error during fetch:", error);
    }
}

async function findMatch() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://api.myzoubuddy.app/findMatch', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }  
        const data = await response.json();
        const matchDisplayElement = document.getElementById('matchDisplay');
        if (data.match) {
            let matchedInfo = '\n Matched User: ' + data.match;
            if (data.matchingClasses.length > 0) {
                matchedInfo += '\n \n Matching Classes: ' + data.matchingClasses.join(', ') ;
            }
            matchDisplayElement.innerText = matchedInfo;
        } else {
            matchDisplayElement.innerText = 'Matched User: None';
        }
    } catch (error) {
        console.error('Error fetching match:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    displayUserClasses();
    document.getElementById('findMatchButton').addEventListener('click', function() {
        findMatch();
    });
});

document.addEventListener('DOMContentLoaded', displayUserClasses);

document.addEventListener('DOMContentLoaded', function() {
    displayUserClasses();

    const findMatchButton = document.getElementById('findMatchButton');
    if (findMatchButton) {
        findMatchButton.addEventListener('click', findMatch);
    } else {
        console.error('findMatchButton not found');
    }
});

function logoutAndRedirect() {
    logout();
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('token');
    
}

