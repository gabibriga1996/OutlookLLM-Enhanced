import * as React from "react";
import { useState } from "react";
import { Button, Field, Title3, Checkbox, Textarea, Text, Spinner, Dropdown, Option, makeStyles } from "@fluentui/react-components";
import insertText from "../office-document";

const useStyles = makeStyles({
  textPromptAndInsertion: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px"
  },
  textAreaField: {
    margin: "15px",
    marginTop: "10px",
    minHeight: "150px",
    width: "100%"
  },
  checkStyle: {
    marginBottom: "15px"
  }
});

const TextInsertion = () => {
  const [text, setText] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [writeSubject, setWriteSubject] = useState(false);
  const [emailTone, setEmailTone] = useState("professional");

<<<<<<< HEAD
  const generateSmartEmail = (prompt) => {
    const originalText = prompt.trim();
    let subject = "";
    let body = "";
=======

  const handleTextInsertion = async () => {
    try {
      
      setshowSpinner(true);
      
      const response = await fetch("http://127.0.0.1:8385/composeEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
        })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Handle success response if needed
      console.log('Data sent successfully');
>>>>>>> 2f3eee1c06c68a63ac81699c6e5969d582bfd1d3
    
    if (originalText.includes("גלידה")) {
      subject = "הזמנה לגלידה! 🍦";
      body = `היי!

אני מזמינה אתכם לגלידה מחר בערב!
אשמח לאישורי הגעה 😊

בברכה`;
    } else {
      subject = originalText;
      body = `היי,

${originalText}

בברכה`;
    }
    
    return { subject, body };
  };

  const handleTextInsertion = async () => {
    if (!text.trim()) {
      alert("אנא הכנס תיאור למייל");
      return;
    }

    setShowSpinner(true);
    
    try {
      console.log('🚀 Sending text to AI for professional enhancement...');
      
      // Call new AI enhancement endpoint
      const response = await fetch('http://127.0.0.1:8385/enhanceEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          tone: emailTone // Use selected tone
        })
      });
      
      if (!response.ok) {
        throw new Error(`שגיאה בשרת: ${response.status}`);
      }
      
      const enhancedData = await response.json();
      console.log('✨ AI enhanced email:', enhancedData);
      
      const smartEmail = {
        subject: enhancedData.subject || text,
        body: enhancedData.body || `היי,\n\n${text}\n\nבברכה`
      };
      
      // Insert the enhanced email into Outlook
      await insertText(smartEmail, writeSubject);
      
      setShowSpinner(false);
      
      // Show success message with enhancement info
      const enhanceMsg = enhancedData.enhanced ? 
        (enhancedData.fallback ? " (בוצע ניסוח חכם)" : " (נוסח על ידי AI)") : "";
      alert(`המייל נוצר בהצלחה!${enhanceMsg} 🎉`);
      
      setText("");
      
    } catch (error) {
      setShowSpinner(false);
      console.error('❌ Error creating enhanced email:', error);
      
      // Fallback to simple generation if AI enhancement fails
      try {
        const simpleEmail = generateSmartEmail(text);
        await insertText(simpleEmail, writeSubject);
        alert("המייל נוצר בהצלחה (במצב חירום)! 🎉");
        setText("");
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        alert("שגיאה ביצירת המייל");
      }
    }
  };

  const styles = useStyles();

  return (
    <div className={styles.textPromptAndInsertion}>
      <Title3>יצירה עם בינה מלאכותית</Title3>
      
      <Text>
        תאר את המייל שתרצה ליצור - AI ינסח אותו מחדש ברמה מקצועית:
      </Text>
      
      <Field className={styles.textAreaField}>
        <Textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="לדוגמה: תזמין את כל מדור רכש לגלידה מחר בערב"
        />
      </Field>
      
      <Field style={{ margin: "15px", width: "100%" }}>
        <Text>בחר סגנון ניסוח:</Text>
        <Dropdown
          value={emailTone}
          onOptionSelect={(e, data) => setEmailTone(data.optionValue)}
          style={{ marginTop: "5px" }}
        >
          <Option value="professional">מקצועי ונעים</Option>
          <Option value="friendly">חברותי וחם</Option>
          <Option value="formal">רשמי ומכובד</Option>
        </Dropdown>
      </Field>
      
      <Checkbox 
        className={styles.checkStyle}
        label="צור נושא למייל" 
        onChange={(ev, data) => setWriteSubject(data.checked)} 
        checked={writeSubject}
      />
      
      <Button 
        appearance="primary" 
        disabled={showSpinner || !text.trim()} 
        onClick={handleTextInsertion}
      >
        {showSpinner && <Spinner/>} 
        {showSpinner ? "יוצר מייל..." : "יצירה עם בינה מלאכותית"}
      </Button>
    </div>
  );
};

export default TextInsertion;
