type PageType = 'indeed' | 'glassdoor' | 'linkedin';

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
    const host = window.location.hostname;
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('glassdoor.com')) return 'glassdoor';
    return 'indeed';
}

function getScraperForPageType(pageType: PageType): () => JobData {
    const scrapers: Record<PageType, () => JobData> = {
        indeed: scrapeIndeedJob,
        glassdoor: scrapeGlassdoorJob,
        linkedin: scrapeLinkedinJob,
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

function scrapeLinkedinJob(): JobData {
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title')
        || document.querySelector('.jobs-unified-top-card__job-title')
        || document.querySelector('.topcard__title')
        || document.querySelector('h1.t-24');
    let jobTitle = titleEl?.textContent?.trim() || '';

    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a')
        || document.querySelector('.job-details-jobs-unified-top-card__company-name')
        || document.querySelector('.jobs-unified-top-card__company-name a')
        || document.querySelector('.jobs-unified-top-card__company-name')
        || document.querySelector('.topcard__org-name-link')
        || document.querySelector('.topcard__flavor');
    let company = companyEl?.textContent?.trim() || '';

    const locationEl = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container')
        || document.querySelector('.jobs-unified-top-card__bullet')
        || document.querySelector('.topcard__flavor--bullet');
    let location = locationEl?.textContent?.trim().split('·')[0]?.trim() || '';

    const descriptionEl = document.querySelector('.jobs-description-content__text')
        || document.querySelector('.jobs-description__content')
        || document.querySelector('.description__text')
        || document.querySelector('[data-testid="expandable-text-box"]');
    let description = descriptionEl?.textContent?.trim() || '';

    // Fallbacks for the newer LinkedIn layout with obfuscated class names.
    // The company is on a container with aria-label="Company, <Name>." and the
    // job title sits in a sibling <p>.
    if (!company) {
        const companyAria = document.querySelector('[aria-label^="Company, "]') as HTMLElement | null;
        const ariaLabel = companyAria?.getAttribute('aria-label') || '';
        company = ariaLabel.replace(/^Company,\s*/, '').replace(/\.+$/, '').trim();
        if (!jobTitle && companyAria) {
            const titleP = companyAria.parentElement?.parentElement?.querySelector('p');
            if (titleP) jobTitle = titleP.textContent?.trim() || '';
        }
    }

    // Final fallback: parse document.title — "<Title> | <Company> | LinkedIn".
    if (!jobTitle || !company) {
        const parts = document.title.split('|').map(s => s.trim());
        if (!jobTitle && parts[0]) jobTitle = parts[0];
        if (!company && parts[1]) company = parts[1];
    }

    if (!location) {
        const companyAria = document.querySelector('[aria-label^="Company, "]');
        const sibling = companyAria?.closest('div')?.parentElement?.querySelectorAll('p');
        sibling?.forEach(p => {
            if (location) return;
            const text = p.textContent?.trim() || '';
            if (text.includes('·')) {
                location = text.split('·')[0].trim();
            }
        });
    }

    let url = window.location.href;
    const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
    const currentJobId = new URL(url).searchParams.get('currentJobId');
    const jobId = jobIdMatch?.[1] || currentJobId;
    if (jobId) {
        url = `https://www.linkedin.com/jobs/view/${jobId}/`;
    }

    return {
        jobTitle: jobTitle || 'N/A',
        company: company || 'N/A',
        location: location || 'N/A',
        description: description || 'N/A',
        url,
    };
}

function scrapeIndeedJob(): JobData {
    const jobTitle = document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim()
        || document.querySelector('h2[data-testid="simpler-jobTitle"]')?.textContent?.trim()
        || document.querySelector('div[data-testid="jobDetailTitle"]')?.textContent?.trim()
        || 'N/A';
    const company = document.querySelector('[data-company-name]')?.textContent?.trim()
        || document.querySelector('div[data-testid="jobDetailSubtitle"]')?.textContent?.trim()
        || document.querySelector('a.jobsearch-JobInfoHeader-companyNameLink')?.textContent?.trim()
        || 'N/A';
    const location = document.querySelector('[data-testid=job-location]')?.textContent?.trim()
        || document.querySelector('div[data-testid="jobsearch-JobInfoHeader-companyLocation"]')?.textContent?.trim()
        || 'N/A';
    const description = document.querySelector('div#jobDescriptionText')?.textContent?.trim()
        || document.querySelector('div[data-testid="jobDetailDescription"]')?.textContent?.trim()
        || 'N/A';
    let url = 'N/A';
    const headerContainer = document.querySelector('.jobsearch-HeaderContainer');
    const headerLink = headerContainer?.querySelector('a');
    const vjk = new URL(document.URL).searchParams.get("vjk"); // vjk is the job ad id in the search page

    if (headerLink?.href) {
        const jobAdUrl = new URL(headerLink.href);
        const fromjk = jobAdUrl.searchParams.get("fromjk");
        if (fromjk) {
            url = `https://indeed.com/viewjob?jk=${fromjk}`;
        }
    } else if (vjk) {
        url = `https://indeed.com/viewjob?jk=${vjk}`;
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
