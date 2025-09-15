import * as React from "react";
import { useState } from "react";
import { Button, Title3, Text, Spinner, MessageBar, MessageBarType, makeStyles } from "@fluentui/react-components";
import { getUnreadEmailsRest } from "../unread-emails";

const useStyles = makeStyles({
  unreadEmailsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px"
  },

  summaryContainer: {
    margin: "15px",
    padding: "15px",
    border: "1px solid #e1e1e1",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    maxHeight: "400px",
    overflowY: "auto",
    width: "100%"
  },

  instructionText: {
    marginBottom: "20px",
    textAlign: "center"
  },

  emailCountText: {
    marginTop: "10px",
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#0078d4"
  }
});

const UnreadEmailsSummary = () => {
  const [summary, setSummary] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState("");
  const [emailCount, setEmailCount] = useState(0);

  const handleSummarizeUnreadEmails = async () => {
    try {
      setShowSpinner(true);
      setError("");
      setSummary("");
      setEmailCount(0);

      // Check if Office context is available
      if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
        throw new Error("לא ניתן לגשת לתיבת הדואר. ודא שהאפליקציה פועלת בתוך Outlook.");
      }

      // First, get unread emails from Outlook
      let unreadEmails = [];
      
      try {
        unreadEmails = await getUnreadEmailsRest();
      } catch (restError) {
        console.log("REST API failed, trying EWS:", restError.message);
        try {
          unreadEmails = await getUnreadEmails();
        } catch (ewsError) {
          console.log("EWS also failed:", ewsError.message);
          throw new Error("לא ניתן לגשת למיילים. ודא שאתה מחובר לחשבון Outlook.");
        }
      }
      
      if (unreadEmails.length === 0) {
        setSummary("אין מיילים לא נקראים בתיבת הדואר שלך! 🎉");
        setShowSpinner(false);
        return;
      }

      setEmailCount(unreadEmails.length);

      // Send emails to backend for summarization
      const response = await fetch("http://127.0.0.1:8385/summarizeUnreadEmails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: unreadEmails
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSummary(result.summary);
      setShowSpinner(false);

    } catch (error) {
      setShowSpinner(false);
      console.error('Error summarizing unread emails:', error);
      setError(`שגיאה בסיכום המיילים: ${error.message}`);
    }
  };

  const styles = useStyles();

  return (
    <div className={styles.unreadEmailsContainer}>
      <Title3>סיכום מיילים לא נקראים</Title3>
      
      <Text className={styles.instructionText} size="medium">
        לחץ על הכפתור למטה כדי לקבל סיכום של כל המיילים שלא נקראו בתיבת הדואר שלך
      </Text>

      <Button 
        appearance="primary" 
        size="large" 
        onClick={handleSummarizeUnreadEmails}
        disabled={showSpinner}
      >
        {showSpinner && <Spinner appearance="inverted" />}
        {showSpinner ? '   מסכם מיילים...' : 'סכם מיילים לא נקראים'}
      </Button>

      {emailCount > 0 && (
        <Text className={styles.emailCountText} size="medium">
          נמצאו {emailCount} מיילים לא נקראים
        </Text>
      )}

      {error && (
        <MessageBar intent="error" style={{ margin: "15px", width: "100%" }}>
          {error}
        </MessageBar>
      )}

      {summary && !error && (
        <div className={styles.summaryContainer}>
          <Text size="medium" style={{ whiteSpace: "pre-line" }}>
            {summary}
          </Text>
        </div>
      )}
    </div>
  );
};

export default UnreadEmailsSummary;
