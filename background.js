const SHEET_ID = '__SHEET_ID__';

let accessToken = null;

chrome.identity.getAuthToken({ interactive: true }, function (token) {
    accessToken = token;
    console.log('Token received:', token ? 'Token obtained' : 'No token');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveToSheets') {
        saveToGoogleSheets(request.data);
    }
});

function saveToGoogleSheets(data) {
    if (!accessToken) {
        console.error('Access token is not set');
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