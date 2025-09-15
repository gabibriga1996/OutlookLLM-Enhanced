from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS from the Add-in

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize OpenAI client for OpenWebUI/Ollama
try:
    base_url = os.getenv('OPENAI_BASE_URL', 'http://localhost:11434/v1')
    api_key = os.getenv('OPENAI_API_KEY', 'ollama')
    
    client = OpenAI(
        base_url=base_url,
        api_key=api_key
    )
    print(f"✅ Connected to OpenWebUI/Ollama at: {base_url}")
except Exception as e:
    print(f"Warning: Failed to initialize OpenWebUI client: {e}")
    client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

# Default model configuration for OpenWebUI/Ollama
DEFAULT_MODEL = os.getenv('OPENAI_MODEL', 'phi3:mini')  # Default lightweight Ollama model
DEFAULT_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '500'))
DEFAULT_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))

@app.route('/composeEmail', methods=['POST'])
def composeEmail():
    """OpenAI endpoint for email composition"""
    try:
        if not request.headers.get('Content-Type') == 'application/json':
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        body = request.get_json()
        user_prompt = body.get('prompt', '')
        
        if not user_prompt.strip():
            return jsonify({'error': 'Prompt cannot be empty'}), 400
        
        app.logger.info(f'Received compose request with prompt: {user_prompt}')
        
        # Check if OpenAI API key is configured
        if not client.api_key:
            return jsonify({'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'}), 500
        
        # Create a system prompt for email composition
        system_prompt = """You are an AI assistant that helps compose professional emails. 
        Based on the user's request, generate an appropriate email with subject and body.
        Keep the tone professional but friendly. The response should be in JSON format with 'subject' and 'body' fields."""
        
        # Create the prompt for email composition
        compose_prompt = f"""Please compose an email based on this request: "{user_prompt}"
        
        Return ONLY a JSON object with two fields:
        - "subject": A clear, concise subject line
        - "body": A well-formatted email body with appropriate greetings and closing
        
        The email should be professional and appropriate for business communication."""
        
        try:
            # Call OpenAI API
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": compose_prompt}
                ],
                max_tokens=DEFAULT_MAX_TOKENS,
                temperature=DEFAULT_TEMPERATURE
            )
            
            # Extract the response
            ai_response = response.choices[0].message.content.strip()
            app.logger.info(f'OpenAI raw response: {ai_response}')
            
            # Try to parse as JSON, if that fails, create a structured response
            try:
                email_data = json.loads(ai_response)
                if 'subject' not in email_data or 'body' not in email_data:
                    raise ValueError("Missing required fields")
            except (json.JSONDecodeError, ValueError):
                # If JSON parsing fails, create a structured response
                lines = ai_response.split('\n')
                subject_line = user_prompt[:50] + "..." if len(user_prompt) > 50 else user_prompt
                email_data = {
                    'subject': f'Re: {subject_line}',
                    'body': ai_response
                }
            
            app.logger.info(f'Sending OpenAI email response: {email_data}')
            return json.dumps(email_data)
            
        except Exception as openai_error:
            app.logger.error(f'OpenAI API error: {str(openai_error)}')
            return jsonify({'error': f'OpenAI API error: {str(openai_error)}'}), 500
        
    except Exception as e:
        app.logger.error(f'Error in composeEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/summarizeEmail', methods=['POST'])
