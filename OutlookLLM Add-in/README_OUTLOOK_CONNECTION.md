# 🚀 OutlookLLM - Connect to Your Outlook Email

## ✅ What's Ready

Your OutlookLLM system is now **fully integrated with Outlook** and ready to connect to your real email and calendar data!

## 🎯 Quick Start - Connect to Outlook

### Step 1: Start the System
```cmd
# Run this to start both servers
start_outlookllm.bat
```

### Step 2: Install the Add-in
```cmd
# Run this to install into Outlook
install_outlook_addin.bat
```

## 🔧 What's New - Real Outlook Integration

### **🧠 Live Data Processing**
- **Real Email Search**: Searches your actual Outlook inbox
- **Real Calendar Search**: Searches your actual calendar events  
- **Automatic Sync**: Automatically fetches and indexes your data
- **Privacy First**: All processing happens locally on your machine

### **🎪 Enhanced Features**
- **Live Outlook Data Badge**: Shows when using real vs. mock data
- **Sync Status**: Real-time connection status with Outlook
- **Refresh Data**: Manual sync button for latest emails/events
- **Smart Indexing**: Automatically processes your Outlook data for Q&A

## 📧 How It Works

### **When Running in Outlook:**
1. **Auto-Detection**: Automatically detects it's running in Outlook
2. **Data Sync**: Fetches your recent emails and calendar events
3. **Smart Indexing**: Processes data for semantic search
4. **Real-Time Q&A**: Answers questions using your actual data

### **When Running in Browser:**
- Falls back to sample data for testing
- All features work the same way
- Perfect for development and demos

## 🎯 Installation Methods

### **Method 1: Developer Install (Recommended for Testing)**
1. Run `install_outlook_addin.bat`
2. Choose "Y" for developer installation
3. Follow the on-screen instructions
4. The add-in will appear in Outlook ribbon

### **Method 2: Organization Install (For Production)**
1. Admin goes to Microsoft 365 Admin Center
2. Settings > Integrated apps
3. Upload `manifest.xml`
4. Deploy to users/organization

### **Method 3: Manual Install**
1. Open Outlook (desktop or web)
2. Go to Home > Get Add-ins > My add-ins
3. Add a custom add-in > Add from file
4. Select `manifest.xml`
5. Install and activate

## 🎪 Using OutlookLLM in Outlook

### **For Email Composition:**
1. Compose a new email in Outlook
2. Look for **"OutlookLLM"** group in ribbon
3. Click **"Compose with AI"** button
4. Use the AI assistant in the task pane

### **For Email Reading/Summarizing:**
1. Open any email in Outlook
2. Look for **"OutlookLLM"** group in ribbon  
3. Click **"Summarize with AI"** button
4. Get AI summary and insights

### **For Q&A with Your Data:**
1. Open either composition or reading mode
2. Switch to the **"Q&A"** tab in the task pane
3. Ask questions about your emails and calendar
4. Get intelligent answers from your real data

## 💡 Example Questions You Can Ask

### **Email Questions:**
- *"What emails do I have about budget planning?"*
- *"Show me recent emails from my manager"*
- *"Find emails about the project deadline"*
- *"What's the latest update on the quarterly review?"*

### **Calendar Questions:**
- *"What meetings do I have this week?"*
- *"When is my next project meeting?"*
- *"Show me all budget-related meetings"*
- *"What's on my calendar for tomorrow?"*

### **Combined Questions:**
- *"What's happening with the Q4 budget project?"*
- *"Give me an overview of this week's priorities"*
- *"What do I need to prepare for my next meeting?"*

## 🔧 Troubleshooting

### **Add-in Not Appearing:**
- Make sure both frontend (port 3000) and backend (port 8385) are running
- Try refreshing Outlook or restarting it
- Check that SSL certificates are trusted
- Clear Outlook cache and reload

### **SSL Certificate Issues:**
- Trust the localhost SSL certificate when prompted
- Allow mixed content if browser asks
- Run `office-addin-dev-certs install --machine`

### **Data Not Syncing:**
- Check that you're running in Outlook (not just browser)
- Look for "Outlook Integration" status in the Q&A tab
- Click "Refresh Data" button to manually sync
- Check browser console for any errors

### **Performance Issues:**
- Large mailboxes may take longer to sync
- The system processes only recent emails (last 50) and upcoming events (next 20)
- Indexing happens in the background after initial sync

## 🎯 Next Steps

1. **Test the System**: Run `start_outlookllm.bat`
2. **Install Add-in**: Run `install_outlook_addin.bat`  
3. **Open Outlook**: Look for OutlookLLM in the ribbon
4. **Start Querying**: Ask questions about your real email and calendar data!

Your OutlookLLM system is now ready to provide AI-powered assistance using your actual Outlook data! 🎉
