type PageType = 'indeed' | 'glassdoor';

interface JobData {
    jobTitle: string;
    company: string;
    location: string;
    description: string;
    url: string;
}

function scrapeJobData(): JobData {
    const pageType = determinePageType();
    const scraper = getScraperForPageType(pageType);
    return scraper();
}

function determinePageType(): PageType {
    return 'indeed';
}

function getScraperForPageType(pageType: PageType): () => JobData {
    const scrapers: Record<PageType, () => JobData> = {
        indeed: scrapeIndeedJob,
        glassdoor: scrapeGlassdoorJob,
    };
    return scrapers[pageType] || scrapers.indeed;
}

function scrapeGlassdoorJob(): JobData {
    // Scraping logic for Glassdoor jobs
    // This is a placeholder and should be implemented
    return {
        jobTitle: 'N/A',
        company: 'N/A',
        location: 'N/A',
        description: 'N/A',
        url: 'N/A'
    };
}

function scrapeIndeedJob(): JobData {
    const jobTitle = document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() 
        || document.querySelector('div[data-testid="jobDetailTitle"]')?.textContent?.trim() 
        || 'N/A';
    const company = document.querySelector('[data-company-name]')?.textContent?.trim() 
        || document.querySelector('div[data-testid="jobDetailSubtitle"]')?.textContent?.trim() 
        || 'N/A';
    const location = document.querySelector('[data-testid=job-location]')?.textContent?.trim() || 'N/A';
    const description = document.querySelector('div#jobDescriptionText')?.textContent?.trim() 
        || document.querySelector('div[data-testid="jobDetailDescription"]')?.textContent?.trim() 
        || 'N/A';
    let url = 'N/A';
    const headerContainer = document.querySelector('.jobsearch-HeaderContainer');
    const headerLink = headerContainer?.querySelector('a');

    if (headerLink?.href) {
        const jobAdUrl = new URL(headerLink.href);
        const fromjk = jobAdUrl.searchParams.get("fromjk");
        if (fromjk) {
            url = `https://indeed.com/viewjob?jk=${fromjk}`;
        }
    }

    console.log(jobTitle, company, location, description, url);
    return { jobTitle, company, location, description, url };
}

// Send job data to background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeJob') {
        console.log("Now sending from content.ts");

        Promise.resolve(scrapeJobData())
            .then(data => {
                sendResponse(data);
            })
            .catch(error => {
                console.error("Error scraping job data:", error);
                sendResponse({ error: "Failed to scrape job data" });
            });

        // Return true to indicate we want to send a response asynchronously
        return true;
    }
});
