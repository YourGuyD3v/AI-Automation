# Data model

## Core entities

### Job

A job record represents one opportunity discovered by the search pipeline.

Core source fields:

- `title`: sanitized job title
- `company`: employer name
- `source`: where the job was found, such as LinkedIn, Wellfound, or a company careers page
- `url`: canonical job link
- `application_url`: direct application or career portal URL, when available
- `location`: city, region, or remote location text
- `remote_status`: remote, hybrid, or onsite
- `employment_type`: full-time, contract, internship, etc.
- `salary`: compensation if present in source data
- `posted_at`: date or relative posting date
- `description`: summary or full listing text
- `requirements`: skills or qualifications extracted from the listing

### Job evaluation fields

The actual workflow does not stop at raw job metadata. It also creates a structured evaluation record for each candidate match.

These fields are critical to the real implementation and appear in the job review output:

- `skills`: relevant skill set extracted from the role and the candidate profile
- `category`: job grouping such as AI Automation / n8n, Workflow Automation, or AI Engineer / Automation
- `storage_sheet`: destination log, such as Job Log / AI Automation
- `initial_relevance`: a first-pass relevance signal before detailed scoring
- `technical_match`: how closely the job matches the candidate's technical capabilities
- `experience_match`: how closely the job matches the candidate's experience level and track record
- `overall_match`: combined score used for final decisioning
- `strengths`: explanation of where the candidate aligns well with the role
- `skill_gaps`: missing or weaker areas relative to the target position
- `recommendation`: one of APPLY, CONSIDER, or similar human review guidance
- `tailored_resume`: a job-specific resume bullet set generated for the application
- `cover_letter_proposal`: a drafted cover letter or application message
- `application_status`: whether the role has been applied to, considered, or left pending
- `date_found`: when the role was first discovered
- `output`: final textual summary or export object generated for the report

### Candidate profile

This is the profile used by the AI Agent to judge job suitability. In the implementation, the candidate context comes from documents and structured recall sources, not only a flat JSON record.

Relevant inputs include:

- resume content
- executive-summary / extraction-summary context
- role preferences
- skill strengths
- geographic constraints
- experience focus
- degree or work authorization preferences, when present

### Job log row

Each Google Sheets row is effectively a persisted job record with additional operational metadata such as:

- storage sheet name
- date processed
- status
- match explanation
- report-generation metadata
- follow-up action or application state

## Example normalized record

```json
{
  "job_id": 2,
  "title": "N8N Automation Intern",
  "company": "Venture Builders Pvt Ltd",
  "location": "Remote",
  "source": "Indeed",
  "url": "https://in.indeed.com/q-n8n-automation-jobs.html",
  "application_url": "https://in.indeed.com/q-n8n-automation-jobs.html",
  "remote_status": "Remote",
  "employment_type": "Full-time / Internship",
  "salary": "₹5,000 - ₹8,000 per month",
  "posted_at": "2026-09-04",
  "description": "Build and manage automation workflows using N8N. Integrate APIs, webhooks, CRMs, Google Sheets, and AI tools. Use JavaScript for data processing and custom workflow logic. Monitor, troubleshoot, and optimize automation workflows. Build lead-generation, CRM, follow-up, and reporting automations.",
  "key_requirements": [
    "Strong JavaScript knowledge",
    "understanding of APIs",
    "webhooks",
    "JSON",
    "automation logic",
    "N8N / Make.com / Zapier",
    "Python",
    "web scraping",
    "AI APIs",
    "databases"
  ],
  "skills": [
    "JavaScript",
    "n8n",
    "APIs",
    "webhooks",
    "Google Sheets",
    "AI tools",
    "automation workflows"
  ],
  "category": "AI Automation / n8n",
  "storage_sheet": "Job Log / AI Automation",
  "initial_relevance": 90,
  "technical_match": 82,
  "experience_match": 68,
  "overall_match": 76,
  "strengths": "Direct fit for n8n automation, API workflows, CRM integrations, and AI tooling use cases.",
  "skill_gaps": "Needs stronger hands-on experience with full automation deployment and production workflow monitoring.",
  "recommendation": "CONSIDER",
  "tailored_resume": "• Built automation workflows using n8n to connect APIs, webhooks, Google Sheets, and AI systems.\n• Created workflow logic for lead generation, data processing, and reporting automations using JavaScript.",
  "cover_letter_proposal": "Dear Hiring Manager,\n\nI am excited to apply for the N8N Automation Intern role. My background in workflow automation, JavaScript, and API integration aligns strongly with your requirements...",
  "application_status": "Pending",
  "date_found": "2026-09-10",
  "is_new": true,
  "output": "Job reviewed, matched to AI automation skills, and prepared for human follow-up."
}
```

## Relationship model

The relationship is effectively:

- one user profile to many job comparisons
- many jobs to one category
- many categories to one job log sheet
- many rows to one report generation output
- many generated application drafts to one final review cycle

## Why this matters

The workflow depends on stable field names and consistent normalization. If the same job appears across multiple sources, the system needs to match on the right combination of:

- URL
- company + title
- description similarity
- normalized remote/location field
- candidate skill overlap
- technical and experience alignment
- prior job log membership

This is what allows duplicate detection, relevance scoring, and final recommendation logic to work reliably.
