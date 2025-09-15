from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS from the Add-in

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.route('/composeEmail', methods=['POST'])
def composeEmail():
    """Smart endpoint - tries OpenWebAI first, falls back to mock"""
    try:
        if not request.headers.get('Content-Type') == 'application/json':
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        body = request.get_json()
        user_prompt = body.get('prompt', '')
        use_openwebai = body.get('useOpenWebAI', False)
        
        app.logger.info(f'Received compose request with prompt: {user_prompt}')
        app.logger.info(f'Use OpenWebAI: {use_openwebai}')
        
        if use_openwebai:
            try:
                # Try to connect to OpenWebAI/Ollama for professional email rewriting
                import requests
                
                openwebai_payload = {
                    "model": "phi3:mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": """אתה עוזר AI מקצועי ויצירתי שמנסח מחדש מיילים בעברית. המטרה שלך היא:
1. לקחת רעיון גולמי ולהפוך אותו למייל מקצועי, נוח ונעים לקריאה
2. לנסח את המייל בצורה שמזמינה לתשובה ופעולה
3. להוסיף מילים נעימות ואדיבות
4. לשאול שאלות רלוונטיות כשמתאים
5. לבקש אישורים או התחייבויות כשמתאים
תמיד ענה בפורמט JSON עם שדות 'subject' ו-'body'."""
                        },
                        {
                            "role": "user", 
                            "content": f"""נסח מחדש את הטקסט הבא למייל מקצועי, נעים וידידותי בעברית. 
                            תוכל לשנות את הסגנון, להוסיף שאלות רלוונטיות ולבקש אישורים:
                            
                            "{user_prompt}"
                            
                            דוגמה לסגנון מעולה:
                            במקום "רוצה להזמין למחר את כל מדור רכש לגלידה בערב"
                            כתוב: "היי האם מדור רכש יהיה פנוי לגלידה מחר בערב? אשמח לאישורי הגעה"
                            """
                        }
                    ],
                    "max_tokens": 600,
                    "temperature": 0.8
                }
                
                # Try OpenWebAI connection
                response = requests.post(
                    "http://127.0.0.1:11434/v1/chat/completions",  # Ollama endpoint
                    json=openwebai_payload,
                    timeout=15
                )
                
                if response.status_code == 200:
                    ai_response = response.json()
                    content = ai_response['choices'][0]['message']['content']
                    
                    try:
                        # Try to parse JSON response
                        email_data = json.loads(content)
                        if 'subject' in email_data and 'body' in email_data:
                            app.logger.info(f'OpenWebAI successful response: {email_data}')
                            return jsonify(email_data)
                    except json.JSONDecodeError:
                        pass
                    
                    # If JSON parsing fails, create structured response from AI content
                    lines = content.split('\n')
                    subject_line = user_prompt[:40] + "..." if len(user_prompt) > 40 else user_prompt
                    email_data = {
                        'subject': subject_line,
                        'body': content
                    }
                    
                    app.logger.info(f'OpenWebAI structured response: {email_data}')
                    return jsonify(email_data)
                
                else:
                    app.logger.warning(f'OpenWebAI returned status: {response.status_code}')
                
            except Exception as openai_error:
                app.logger.warning(f'OpenWebAI failed: {openai_error}, using enhanced mock response')
        
        # Enhanced fallback - intelligent email rewriting
        def rewrite_professionally(text):
            """Advanced logic to make text more professional and engaging"""
            text = text.strip().lower()
            
            # Smart rewriting patterns
            if 'הזמין' in text and 'גלידה' in text:
                return "היי,\n\nאני מארגנת יציאה לגלידה! האם תהיו פנויים להצטרף אלינו?\n\nאשמח לאישורי הגעה 😊\n\nבברכה"
            
            elif 'הזמין' in text and ('פגישה' in text or 'מפגש' in text):
                return "שלום,\n\nאשמח לתאם איתך פגישה. האם התאריכים המוצעים מתאימים לך?\n\nאשמח לשמוע ממך.\n\nבברכה"
                
            elif 'תודה' in text:
                return f"שלום,\n\n{text.capitalize()}\n\nהיה נהדר לעבוד איתך.\n\nבברכה רבה"
                
            elif 'בקשה' in text or 'צריך' in text:
                return f"שלום,\n\nאשמח לבקש את עזרתך בנושא הבא:\n\n{text.capitalize()}\n\nתודה מראש!\n\nבברכה"
                
            else:
                # General improvement
                improved_text = text.capitalize()
                if not improved_text.endswith('?') and ('איך' in text or 'מה' in text or 'איפה' in text):
                    improved_text += '?'
                return f"היי,\n\n{improved_text}\n\nאשמח לשמוע ממך.\n\nבברכה"
        
        professional_body = rewrite_professionally(user_prompt)
        
        # Generate smart contextual subject
        text_lower = user_prompt.lower()
        if 'גלידה' in text_lower:
            subject = "הזמנה לגלידה! 🍦"
        elif 'פגישה' in text_lower:
            subject = "תיאום פגישה"
        elif 'תודה' in text_lower:
            subject = "תודה!"
        elif 'בקשה' in text_lower or 'עזרה' in text_lower:
            subject = "בקשה לעזרה"
        else:
            subject = user_prompt[:35] + ("..." if len(user_prompt) > 35 else "")
        
        # Fallback to enhanced mock response in Hebrew
        mock_response = {
            'subject': subject,
            'body': professional_body
        }
        
        app.logger.info(f'Sending mock response: {mock_response}')
        return jsonify(mock_response)
        
    except Exception as e:
        app.logger.error(f'Error in composeEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/summarizeEmail', methods=['POST'])
