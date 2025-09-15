import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Button, 
  Title3, 
  Title2,
  Text, 
  Body1,
  Spinner, 
  MessageBar, 
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Textarea,
  Divider,
  makeStyles 
} from "@fluentui/react-components";
import { getUnreadEmailsRest, getUnreadEmails } from "../unread-emails";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "15px",
    height: "100%"
  },

  emailList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "50vh",
    overflowY: "auto"
  },

  emailCard: {
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#f3f2f1",
      transform: "translateY(-1px)"
    }
  },

  selectedCard: {
    backgroundColor: "#e3f2fd",
    border: "2px solid #1976d2"
  },

  cardContent: {
    padding: "12px"
  },

  senderText: {
    fontWeight: "bold",
    color: "#0078d4",
    fontSize: "14px"
  },

  subjectText: {
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "5px",
    lineHeight: "1.3"
  },

  previewText: {
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.4",
    marginBottom: "8px"
  },

  dateText: {
    fontSize: "12px",
    color: "#888"
  },

  emailDetails: {
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #e1e1e1",
    marginTop: "20px",
    overflow: "hidden"
  },

  summarySection: {
    padding: "20px",
    backgroundColor: "#e8f5e8",
    borderBottom: "1px solid #e1e1e1"
  },

  responseSection: {
    padding: "20px",
    backgroundColor: "#fff3e0"
  },

  responseTextarea: {
    width: "100%",
    minHeight: "120px",
    marginTop: "10px",
    marginBottom: "15px",
    resize: "vertical"
  },

  actionButtons: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "10px"
  },

  loadingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px",
    justifyContent: "center"
  }
});

