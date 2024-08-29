const SHEET_ID = '__SHEET_ID__';

let accessToken: string | null = null;

function getAuthToken(maxAttempts: number = 3, delay: number = 1000): Promise<string> {
    return new Promise((resolve, reject) => {
        let attempts: number = 0;

        function attemptGetToken(): void {
            attempts++;
            chrome.identity.getAuthToken({ interactive: true }, (token: string | undefined) => {
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
    .then((token: string) => {
        accessToken = token;
    })
    .catch((errorMessage: string) => {
        console.error(errorMessage);
    });

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (request.action === 'saveToSheets') {
        saveToGoogleSheets(request.data);
    }
});

interface SheetData {
    jobTitle: string;
    company: string;
    location: string;
    description: string;
    url: string;
}

function saveToGoogleSheets(data: SheetData): void {
    if (!accessToken) {
        console.error('Access token is not set');
        // Attempt to get the token again
        getAuthToken()
            .then((token: string) => {
                accessToken = token;
                saveToGoogleSheets(data); // Retry the save operation
            })
            .catch((errorMessage: string) => {
                console.error(errorMessage);
            });
        return;
    }
    console.log('saveToGoogleSheets called with data:', data);
    const sheetId: string = SHEET_ID;
    const range: string = 'A1:P1000';
    const url: string = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

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
