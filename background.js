const SHEET_ID = '__SHEET_ID__';

let accessToken = null;

function getAuthToken(maxAttempts = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        // Sometimes, the token is not received, so we retry
        function attemptGetToken() {
            attempts++;
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    console.error(`Auth error (attempt ${attempts}):`, chrome.runtime.lastError);
                    if (attempts < maxAttempts) {
                        setTimeout(attemptGetToken, delay);
                    } else {
                        reject(`Failed to get auth token after ${maxAttempts} attempts: ${chrome.runtime.lastError.message}`);
                    }
                } else if (token) {
                    console.log('Token received');
                    resolve(token);
                } else {
                    console.error(`No token received (attempt ${attempts})`);
                    if (attempts < maxAttempts) {
                        setTimeout(attemptGetToken, delay);
                    } else {
                        reject(`Failed to get auth token after ${maxAttempts} attempts: No token received`);
                    }
                }
            });
        }

        attemptGetToken();
    });
}

getAuthToken()
    .then(token => {
        accessToken = token;
        // Proceed with using the token
    })
    .catch(errorMessage => {
        console.error(errorMessage);
        // Handle the error (e.g., show a notification to the user)
    });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveToSheets') {
        saveToGoogleSheets(request.data);
    }
});

function saveToGoogleSheets(data) {
    if (!accessToken) {
        console.error('Access token is not set');
        // Attempt to get the token again
        getAuthToken()
            .then(token => {
                accessToken = token;
                saveToGoogleSheets(data); // Retry the save operation
            })
            .catch(errorMessage => {
                console.error(errorMessage);
                // Notify the user that the operation failed due to authentication issues
            });
        return;
    }
    console.log('saveToGoogleSheets called with data:', data);
    const sheetId = SHEET_ID;
    const range = 'A1:P1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            majorDimension: "ROWS",
            values: [[new Date().toISOString().split('T')[0], data.jobTitle, data.company, data.location, data.description, data.url]]
        })
    })
        .then(response => response.json())
        .then(result => console.log('Success:', result))
        .catch(error => {
            console.error('Error:', error);
            if (error.response) {
                console.error('Response:', error.response);
            }
        });
}