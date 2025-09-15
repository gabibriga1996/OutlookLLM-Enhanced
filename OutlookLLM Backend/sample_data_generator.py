"""
Sample data generator for OutlookLLM RAG system
Generates mock emails and calendar events for testing
"""

import json
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

def generate_sample_emails() -> List[Dict[str, Any]]:
    """Generate sample email data for testing"""
    
    senders = [
        "john.doe@company.com",
        "sarah.smith@partner.com", 
        "mike.johnson@client.org",
        "lisa.brown@vendor.net",
        "alex.wilson@team.com",
        "hr@company.com",
        "support@software.com",
        "marketing@company.com"
    ]
    
    subjects_and_bodies = [
        {
            "subject": "Quarterly Budget Review Meeting",
            "body": "Hi team, We need to schedule our quarterly budget review meeting for next week. Please review the attached financial reports and come prepared with your department's budget proposals. The meeting will cover Q4 expenses and Q1 planning. Let me know your availability for Tuesday or Wednesday afternoon."
        },
        {
            "subject": "Project Alpha Status Update",
            "body": "Dear stakeholders, Project Alpha is currently 75% complete and on track for the December deadline. We've successfully implemented the core features and are now in the testing phase. The remaining tasks include final UI polish, security audit, and documentation. No major blockers at this time."
        },
        {
            "subject": "New Employee Onboarding Process",
            "body": "Welcome to the team! Please complete the following onboarding steps: 1) Fill out HR paperwork, 2) Attend security training on Friday, 3) Set up your development environment, 4) Schedule meetings with team leads. Your buddy Sarah will help you through the process."
        },
        {
            "subject": "Client Meeting Rescheduled",
            "body": "Hi everyone, The client meeting originally scheduled for tomorrow has been moved to Friday at 2 PM due to their CEO being unavailable. Please update your calendars accordingly. We'll be discussing the new contract terms and project timeline."
        },
        {
            "subject": "Software License Renewal",
            "body": "This is a reminder that our development software licenses expire on December 31st. Please review the attached renewal quote and approve the purchase order. The new licenses include additional features for code analysis and team collaboration."
        },
        {
            "subject": "Team Building Event Planning",
            "body": "We're organizing a team building event for the end of the month. Current options include: escape room, cooking class, or outdoor adventure course. Please vote in the attached poll by Friday. The event will be during work hours and lunch will be provided."
        },
        {
            "subject": "Security Incident Report",
            "body": "URGENT: We detected suspicious login attempts on several accounts last night. Please change your passwords immediately and enable two-factor authentication. No data was compromised, but we're implementing additional security measures as a precaution."
        },
        {
            "subject": "Monthly Newsletter - November",
            "body": "This month's highlights include: successful product launch, 3 new team members, partnership with TechCorp, and upcoming holiday schedule. Don't miss the employee spotlight featuring our lead developer and tips for remote work productivity."
        }
    ]
    
    emails = []
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(len(subjects_and_bodies)):
        email_data = subjects_and_bodies[i]
        emails.append({
            "id": f"email_{i+1}",
            "subject": email_data["subject"],
            "body": email_data["body"],
            "sender": random.choice(senders),
            "recipients": ["user@company.com"],
            "date": (base_date + timedelta(days=random.randint(0, 30))).isoformat(),
            "folder": random.choice(["Inbox", "Important", "Projects"]),
            "importance": random.choice(["Normal", "High", "Low"])
        })
    
    return emails

def generate_sample_calendar_events() -> List[Dict[str, Any]]:
    """Generate sample calendar events for testing"""
    
    organizers = [
        "sarah.manager@company.com",
        "john.lead@company.com",
        "hr@company.com",
        "client@partner.com",
        "vendor@supplier.net"
    ]
    
    events_data = [
        {
            "subject": "Weekly Team Standup",
            "body": "Regular weekly standup to discuss progress, blockers, and upcoming tasks. Each team member will share updates on their current work and any assistance needed.",
            "location": "Conference Room A"
        },
        {
            "subject": "Client Presentation - Q4 Results",
            "body": "Quarterly business review with our major client. We'll present Q4 achievements, upcoming roadmap, and discuss contract renewal terms.",
            "location": "Board Room"
        },
        {
            "subject": "Code Review Session",
            "body": "Technical review of the new authentication module. We'll go through the implementation, discuss security considerations, and ensure code quality standards.",
            "location": "Development Lab"
        },
        {
            "subject": "Budget Planning Workshop",
            "body": "Annual budget planning session for the upcoming fiscal year. Department heads will present their budget requirements and resource allocation needs.",
            "location": "Main Conference Room"
        },
        {
            "subject": "Employee Training - Cybersecurity",
            "body": "Mandatory cybersecurity training covering phishing prevention, password policies, and data protection protocols. All employees must attend.",
            "location": "Training Center"
        },
        {
            "subject": "Product Launch Planning",
            "body": "Strategic planning meeting for the upcoming product launch. Marketing, development, and sales teams will coordinate launch activities and timelines.",
            "location": "Innovation Hub"
        },
        {
            "subject": "Vendor Integration Meeting",
            "body": "Technical discussion with our payment processing vendor about API integration and compliance requirements for the new e-commerce platform.",
            "location": "Virtual Meeting"
        },
        {
            "subject": "All-Hands Company Meeting",
            "body": "Monthly all-hands meeting with CEO update on company performance, new initiatives, and Q&A session with leadership team.",
            "location": "Main Auditorium"
        }
    ]
    
    events = []
    base_date = datetime.now()
    
    for i, event_data in enumerate(events_data):
        start_time = base_date + timedelta(days=random.randint(-15, 30), hours=random.randint(9, 17))
        end_time = start_time + timedelta(hours=random.randint(1, 3))
        
        events.append({
            "id": f"event_{i+1}",
            "subject": event_data["subject"],
            "body": event_data["body"],
            "organizer": random.choice(organizers),
            "attendees": ["user@company.com", random.choice(organizers)],
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "location": event_data["location"],
            "category": random.choice(["Meeting", "Training", "Review", "Planning"])
        })
    
    return events

def save_sample_data():
    """Save sample data to JSON files"""
    emails = generate_sample_emails()
    events = generate_sample_calendar_events()
    
    with open('sample_emails.json', 'w') as f:
        json.dump(emails, f, indent=2)
    
    with open('sample_events.json', 'w') as f:
        json.dump(events, f, indent=2)
    
    print(f"Generated {len(emails)} sample emails and {len(events)} sample events")
    return emails, events

if __name__ == "__main__":
    emails, events = save_sample_data()
