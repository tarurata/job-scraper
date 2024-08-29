function logError(error: Error): void {
    console.error("Error in popup script:", error);
}

try {
    const scrapeButton = document.getElementById('scrapeButton');
    if (scrapeButton) {
        scrapeButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeJob" }, (response) => {
                        chrome.runtime.sendMessage({ action: "saveToSheets", data: response });
                    });
                }
            });
        });
    }
} catch (error) {
    logError(error as Error);
}