def summarizeEmail():
    """OpenAI endpoint for email summarization"""
    try:
        if not request.headers.get('Content-Type') == 'application/json':
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        body = request.get_json()
        email_content = body.get('content', '')
        
        if not email_content.strip():
            return jsonify({'error': 'Email content cannot be empty'}), 400
        
        app.logger.info(f'Received summarize request for email: {email_content[:100]}...')
        
        # Check if OpenAI API key is configured
        if not client.api_key:
            return jsonify({'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'}), 500
        
        # Create a system prompt for email summarization
        system_prompt = """You are an AI assistant that helps summarize emails. 
        Provide a clear, concise summary of the email content including key points and any action items.
        Keep the summary professional and well-structured."""
        
        # Create the prompt for email summarization
        summary_prompt = f"""Please provide a comprehensive summary of this email:

{email_content}

Include:
1. Main topic/subject
2. Key points discussed
3. Any action items or requests
4. Important dates or deadlines mentioned
5. Overall tone and priority level

Format the summary in a clear, readable way."""
        
        try:
            # Call OpenAI API
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": summary_prompt}
                ],
                max_tokens=DEFAULT_MAX_TOKENS,
                temperature=0.3  # Lower temperature for more consistent summaries
            )
            
            # Extract the response
            ai_summary = response.choices[0].message.content.strip()
            
            response_data = {'summary': ai_summary}
            app.logger.info(f'Sending OpenAI summary: {response_data}')
            return json.dumps(response_data)
            
        except Exception as openai_error:
            app.logger.error(f'OpenAI API error: {str(openai_error)}')
            return jsonify({'error': f'OpenAI API error: {str(openai_error)}'}), 500
        
    except Exception as e:
        app.logger.error(f'Error in summarizeEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/summarizeUnreadEmails', methods=['POST'])
def summarize_unread_emails():
    """Summarize multiple unread emails"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        if 'emails' not in data:
            return jsonify({'error': 'Missing emails array in request'}), 400
        
        emails = data['emails']
        if not isinstance(emails, list):
            return jsonify({'error': 'emails must be an array'}), 400
        
        if len(emails) == 0:
            return jsonify({'summary': 'No unread emails found.'}), 200
        
        # Create a system prompt for unread emails summary
        system_prompt = """You are an AI assistant that helps summarize multiple unread emails. 
        Provide a comprehensive overview of all unread emails, categorizing them by importance and topic.
        Focus on actionable items, urgent requests, and important information."""
        
        # Format all emails for summarization
        emails_text = ""
        for i, email in enumerate(emails, 1):
            subject = email.get('subject', 'No Subject')
            sender = email.get('sender', 'Unknown Sender')
            body = email.get('body', '')[:500]  # Limit body length
            date_received = email.get('dateReceived', '')
            
            emails_text += f"""
Email #{i}:
From: {sender}
Subject: {subject}
Date: {date_received}
Content: {body}
---
"""
        
        # Create the prompt for unread emails summarization
        summary_prompt = f"""Please provide a comprehensive summary of these {len(emails)} unread emails:

{emails_text}

Please organize your summary as follows:
1. **Overview**: Total number of unread emails and general categories
2. **High Priority**: Emails that require immediate attention
3. **Medium Priority**: Important emails that can be addressed soon
4. **Low Priority**: Informational emails
5. **Action Items**: Specific tasks or responses needed
6. **Key Deadlines**: Any important dates mentioned

