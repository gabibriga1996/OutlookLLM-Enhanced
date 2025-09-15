"""
Quick test script to demonstrate RAG functionality
"""

import requests
import json

def test_rag_endpoints():
    base_url = "http://localhost:8385"
    
    print("🧪 Testing OutlookLLM RAG Endpoints")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
        print()
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test inbox query
    print("📧 Testing Inbox Query:")
    inbox_query = {
        "query": "What's happening with the budget review?"
    }
    
    try:
        response = requests.post(f"{base_url}/query/inbox", 
                               json=inbox_query,
                               headers={"Content-Type": "application/json"})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Question: {result['question']}")
            print(f"   Answer: {result['answer']}")
            print(f"   Found {len(result.get('relevant_emails', []))} relevant emails")
            print(f"   Context Used: {result.get('context_used', False)}")
        else:
            print(f"   Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Inbox Query Failed: {e}")
    
    # Test calendar query
    print("📅 Testing Calendar Query:")
    calendar_query = {
        "query": "When is my next project meeting?"
    }
    
    try:
        response = requests.post(f"{base_url}/query/calendar", 
                               json=calendar_query,
                               headers={"Content-Type": "application/json"})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Question: {result['question']}")
            print(f"   Answer: {result['answer']}")
            print(f"   Found {len(result.get('relevant_events', []))} relevant events")
            print(f"   Context Used: {result.get('context_used', False)}")
        else:
            print(f"   Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Calendar Query Failed: {e}")
    
    # Test email composition
    print("✍️ Testing Email Composition:")
    compose_query = {
        "prompt": "Write a follow up email about the budget meeting"
    }
    
    try:
        response = requests.post(f"{base_url}/compose", 
                               json=compose_query,
                               headers={"Content-Type": "application/json"})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Success: {result['success']}")
            print(f"   Generated Email:")
            print(f"   {result['email_content']}")
        else:
            print(f"   Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Email Composition Failed: {e}")

if __name__ == "__main__":
    test_rag_endpoints()
