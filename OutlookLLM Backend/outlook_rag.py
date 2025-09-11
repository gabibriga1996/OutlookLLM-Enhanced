import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
from transformers import AutoTokenizer, AutoModel
import torch
import pickle
from dataclasses import dataclass

@dataclass
class EmailDocument:
    """Represents an email document for RAG"""
    id: str
    subject: str
    body: str
    sender: str
    recipients: List[str]
    date: datetime
    folder: str
    importance: str
    embedding: Optional[np.ndarray] = None

@dataclass
class CalendarEvent:
    """Represents a calendar event for RAG"""
    id: str
    subject: str
    body: str
    organizer: str
    attendees: List[str]
    start_time: datetime
    end_time: datetime
    location: str
    category: str
    embedding: Optional[np.ndarray] = None

class OutlookRAGSystem:
    """RAG system for Outlook Inbox and Calendar Q&A"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.email_documents: List[EmailDocument] = []
        self.calendar_events: List[CalendarEvent] = []
        self.embeddings_cache_file = "outlook_embeddings.pkl"
        
        # Initialize the embedding model
        self._load_embedding_model()
        
        # Load cached embeddings if available
        self._load_cached_embeddings()
        
        logging.info(f"OutlookRAG initialized with {len(self.email_documents)} emails and {len(self.calendar_events)} events")
    
    def _load_embedding_model(self):
        """Load the sentence transformer model for embeddings"""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            logging.info(f"Loaded SentenceTransformer: {self.model_name}")
        except ImportError:
            # Fallback to basic transformers
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            logging.info(f"Loaded basic transformer: {self.model_name}")
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        try:
            if hasattr(self.model, 'encode'):
                # SentenceTransformer
                return self.model.encode(text, convert_to_numpy=True)
            else:
                # Basic transformer
                inputs = self.tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    embeddings = outputs.last_hidden_state.mean(dim=1)
                return embeddings.numpy().flatten()
        except Exception as e:
            logging.error(f"Error generating embedding: {e}")
            # Return random embedding as fallback
            return np.random.rand(384)
    
    def add_email(self, email_data: Dict[str, Any]) -> str:
        """Add an email to the RAG system"""
        email_id = email_data.get('id', f"email_{len(self.email_documents)}")
        
        # Create text for embedding
        email_text = f"Subject: {email_data.get('subject', '')} Body: {email_data.get('body', '')} Sender: {email_data.get('sender', '')}"
        
        email_doc = EmailDocument(
            id=email_id,
            subject=email_data.get('subject', ''),
            body=email_data.get('body', ''),
            sender=email_data.get('sender', ''),
            recipients=email_data.get('recipients', []),
            date=datetime.fromisoformat(email_data.get('date', datetime.now().isoformat())),
            folder=email_data.get('folder', 'Inbox'),
            importance=email_data.get('importance', 'Normal'),
            embedding=self._get_embedding(email_text)
        )
        
        self.email_documents.append(email_doc)
        logging.info(f"Added email: {email_doc.subject}")
        return email_id
    
    def add_calendar_event(self, event_data: Dict[str, Any]) -> str:
        """Add a calendar event to the RAG system"""
        event_id = event_data.get('id', f"event_{len(self.calendar_events)}")
        
        # Create text for embedding
        event_text = f"Subject: {event_data.get('subject', '')} Body: {event_data.get('body', '')} Location: {event_data.get('location', '')} Organizer: {event_data.get('organizer', '')}"
        
        event = CalendarEvent(
            id=event_id,
            subject=event_data.get('subject', ''),
            body=event_data.get('body', ''),
            organizer=event_data.get('organizer', ''),
            attendees=event_data.get('attendees', []),
            start_time=datetime.fromisoformat(event_data.get('start_time', datetime.now().isoformat())),
            end_time=datetime.fromisoformat(event_data.get('end_time', (datetime.now() + timedelta(hours=1)).isoformat())),
            location=event_data.get('location', ''),
            category=event_data.get('category', 'Meeting'),
            embedding=self._get_embedding(event_text)
        )
        
        self.calendar_events.append(event)
        logging.info(f"Added calendar event: {event.subject}")
        return event_id
    
    def search_emails(self, query: str, top_k: int = 5) -> List[EmailDocument]:
        """Search emails using semantic similarity"""
        if not self.email_documents:
            return []
        
        query_embedding = self._get_embedding(query)
        similarities = []
        
        for email in self.email_documents:
            if email.embedding is not None:
                similarity = np.dot(query_embedding, email.embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(email.embedding)
                )
                similarities.append((similarity, email))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [email for _, email in similarities[:top_k]]
    
    def search_calendar(self, query: str, top_k: int = 5) -> List[CalendarEvent]:
        """Search calendar events using semantic similarity"""
        if not self.calendar_events:
            return []
        
        query_embedding = self._get_embedding(query)
        similarities = []
        
        for event in self.calendar_events:
            if event.embedding is not None:
                similarity = np.dot(query_embedding, event.embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(event.embedding)
                )
                similarities.append((similarity, event))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [event for _, event in similarities[:top_k]]
    
    def query_inbox(self, question: str) -> Dict[str, Any]:
        """Answer questions about inbox using RAG"""
        relevant_emails = self.search_emails(question, top_k=3)
        
        context = "Relevant emails:\n"
        for i, email in enumerate(relevant_emails):
            context += f"Email {i+1}:\n"
            context += f"From: {email.sender}\n"
            context += f"Subject: {email.subject}\n"
            context += f"Date: {email.date.strftime('%Y-%m-%d %H:%M')}\n"
            context += f"Body: {email.body[:200]}...\n\n"
        
        return {
            "question": question,
            "context": context,
            "relevant_emails": [
                {
                    "id": email.id,
                    "subject": email.subject,
                    "sender": email.sender,
                    "date": email.date.isoformat(),
                    "folder": email.folder
                } for email in relevant_emails
            ]
        }
    
    def query_calendar(self, question: str) -> Dict[str, Any]:
        """Answer questions about calendar using RAG"""
        relevant_events = self.search_calendar(question, top_k=3)
        
        context = "Relevant calendar events:\n"
        for i, event in enumerate(relevant_events):
            context += f"Event {i+1}:\n"
            context += f"Subject: {event.subject}\n"
            context += f"Organizer: {event.organizer}\n"
            context += f"Start: {event.start_time.strftime('%Y-%m-%d %H:%M')}\n"
            context += f"End: {event.end_time.strftime('%Y-%m-%d %H:%M')}\n"
            context += f"Location: {event.location}\n"
            context += f"Description: {event.body[:200]}...\n\n"
        
        return {
            "question": question,
            "context": context,
            "relevant_events": [
                {
                    "id": event.id,
                    "subject": event.subject,
                    "organizer": event.organizer,
                    "start_time": event.start_time.isoformat(),
                    "end_time": event.end_time.isoformat(),
                    "location": event.location
                } for event in relevant_events
            ]
        }
    
    def save_embeddings_cache(self):
        """Save embeddings to cache file"""
        try:
            cache_data = {
                'emails': self.email_documents,
                'events': self.calendar_events
            }
            with open(self.embeddings_cache_file, 'wb') as f:
                pickle.dump(cache_data, f)
            logging.info("Embeddings cache saved successfully")
        except Exception as e:
            logging.error(f"Error saving embeddings cache: {e}")
    
    def _load_cached_embeddings(self):
        """Load embeddings from cache file"""
        try:
            if os.path.exists(self.embeddings_cache_file):
                with open(self.embeddings_cache_file, 'rb') as f:
                    cache_data = pickle.load(f)
                self.email_documents = cache_data.get('emails', [])
                self.calendar_events = cache_data.get('events', [])
                logging.info("Loaded embeddings from cache")
        except Exception as e:
            logging.error(f"Error loading embeddings cache: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG system"""
        return {
            "total_emails": len(self.email_documents),
            "total_events": len(self.calendar_events),
            "model_name": self.model_name,
            "cache_file": self.embeddings_cache_file
        }
