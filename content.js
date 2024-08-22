function scrapeJobData() {
    const jobTitle = document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent.trim() || '';
    const company = document.querySelector('[data-company-name]')?.textContent.trim() || '';
    const location = document.querySelector('[data-testid=job-location]')?.textContent.trim() || '';
    const description = document.querySelector('div#jobDescriptionText')?.textContent.trim() || '';
    const jobAdUrl = new URL(document.querySelector('.jobsearch-HeaderContainer').querySelector('a').href);
    const fromjk = jobAdUrl.searchParams.get("fromjk");
    const url = `https://indeed.com/viewjob?jk=${fromjk}`;
    // Extract fromvjk parameter and construct new URL

    console.log(jobTitle, company, location, description, url);

    return { jobTitle, company, location, description, url };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeJob') {
        console.log("Now sending from content.js");
        sendResponse(scrapeJobData());
    }
});