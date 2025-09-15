/* global Office console */

const insertText = async (textContent, writeSubject) => {
  // Write text to the cursor point in the compose surface.
  try {
    console.log('insertText called with:', textContent, 'writeSubject:', writeSubject);
    
    if (!Office || !Office.context || !Office.context.mailbox || !Office.context.mailbox.item) {
      throw new Error('Office context not available');
    }

    // Set subject if requested and textContent has subject
    if (writeSubject && textContent.subject) {
      console.log('Setting subject:', textContent.subject);
      await new Promise((resolve, reject) => {
        Office.context.mailbox.item.subject.setAsync(
          textContent.subject,
          (asyncResult) => {
            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
              console.error('Failed to set subject:', asyncResult.error.message);
              reject(new Error(asyncResult.error.message));
            } else {
              console.log('Subject set successfully');
              resolve();
            }
          }
        );
      });
    }

    // Set body content - replace entire body instead of adding to selection
    if (textContent.body) {
      console.log('Setting body:', textContent.body);
      await new Promise((resolve, reject) => {
        Office.context.mailbox.item.body.setAsync(
          textContent.body.replace(/\n/g, '<br>'),
          { coercionType: Office.CoercionType.Html },
          (asyncResult) => {
            if (asyncResult.status === Office.AsyncResultStatus.Failed) {
              console.error('Failed to set body:', asyncResult.error.message);
              reject(new Error(asyncResult.error.message));
            } else {
              console.log('Body set successfully');
              resolve();
            }
          }
        );
      });
    }

    console.log('Email content inserted successfully');

  } catch (error) {
    console.error("Error inserting text:", error);
    throw error;
  }
};

export default insertText;