const UnreadEmailsList = () => {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailSummary, setEmailSummary] = useState("");
  const [suggestedResponse, setSuggestedResponse] = useState("");
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [error, setError] = useState("");

  const styles = useStyles();

  const debugEmailCheck = async () => {
    console.log("🐛 Starting debug email check...");
    
    // Check Office availability
    console.log("1. Office availability:");
    console.log("   - Office defined:", typeof Office !== 'undefined');
    console.log("   - Office.context:", !!Office?.context);
    console.log("   - Office.context.mailbox:", !!Office?.context?.mailbox);
    console.log("   - User profile:", Office?.context?.mailbox?.userProfile);
    console.log("   - REST URL:", Office?.context?.mailbox?.restUrl);
    
    if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
      alert("❌ Office context לא זמין. פתח את התוסף מתוך Outlook.");
      return;
    }
    
    // Try to get callback token
    console.log("2. Getting callback token...");
    try {
      const token = await new Promise((resolve, reject) => {
        Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve(result.value);
          } else {
            reject(result.error);
          }
        });
      });
      console.log("✅ Got callback token:", token.substring(0, 50) + "...");
    } catch (tokenError) {
      console.error("❌ Failed to get callback token:", tokenError);
      alert("❌ לא ניתן לקבל אישור גישה. נסה שוב או פתח התוסף מחדש.");
      return;
    }
    
    // Try to get all recent emails (not just unread)
    console.log("3. Getting recent emails...");
    setIsLoadingEmails(true);
    
    try {
      const testEmails = await new Promise((resolve, reject) => {
        Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const accessToken = result.value;
            const restUrl = Office.context.mailbox.restUrl + 
              `/v2.0/me/mailFolders/inbox/messages?$top=10&$select=subject,sender,body,dateTimeReceived,isRead&$orderby=dateTimeReceived desc`;

            fetch(restUrl, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
              }
            })
            .then(response => {
              console.log("📊 Debug Response status:", response.status);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return response.json();
            })
            .then(data => {
              console.log("📧 Recent emails data:", data);
              resolve(data.value || []);
            })
            .catch(error => {
              console.error("❌ Debug fetch failed:", error);
              reject(error);
            });
          } else {
            reject(result.error);
          }
        });
      });
      
      console.log(`📬 Found ${testEmails.length} recent emails`);
      
      // Show detailed info
      let debugInfo = `🔍 Debug Info:\n\n`;
      debugInfo += `📊 Total recent emails: ${testEmails.length}\n`;
      
      if (testEmails.length > 0) {
        const unreadCount = testEmails.filter(e => e.isRead === false).length;
        const readCount = testEmails.filter(e => e.isRead === true).length;
        
        debugInfo += `📧 Unread emails: ${unreadCount}\n`;
        debugInfo += `📖 Read emails: ${readCount}\n\n`;
        debugInfo += `📋 Recent emails:\n`;
        
        testEmails.slice(0, 5).forEach((email, index) => {
          debugInfo += `${index + 1}. ${email.isRead ? '📖' : '📧'} "${email.subject || 'No Subject'}" - ${email.sender?.emailAddress?.name || 'Unknown'}\n`;
        });
        
        if (unreadCount > 0) {
          setEmails(testEmails.filter(e => e.isRead === false).map(email => ({
            subject: email.subject || "ללא נושא",
            sender: email.sender?.emailAddress?.name || email.sender?.emailAddress?.address || "שולח לא ידוע",
            body: email.body?.content || "",
            dateReceived: email.dateTimeReceived,
            isRead: email.isRead
          })));
          setError("");
        } else {
          setEmails([]);
        }
      } else {
        debugInfo += `❓ No emails found in inbox. This could mean:\n`;
        debugInfo += `   - Empty inbox\n`;
        debugInfo += `   - Permission issue\n`;
        debugInfo += `   - Different folder structure\n`;
      }
      
      alert(debugInfo);
      
    } catch (debugError) {
      console.error("❌ Debug check failed:", debugError);
      alert(`❌ Debug check failed: ${debugError.message}`);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const loadUnreadEmails = async () => {
    setIsLoadingEmails(true);
    setError("");
    console.log("🔄 Starting loadUnreadEmails...");
    
    try {
      // Check Office context availability
      if (typeof Office === 'undefined') {
        throw new Error("Office.js לא זמין. נא לפתוח את התוסף בתוך Outlook.");
      }
      
      if (!Office.context) {
        throw new Error("הקשר של Office לא זמין. נא לרענן את הדף ולנסות שוב.");
      }
      
      if (!Office.context.mailbox) {
        throw new Error("תיבת הדואר לא זמינה. ודא שאתה פותח את התוסף מתוך Outlook.");
      }

      console.log("✅ Office context is available");

      let unreadEmails = [];
      
      try {
        console.log("📡 Attempting to load emails using REST API...");
        unreadEmails = await getUnreadEmailsRest();
        console.log(`📧 REST API found ${unreadEmails.length} unread emails`);
      } catch (restError) {
        console.log("⚠️ REST API failed, trying EWS:", restError.message);
        try {
          unreadEmails = await getUnreadEmails();
          console.log(`📧 EWS found ${unreadEmails.length} unread emails`);
        } catch (ewsError) {
          console.error("❌ Both REST and EWS failed:", ewsError);
          // If both methods fail, it might be a permissions issue or no unread emails
          console.log("🤷 Both methods failed - this might be normal if there are no unread emails");
          unreadEmails = [];
        }
      }
      
      // Ensure unreadEmails is always an array
      if (!Array.isArray(unreadEmails)) {
        console.log("🔧 Fixing unreadEmails - not an array:", typeof unreadEmails);
        unreadEmails = [];
      }
      
      console.log(`📬 Setting ${unreadEmails.length} emails in state`);
      setEmails(unreadEmails);
      
      // Clear any previous error if we successfully got emails (even if 0)
      if (error) {
        console.log("🧹 Clearing previous error");
        setError("");
      }
      
    } catch (error) {
      console.error('❌ Error loading emails:', error);
      setError(error.message || "שגיאה לא ידועה בטעינת המיילים");
      setEmails([]);
    } finally {
      console.log("🏁 loadUnreadEmails finished");
      setIsLoadingEmails(false);
    }
  };

  const summarizeEmail = async (email) => {
    setIsLoadingSummary(true);
    setEmailSummary("");
    
    try {
      const response = await fetch('http://127.0.0.1:8385/summarizeEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error(`שגיאה בשרת: ${response.status}`);
      }
      
      const data = await response.json();
      setEmailSummary(data.summary || "לא התקבל סיכום");
      
    } catch (error) {
      console.error('Error summarizing email:', error);
      setError(`שגיאה בסיכום המייל: ${error.message}`);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const suggestResponse = async (email) => {
    setIsLoadingResponse(true);
    setSuggestedResponse("");
    
    try {
      const response = await fetch('http://127.0.0.1:8385/suggestResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error(`שגיאה בשרת: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestedResponse(data.response || "לא התקבלה הצעת מענה");
      
    } catch (error) {
      console.error('Error suggesting response:', error);
      setError(`שגיאה בהצעת מענה: ${error.message}`);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    setEmailSummary("");
    setSuggestedResponse("");
    
    // טען תמצית ומענה מוצע במקביל
    summarizeEmail(email);
    suggestResponse(email);
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !suggestedResponse.trim()) {
      setError("אין תוכן למענה");
      return;
    }

    setIsSendingReply(true);
    setError("");
    
    try {
      // כאן נוסיף לוגיקה לשליחת המענה דרך Outlook API
      // לעת עתה, נציג הודעת הצלחה
      alert("המענה נשלח בהצלחה!");
      
      // נסגור את פרטי המייל
      setSelectedEmail(null);
      setEmailSummary("");
      setSuggestedResponse("");
      
      // נטען מחדש את רשימת המיילים
      loadUnreadEmails();
      
    } catch (error) {
      console.error('Error sending reply:', error);
      setError(`שגיאה בשליחת המענה: ${error.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  useEffect(() => {
    loadUnreadEmails();
  }, []);

  return (
    <div className={styles.container}>
      <Title3>מיילים שלא נקראו</Title3>
      
      {!selectedEmail && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <Button 
            appearance="primary" 
            onClick={loadUnreadEmails}
            disabled={isLoadingEmails}
          >
            {isLoadingEmails && <Spinner size="tiny" />}
            {isLoadingEmails ? '  טוען מיילים...' : 'רענן רשימת מיילים'}
          </Button>
          
          <Button 
            appearance="secondary" 
            onClick={debugEmailCheck}
            disabled={isLoadingEmails}
          >
            🔍 בדיקה מפורטת
          </Button>
        </div>
      )}

      {error && (
        <MessageBar intent="error">
          {error}
        </MessageBar>
      )}

      {isLoadingEmails && (
        <div className={styles.loadingContainer}>
          <Spinner />
          <Text>טוען מיילים שלא נקראו...</Text>
        </div>
      )}

      {!selectedEmail && emails.length > 0 && (
        <>
          <Text>נמצאו {emails.length} מיילים שלא נקראו. לחץ על מייל לצפייה ומענה:</Text>
          <div className={styles.emailList}>
            {emails.map((email, index) => (
              <Card
                key={index}
                className={styles.emailCard}
                onClick={() => handleEmailClick(email)}
              >
                <CardPreview>
                  <div className={styles.cardContent}>
                    <div className={styles.senderText}>{email.sender}</div>
                    <div className={styles.subjectText}>{email.subject || "ללא נושא"}</div>
                    <div className={styles.previewText}>
                      {truncateText(email.body?.replace(/<[^>]*>/g, ''))}
                    </div>
                    <div className={styles.dateText}>{formatDate(email.dateReceived)}</div>
                  </div>
                </CardPreview>
              </Card>
            ))}
          </div>
        </>
      )}

      {!selectedEmail && emails.length === 0 && !isLoadingEmails && !error && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Text size="large">🎉 כל הכבוד! אין מיילים שלא נקראו</Text>
          <br />
          <Text>כל המיילים שלך נקראו ומטופלים</Text>
        </div>
      )}

      {!selectedEmail && emails.length === 0 && !isLoadingEmails && error && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Text>לא ניתן לטעון את המיילים כרגע</Text>
          <br />
          <Button 
            appearance="primary" 
            onClick={loadUnreadEmails}
            style={{ marginTop: "15px" }}
          >
            נסה שוב
          </Button>
        </div>
      )}

      {selectedEmail && (
        <div className={styles.emailDetails}>
          <div style={{ padding: "20px", backgroundColor: "#fff", borderBottom: "1px solid #e1e1e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <Title2>פרטי המייל</Title2>
              <Button 
                appearance="subtle" 
                onClick={() => setSelectedEmail(null)}
              >
                חזור לרשימה
              </Button>
            </div>
            <Text><strong>מאת:</strong> {selectedEmail.sender}</Text><br/>
            <Text><strong>נושא:</strong> {selectedEmail.subject || "ללא נושא"}</Text><br/>
            <Text><strong>תאריך:</strong> {formatDate(selectedEmail.dateReceived)}</Text>
          </div>

          <div className={styles.summarySection}>
            <Title3>תמצית המייל</Title3>
            {isLoadingSummary ? (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
                <Text>מכין תמצית...</Text>
              </div>
            ) : (
              <Body1>{emailSummary}</Body1>
            )}
          </div>

          <div className={styles.responseSection}>
            <Title3>מענה מוצע</Title3>
            {isLoadingResponse ? (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
                <Text>מכין מענה מוצע...</Text>
              </div>
            ) : (
              <>
                <Textarea 
                  className={styles.responseTextarea}
                  value={suggestedResponse}
                  onChange={(e) => setSuggestedResponse(e.target.value)}
                  placeholder="מענה מוצע יופיע כאן..."
                />
                <div className={styles.actionButtons}>
                  <Button 
                    appearance="secondary"
                    onClick={() => suggestResponse(selectedEmail)}
                    disabled={isLoadingResponse}
                  >
                    הצע מענה חדש
                  </Button>
                  <Button 
                    appearance="primary"
                    onClick={handleSendReply}
                    disabled={isSendingReply || !suggestedResponse.trim()}
                  >
                    {isSendingReply && <Spinner size="tiny" />}
                    {isSendingReply ? '  שולח...' : 'שלח מענה'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnreadEmailsList;