Keep the summary concise but informative. Use Hebrew if the emails are in Hebrew."""
        
        try:
            # Call OpenAI API
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": summary_prompt}
                ],
                max_tokens=800,  # Increased for multiple emails
                temperature=0.3  # Lower temperature for more consistent summaries
            )
            
            # Extract the response
            ai_summary = response.choices[0].message.content.strip()
            
            response_data = {
                'summary': ai_summary,
                'email_count': len(emails)
            }
            app.logger.info(f'Sending unread emails summary for {len(emails)} emails')
            return json.dumps(response_data)
            
        except Exception as openai_error:
            app.logger.error(f'OpenAI API error: {str(openai_error)}')
            return jsonify({'error': f'OpenAI API error: {str(openai_error)}'}), 500
        
    except Exception as e:
        app.logger.error(f'Error in summarizeUnreadEmails: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/summarizeEmail', methods=['POST'])
def summarize_single_email():
    """Summarize a single email using OpenAI"""
    try:
        data = request.json
        email = data.get('email', {})
        
        if not email:
            return jsonify({'error': 'Email data required'}), 400
            
        # Prepare the email data for summarization
        email_text = f"""
        נושא: {email.get('subject', 'ללא נושא')}
        מאת: {email.get('sender', 'לא ידוע')}
        תוכן: {email.get('body', 'ללא תוכן')[:2000]}
        """
        
        try:
            app.logger.info(f'Summarizing single email: {email.get("subject", "No subject")}')
            
            # Create OpenAI request for email summary
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": """אתה עוזר אישי המתמחה בסיכום מיילים.
                    תפקידך לכתוב תמצית קצרה וברורה של מייל ביעברית.
                    התמצית צריכה להיות באורך של 2-3 משפטים ולכלול:
                    1. העיקר של המייל
                    2. אם יש בקשה או משימה ספציפית
                    3. אם יש מועד יעד או דחיפות
                    השתמש בעברית בלבד."""},
                    {"role": "user", "content": f"סכם את המייל הבא: {email_text}"}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            summary = response.choices[0].message.content.strip()
            
            app.logger.info(f'Generated email summary successfully')
            return jsonify({'summary': summary})
            
        except Exception as openai_error:
            app.logger.error(f'OpenAI API error: {str(openai_error)}')
            return jsonify({'error': f'OpenAI API error: {str(openai_error)}'}), 500
        
    except Exception as e:
        app.logger.error(f'Error in summarizeEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/suggestResponse', methods=['POST'])
def suggest_email_response():
    """Suggest a response to an email using OpenAI"""
    try:
        data = request.json
        email = data.get('email', {})
        
        if not email:
            return jsonify({'error': 'Email data required'}), 400
            
        # Prepare the email data for response suggestion
        email_text = f"""
        נושא: {email.get('subject', 'ללא נושא')}
        מאת: {email.get('sender', 'לא ידוע')}
        תוכן: {email.get('body', 'ללא תוכן')[:2000]}
        """
        
        try:
            app.logger.info(f'Suggesting response for email: {email.get("subject", "No subject")}')
            
            # Create OpenAI request for response suggestion
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": """אתה עוזר אישי המכין מענים מקצועיים למיילים.
                    תפקידך לכתוב מענה מתאים למייל שהתקבל.
                    המענה צריך להיות:
                    1. מקצועי ואדיב
                    2. ביעברית בלבד
                    3. לענות על השאלות או לטפל בבקשות שהועלו
                    4. קצר ולענין
                    5. לכלול פתיחה ופתרון מנומסים
                    
                    אם המייל דורש תשובה ספציפית (מידע, אישור, דחיה וכו'), תן מענה ברור.
                    אם המייל הוא הודעה בלבד, תודה על העדכון."""},
                    {"role": "user", "content": f"כתוב מענה מתאים למייל הבא: {email_text}"}
                ],
                max_tokens=300,
                temperature=0.8
            )
            
            suggested_response = response.choices[0].message.content.strip()
            
            app.logger.info(f'Generated response suggestion successfully')
            return jsonify({'response': suggested_response})
            
        except Exception as openai_error:
            app.logger.error(f'OpenAI API error: {str(openai_error)}')
            return jsonify({'error': f'OpenAI API error: {str(openai_error)}'}), 500
        
    except Exception as e:
        app.logger.error(f'Error in suggestResponse: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    api_key_status = "configured" if client.api_key else "missing"
    return jsonify({
        'status': 'healthy', 
        'message': 'OutlookLLM OpenAI Backend is running',
        'model': DEFAULT_MODEL,
        'api_key_status': api_key_status
    })

@app.route('/models', methods=['GET'])
def list_models():
    """List available OpenAI models"""
    try:
        if not client.api_key:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
            
        models = client.models.list()
        model_list = [model.id for model in models.data if 'gpt' in model.id.lower()]
        return jsonify({'models': sorted(model_list)})
    except Exception as e:
        app.logger.error(f'Error listing models: {str(e)}')
        return jsonify({'error': 'Failed to retrieve models'}), 500

if __name__ == '__main__':
    # Check for API key on startup
    if not os.getenv('OPENAI_API_KEY'):
        print("WARNING: OPENAI_API_KEY environment variable not set!")
        print("Please set your OpenAI API key in a .env file or environment variable.")
        print("Example: OPENAI_API_KEY=your_api_key_here")
    else:
        print(f"✅ OpenAI API key configured")
        print(f"✅ Using model: {DEFAULT_MODEL}")
    
    # Simple HTTP server for development
    app.run(host='127.0.0.1', port=8385, debug=True)
