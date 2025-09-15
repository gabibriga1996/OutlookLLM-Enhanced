/* global Office console */

// Function to get unread emails from mailbox
const getUnreadEmails = async () => {
  try {
    console.log("🔍 Starting EWS request for unread emails...");
    
    return new Promise((resolve, reject) => {
      // Get the mailbox
      const mailbox = Office.context.mailbox;
      
      if (!mailbox) {
        reject(new Error("Mailbox not available"));
        return;
      }

      console.log("📬 Mailbox available, preparing EWS request...");

      // Use EWS to get unread emails
      const ewsRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                       xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"
                       xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
                       xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <t:RequestServerVersion Version="Exchange2013" />
          </soap:Header>
          <soap:Body>
            <m:FindItem Traversal="Shallow">
              <m:ItemShape>
                <t:BaseShape>Default</t:BaseShape>
                <t:AdditionalProperties>
                  <t:FieldURI FieldURI="item:Subject" />
                  <t:FieldURI FieldURI="message:Sender" />
                  <t:FieldURI FieldURI="item:Body" />
                  <t:FieldURI FieldURI="message:IsRead" />
                  <t:FieldURI FieldURI="item:DateTimeReceived" />
                </t:AdditionalProperties>
              </m:ItemShape>
              <m:Restriction>
                <t:IsEqualTo>
                  <t:FieldURI FieldURI="message:IsRead" />
                  <t:FieldURIOrConstant>
                    <t:Constant Value="false" />
                  </t:FieldURIOrConstant>
                </t:IsEqualTo>
              </m:Restriction>
              <m:ParentFolderIds>
                <t:DistinguishedFolderId Id="inbox" />
              </m:ParentFolderIds>
            </m:FindItem>
          </soap:Body>
        </soap:Envelope>`;

      console.log("📡 Sending EWS request...");
      
      // Make EWS request
      mailbox.makeEwsRequestAsync(ewsRequest, (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
          try {
            console.log("✅ EWS request succeeded, parsing response...");
            console.log("📄 Raw EWS response:", asyncResult.value.substring(0, 500) + "...");
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(asyncResult.value, "text/xml");
            
            const items = xmlDoc.getElementsByTagName("t:Message");
            const unreadEmails = [];

            console.log(`📊 Found ${items.length} message items in EWS response`);

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const subject = item.getElementsByTagName("t:Subject")[0]?.textContent || "ללא נושא";
              const sender = item.getElementsByTagName("t:Name")[0]?.textContent || "שולח לא ידוע";
              const body = item.getElementsByTagName("t:Body")[0]?.textContent || "";
              const dateReceived = item.getElementsByTagName("t:DateTimeReceived")[0]?.textContent || "";

              const email = {
                subject: subject,
                sender: sender,
                body: body,
                dateReceived: dateReceived,
                isRead: false // We specifically searched for unread emails
              };

              console.log(`📧 EWS Email ${i + 1}:`, {
                subject: email.subject,
                sender: email.sender,
                dateReceived: email.dateReceived
              });

              unreadEmails.push(email);
            }

            console.log(`✅ EWS found ${unreadEmails.length} unread emails`);
            resolve(unreadEmails);
            
          } catch (error) {
            console.error("❌ Failed to parse EWS response:", error);
            reject(new Error("Failed to parse EWS response: " + error.message));
          }
        } else {
          console.error("❌ EWS request failed:", asyncResult.error);
          reject(new Error("EWS request failed: " + asyncResult.error.message));
        }
      });
    });
  } catch (error) {
    console.error("❌ EWS Error:", error);
    throw error;
  }
};

// Alternative method using REST API
const getUnreadEmailsRest = async () => {
  try {
    // Check if Office context is available
    if (typeof Office === 'undefined' || !Office.context || !Office.context.mailbox) {
      throw new Error("Office context not available. This function only works within Outlook.");
    }

    console.log("🔍 Starting REST API request for unread emails...");
    console.log("📧 Mailbox info:", {
      userDisplayName: Office.context.mailbox.userProfile?.displayName,
      timeZone: Office.context.mailbox.userProfile?.timeZone,
      restUrl: Office.context.mailbox.restUrl
    });

    return new Promise((resolve, reject) => {
      Office.context.mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          const accessToken = result.value;
          console.log("✅ Got access token");
          
          // Try multiple approaches to get unread emails
          const queries = [
            // Primary query - unread emails
            `/v2.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=50&$select=subject,sender,body,dateTimeReceived,isRead&$orderby=dateTimeReceived desc`,
            // Alternative query - all recent emails to check if any are unread
            `/v2.0/me/mailFolders/inbox/messages?$top=50&$select=subject,sender,body,dateTimeReceived,isRead&$orderby=dateTimeReceived desc`
          ];
          
          const tryQuery = async (queryIndex = 0) => {
            if (queryIndex >= queries.length) {
              console.log("❌ All queries failed");
              resolve([]);
              return;
            }
            
            const restUrl = Office.context.mailbox.restUrl + queries[queryIndex];
            console.log(`📬 Trying query ${queryIndex + 1}:`, restUrl);

            try {
              const response = await fetch(restUrl, {
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + accessToken,
                  'Content-Type': 'application/json'
                }
              });

              console.log(`📊 Response status: ${response.status} ${response.statusText}`);

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const data = await response.json();
              console.log(`📨 Found ${data.value?.length || 0} emails`);
              
              if (data.value && data.value.length > 0) {
                // Log all emails for debugging
                data.value.forEach((email, index) => {
                  console.log(`📧 Email ${index + 1}:`, {
                    subject: email.subject || "No Subject",
                    sender: email.sender?.emailAddress?.name || "Unknown",
                    isRead: email.isRead,
                    dateReceived: email.dateTimeReceived
                  });
                });
                
                // Filter unread emails
                const unreadEmails = data.value
                  .filter(email => email.isRead === false)
                  .map(email => ({
                    subject: email.subject || "ללא נושא",
                    sender: email.sender?.emailAddress?.name || email.sender?.emailAddress?.address || "שולח לא ידוע",
                    body: email.body?.content || "",
                    dateReceived: email.dateTimeReceived,
                    isRead: email.isRead
                  }));

                console.log(`✅ Found ${unreadEmails.length} unread emails`);
                resolve(unreadEmails);
              } else {
                console.log(`⚠️ Query ${queryIndex + 1} returned no emails, trying next...`);
                tryQuery(queryIndex + 1);
              }

            } catch (error) {
              console.error(`❌ Query ${queryIndex + 1} failed:`, error.message);
              tryQuery(queryIndex + 1);
            }
          };

          tryQuery();

        } else {
          console.error("❌ Failed to get access token:", result.error);
          reject(new Error("Failed to get access token: " + result.error.message));
        }
      });
    });
  } catch (error) {
    console.error("❌ REST API Error:", error);
    throw error;
  }
};

export { getUnreadEmails, getUnreadEmailsRest };

// Mock function for testing or fallback when Office context is not available
const getMockUnreadEmails = () => {
  return Promise.resolve([
    {
      subject: "דוגמה למייל לא נקרא",
      sender: "test@example.com",
      body: "זהו מייל לדוגמה למטרות בדיקה",
      dateReceived: new Date().toISOString()
    }
  ]);
};

export { getMockUnreadEmails };
