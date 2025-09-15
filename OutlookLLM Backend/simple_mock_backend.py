"""
Simple Mock Backend for OutlookLLM - RAG Q&A System
Simulates semantic search without requiring heavy ML dependencies
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
from datetime import datetime, timedelta
import time

app = Flask(__name__)
CORS(app)

# Storage for real Outlook data
OUTLOOK_EMAILS = []
OUTLOOK_EVENTS = []

# Sample data for demonstration
SAMPLE_EMAILS = [
    {
        "id": "email_1",
        "sender": "john.doe@company.com",
        "subject": "Q4 Budget Review Meeting",
        "content": "Hi team, we need to schedule our Q4 budget review. Please prepare your department's financial reports and projections. The meeting will cover revenue targets and cost optimization strategies.",
        "received_time": "2024-01-15 10:30:00",
        "similarity_score": 0.95
    },
    {
        "id": "email_2", 
        "sender": "sarah.manager@company.com",
        "subject": "Project Timeline Update",
        "content": "The development timeline has been updated. Phase 1 completion is now scheduled for February 15th. Please review the attached milestone schedule and confirm resource availability.",
        "received_time": "2024-01-14 14:20:00",
        "similarity_score": 0.87
    },
    {
        "id": "email_3",
        "sender": "finance@company.com",
        "subject": "Annual Financial Planning",
        "content": "Annual budget planning sessions start next week. Each department head should prepare their 2024 budget proposals including projected expenses and revenue forecasts.",
        "received_time": "2024-01-13 09:15:00",
        "similarity_score": 0.78
    }
]

SAMPLE_EVENTS = [
    {
        "id": "event_1",
        "title": "Q4 Budget Review",
        "organizer": "john.doe@company.com",
        "description": "Quarterly budget review meeting to discuss financial performance and planning for next quarter",
        "start_time": "2024-01-20 14:00:00",
        "end_time": "2024-01-20 15:30:00",
        "attendees": ["sarah.manager@company.com", "finance@company.com"],
        "similarity_score": 0.92
    },
    {
        "id": "event_2",
        "title": "Project Milestone Review",
        "organizer": "sarah.manager@company.com", 
        "description": "Review project progress and discuss upcoming milestones and deliverables",
        "start_time": "2024-01-18 10:00:00",
        "end_time": "2024-01-18 11:00:00",
        "attendees": ["john.doe@company.com", "dev.team@company.com"],
        "similarity_score": 0.85
    }
]

def simulate_semantic_search(query, data_type="emails", use_outlook_data=False):
    """Simulate semantic search by matching keywords"""
    query_lower = query.lower()
    keywords = query_lower.split()
    
    if data_type == "emails":
        # Use real Outlook data if available and requested
        email_source = OUTLOOK_EMAILS if (use_outlook_data and OUTLOOK_EMAILS) else SAMPLE_EMAILS
        results = []
        
        for email in email_source:
            # Handle different email formats from Outlook vs sample data
            content = email.get("content", email.get("body", ""))
            subject = email.get("subject", email.get("title", ""))
            
            content_words = content.lower().split() + subject.lower().split()
            matches = sum(1 for keyword in keywords if any(keyword in word for word in content_words))
            
            if matches > 0:
                # Simulate similarity score based on keyword matches
                email_copy = email.copy()
                email_copy["similarity_score"] = min(0.95, 0.5 + (matches * 0.15))
                results.append(email_copy)
        
        # Sort by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:3]  # Return top 3 matches
    
    elif data_type == "events":
        # Use real Outlook data if available and requested
        event_source = OUTLOOK_EVENTS if (use_outlook_data and OUTLOOK_EVENTS) else SAMPLE_EVENTS
        results = []
        
        for event in event_source:
            # Handle different event formats
            description = event.get("description", event.get("body", ""))
            title = event.get("title", event.get("subject", ""))
            
            content_words = description.lower().split() + title.lower().split()
            matches = sum(1 for keyword in keywords if any(keyword in word for word in content_words))
            
            if matches > 0:
                event_copy = event.copy()
                event_copy["similarity_score"] = min(0.95, 0.5 + (matches * 0.15))
                results.append(event_copy)
        
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:3]
    
    return []

def generate_smart_answer(query, relevant_emails, relevant_events):
    """Generate a contextual answer based on found emails and events"""
    
    # Check for common query patterns
    query_lower = query.lower()
    
    if "budget" in query_lower or "financial" in query_lower:
        if relevant_emails or relevant_events:
            return "Based on your emails and calendar, I found several budget-related items. Your Q4 budget review is scheduled, and finance has requested department budget proposals. The upcoming budget meeting on January 20th will cover revenue targets and cost optimization."
        else:
            return "I can help with budget-related questions. Could you be more specific about what budget information you're looking for?"
    
    elif "meeting" in query_lower or "schedule" in query_lower:
        if relevant_events:
            events_info = ", ".join([f"{event['title']} on {event['start_time'][:10]}" for event in relevant_events])
            return f"I found these relevant meetings: {events_info}. Would you like me to provide more details about any of these meetings?"
        else:
            return "I can help you find information about meetings and schedules. What specific meeting or time period are you asking about?"
    
    elif "project" in query_lower or "timeline" in query_lower:
        if relevant_emails:
            return "Based on your recent emails, there have been project timeline updates. Phase 1 completion is scheduled for February 15th, and there's a project milestone review meeting coming up."
        else:
            return "I can help with project-related information. What specific project or timeline are you asking about?"
    
    else:
        # Generic response with context
        if relevant_emails or relevant_events:
            return f"I found {len(relevant_emails)} relevant emails and {len(relevant_events)} related calendar events that might help answer your question. You can review the sources below for more details."
        else:
            return "I'd be happy to help you find information from your emails and calendar. Could you provide more specific details about what you're looking for?"

@app.route('/')
def home():
    return jsonify({
        "message": "OutlookLLM Backend API",
        "endpoints": ["/compose", "/query/inbox", "/query/calendar", "/health"],
        "status": "running",
        "rag_system": "simulated"
    })

@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "rag_system": "simulated_active"
    })

@app.route('/compose', methods=['POST'])
def compose_email():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        # Simulate AI email composition
        time.sleep(1)  # Simulate processing time
        
        if "meeting" in prompt.lower():
            response = f"Subject: Meeting Request\n\nHi there,\n\nI hope this email finds you well. I would like to schedule a meeting to discuss {prompt.lower().replace('meeting about', '').replace('meeting for', '').strip()}.\n\nPlease let me know your availability for the upcoming week.\n\nBest regards"
        elif "follow up" in prompt.lower():
            response = f"Subject: Follow Up\n\nHi,\n\nI wanted to follow up on our previous discussion regarding {prompt.lower().replace('follow up on', '').replace('follow up about', '').strip()}.\n\nLooking forward to your response.\n\nBest regards"
        else:
            response = f"Subject: Re: {prompt[:50]}\n\nHi,\n\nThank you for your message. I'll be happy to help with {prompt}.\n\nPlease let me know if you need any additional information.\n\nBest regards"
        
        return jsonify({
            "success": True,
            "email_content": response,
            "model_used": "mock-gpt-4"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/query/inbox', methods=['POST'])
def query_inbox():
    try:
        data = request.get_json()
        query = data.get('query', '')
        use_outlook_data = data.get('use_outlook_data', False)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Simulate processing time
        time.sleep(1.5)
        
        # Simulate semantic search
        relevant_emails = simulate_semantic_search(query, "emails", use_outlook_data)
        
        # Generate contextual answer
        answer = generate_smart_answer(query, relevant_emails, [])
        
        data_source = "Live Outlook Data" if (use_outlook_data and OUTLOOK_EMAILS) else "Sample Data"
        
        return jsonify({
            "success": True,
            "question": query,
            "answer": answer,
            "relevant_emails": relevant_emails,
            "context_used": len(relevant_emails) > 0,
            "search_type": "inbox",
            "data_source": data_source,
            "processing_time": "1.5s"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/query/calendar', methods=['POST'])
def query_calendar():
    try:
        data = request.get_json()
        query = data.get('query', '')
        use_outlook_data = data.get('use_outlook_data', False)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Simulate processing time
        time.sleep(1.2)
        
        # Simulate semantic search
        relevant_events = simulate_semantic_search(query, "events", use_outlook_data)
        
        # Generate contextual answer
        answer = generate_smart_answer(query, [], relevant_events)
        
        data_source = "Live Outlook Data" if (use_outlook_data and OUTLOOK_EVENTS) else "Sample Data"
        
        return jsonify({
            "success": True,
            "question": query,
            "answer": answer,
            "relevant_events": relevant_events,
            "context_used": len(relevant_events) > 0,
            "search_type": "calendar",
            "data_source": data_source,
            "processing_time": "1.2s"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/query/combined', methods=['POST'])
def query_combined():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Simulate processing time
        time.sleep(2)
        
        # Search both emails and events
        relevant_emails = simulate_semantic_search(query, "emails")
        relevant_events = simulate_semantic_search(query, "events")
        
        # Generate comprehensive answer
        answer = generate_smart_answer(query, relevant_emails, relevant_events)
        
        return jsonify({
            "success": True,
            "question": query,
            "answer": answer,
            "relevant_emails": relevant_emails,
            "relevant_events": relevant_events,
            "context_used": len(relevant_emails) > 0 or len(relevant_events) > 0,
            "search_type": "combined",
            "processing_time": "2.0s"
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/index/outlook', methods=['POST'])
def index_outlook_data():
    """Endpoint to receive and index real Outlook data"""
    try:
        data = request.get_json()
        emails = data.get('emails', [])
        events = data.get('events', [])
        
        # Store the real Outlook data
        global OUTLOOK_EMAILS, OUTLOOK_EVENTS
        OUTLOOK_EMAILS = emails
        OUTLOOK_EVENTS = events
        
        print(f"📧 Indexed {len(emails)} emails and {len(events)} calendar events from Outlook")
        
        return jsonify({
            "success": True,
            "indexed_emails": len(emails),
            "indexed_events": len(events),
            "message": "Outlook data successfully indexed"
        })
    
    except Exception as e:
        print(f"Error indexing Outlook data: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting OutlookLLM Simple Mock Backend...")
    print("📧 Simulated RAG system ready")
    print("🔗 Running on http://localhost:8385")
    print("\nAvailable endpoints:")
    print("  • POST /compose - AI email composition")
    print("  • POST /query/inbox - Search emails with Q&A")
    print("  • POST /query/calendar - Search calendar with Q&A")
    print("  • POST /query/combined - Search both emails and calendar")
    print("  • POST /index/outlook - Index real Outlook data")
    print("  • GET /health - Health check")
    print("\n🎯 Ready for Outlook integration!")
    print("📱 Use install_outlook_addin.bat to connect to Outlook")
    
    app.run(host='0.0.0.0', port=8385, debug=True)