def summarizeEmail():
    """Mock endpoint for email summarization"""
    try:
        if not request.headers.get('Content-Type') == 'application/json':
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        body = request.get_json()
        email_content = body.get('content', '')
        
        app.logger.info(f'Received summarize request for email: {email_content[:100]}...')
        
        # Mock response - in a real implementation, this would call your LLM
        mock_summary = f'''**Email Summary:**

This email appears to be about: {email_content[:100]}...

**Key Points:**
- This is a mock summary generated by the OutlookLLM backend
- In a full implementation, an AI model would analyze the content
- The original email was {len(email_content)} characters long

**Action Items:**
- Review the mock implementation
- Configure a real language model for production use
'''
        
        response = {'summary': mock_summary}
        app.logger.info(f'Sending mock summary: {response}')
        return json.dumps(response)
        
    except Exception as e:
        app.logger.error(f'Error in summarizeEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/enhanceEmail', methods=['POST'])
def enhanceEmail():
    """Enhance email text with professional AI rewriting"""
    try:
        if not request.headers.get('Content-Type') == 'application/json':
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        body = request.get_json()
        user_text = body.get('text', '')
        tone = body.get('tone', 'professional')  # professional, friendly, formal
        
        app.logger.info(f'Received enhance request with text: {user_text}')
        app.logger.info(f'Requested tone: {tone}')
        
        # Try OpenWebAI/Ollama first
        try:
            import requests
            
            system_prompts = {
                'professional': """אתה עוזר AI מקצועי שמנסח מחדש מיילים בעברית. המטרה שלך:
1. לקחת רעיון גולמי ולהפוך אותו למייל מקצועי ונעים
2. לשמור על הכבוד והאדיבות
3. לבקש אישורים כשמתאים
4. להוסיף מילים נעימות
תמיד ענה בפורמט JSON עם שדות 'subject' ו-'body'.""",
                
                'friendly': """אתה עוזר AI חברותי שמנסח מחדש מיילים בעברית. המטרה שלך:
1. לקחת רעיון גולמי ולהפוך אותו למייל חם וידידותי
2. להוסיף אמוג'י כשמתאים
3. לעודד דיאלוג והתכתבות
4. לשמור על אווירה נעימה
תמיד ענה בפורמט JSON עם שדות 'subject' ו-'body'.""",
                
                'formal': """אתה עוזר AI פורמלי שמנסח מחדש מיילים בעברית. המטרה שלך:
1. לקחת רעיון גולמי ולהפוך אותו למייל רשמי ומכובד
2. להשתמש בלשון מכובדת ופורמלית
3. לשמור על מרחק מקצועי
4. לבקש בצורה מנומסת
תמיד ענה בפורמט JSON עם שדות 'subject' ו-'body'."""
            }
            
            openwebai_payload = {
                "model": "phi3:mini",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompts.get(tone, system_prompts['professional'])
                    },
                    {
                        "role": "user", 
                        "content": f"""נסח מחדש את הטקסט הבא למייל מקצועי בעברית:

"{user_text}"

דוגמאות לשיפור:
- במקום "תזמין את כל מדור רכש לגלידה מחר בערב"
- כתוב: "היי, אני מארגנת יציאה לגלידה מחר בערב ואשמח שמדור רכש יצטרף! האם אתם פנויים? אשמח לאישורי הגעה 😊"

השב בפורמט JSON בלבד עם subject ו-body."""
                    }
                ],
                "max_tokens": 600,
                "temperature": 0.8
            }
            
            # Try OpenWebAI connection
            response = requests.post(
                "http://127.0.0.1:11434/v1/chat/completions",
                json=openwebai_payload,
                timeout=15
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content = ai_response['choices'][0]['message']['content']
                
                try:
                    # Try to parse JSON response
                    email_data = json.loads(content)
                    if 'subject' in email_data and 'body' in email_data:
                        app.logger.info(f'AI enhancement successful: {email_data}')
                        return jsonify({
                            'enhanced': True,
                            'subject': email_data['subject'],
                            'body': email_data['body'],
                            'tone': tone
                        })
                except json.JSONDecodeError:
                    pass
                
                # If JSON parsing fails, create structured response
                lines = content.strip().split('\n')
                subject = user_text[:40] + "..." if len(user_text) > 40 else user_text
                
                return jsonify({
                    'enhanced': True,
                    'subject': subject,
                    'body': content,
                    'tone': tone
                })
        
        except Exception as ai_error:
            app.logger.warning(f'AI enhancement failed: {ai_error}, using smart fallback')
        
        # Smart fallback - rule-based enhancement
        def smart_enhance(text):
            original_text = text.strip()
            
            # Ice cream invitation pattern
            if 'גלידה' in text.lower():
                return {
                    'subject': 'הזמנה לגלידה! 🍦',
                    'body': f"""היי!

{original_text}

אני מארגנת יציאה לגלידה ואשמח שתצטרפו אלינו! 

📅 מתי: כפי שמתוכנן
🍦 איפה: נבחר מקום יחד

האם תהיו פנויים להצטרף? אשמח לאישורי הגעה! 😊

בברכה ובהתרגשות,
[שמך]"""
                }
            
            # Meeting/meeting invitation
            elif any(word in text.lower() for word in ['פגישה', 'מפגש', 'ישיבה', 'פגישת']):
                return {
                    'subject': 'בקשה לתיאום פגישה',
                    'body': f"""שלום רב,

{original_text}

אשמח לתאם איתך פגישה בנושא זה.

האם אחד מהתאריכים/זמנים הבאים מתאים לך?
• השבוע
• השבוע הבא  
• לפי הזמינות שלך

אשמח לשמוע ממך מתי יהיה נוח לך.

תודה מראש,
בברכה"""
                }
            
            # Help/request pattern
            elif any(word in text.lower() for word in ['עזרה', 'בקשה', 'צריך', 'סיוע']):
                return {
                    'subject': 'בקשה לעזרה',
                    'body': f"""שלום,

{original_text}

אשמח מאוד לבקש את עזרתך בנושא זה.

אם יש לך זמן פנוי ואתה יכול לסייע, אני אהיה מאוד אסיר תודה.

תודה מראש על הזמן והמחשבה!

בברכה"""
                }
            
            # General enhancement
            else:
                return {
                    'subject': original_text[:35] + ('...' if len(original_text) > 35 else ''),
                    'body': f"""היי,

{original_text}

אשמח לשמוע ממך בנושא זה ולדעת מה דעתך.

תודה מראש!

בברכה"""
                }
        
        enhanced_email = smart_enhance(user_text)
        
        return jsonify({
            'enhanced': True,
            'subject': enhanced_email['subject'],
            'body': enhanced_email['body'],
            'tone': tone,
            'fallback': True
        })
        
    except Exception as e:
        app.logger.error(f'Error in enhanceEmail: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'OutlookLLM Mock Backend is running'})

if __name__ == '__main__':
    # Simple HTTP server for development
    app.run(host='127.0.0.1', port=8385, debug=True)
