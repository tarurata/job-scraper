function logError(error) {
    console.error("Error in popup script:", error);
}
try {
    document.getElementById('scrapeButton').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeJob" }, (response) => {
                chrome.runtime.sendMessage({ action: "saveToSheets", data: response });
            });
        });
    });
} catch (error) {
    logError(error);
}