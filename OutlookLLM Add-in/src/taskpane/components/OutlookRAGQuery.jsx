import * as React from "react";
import { useState, useEffect } from "react";
import { 
    Button, 
    Field, 
    Title3, 
    Textarea, 
    Text, 
    Spinner, 
    Card,
    Badge,
    Divider,
    makeStyles 
} from "@fluentui/react-components";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px"
    },
    querySection: {
        width: "100%",
        marginBottom: "20px"
    },
    textField: {
        marginTop: "10px",
        marginBottom: "15px"
    },
    buttonRow: {
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        marginTop: "10px"
    },
    resultCard: {
        width: "100%",
        marginTop: "15px",
        padding: "15px"
    },
    emailItem: {
        padding: "10px",
        margin: "5px 0",
        border: "1px solid #e1e1e1",
        borderRadius: "4px",
        backgroundColor: "#f9f9f9"
    },
    eventItem: {
        padding: "10px",
        margin: "5px 0",
        border: "1px solid #e1e1e1",
        borderRadius: "4px",
        backgroundColor: "#f0f8ff"
    },
    syncStatus: {
        padding: "10px",
        margin: "10px 0",
        border: "1px solid #ddd",
        borderRadius: "4px",
        backgroundColor: "#f8f9fa"
    }
});

const OutlookRAGQuery = () => {
    const styles = useStyles();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [outlookData, setOutlookData] = useState({ emails: [], events: [] });
    const [syncStatus, setSyncStatus] = useState("Not connected");

    // Check if we're running in Office context
    const isInOffice = () => {
        return typeof Office !== 'undefined' && Office.context;
    };

    // Sync with Outlook data
    const syncOutlookData = async () => {
        if (!isInOffice()) {
            setSyncStatus("Not running in Outlook - using mock data");
            return;
        }

        setSyncStatus("Syncing with Outlook...");
        
        try {
            // Get recent emails
            const emails = await getRecentEmails();
            // Get upcoming calendar events
            const events = await getUpcomingEvents();
            
            setOutlookData({ emails, events });
            setSyncStatus(`Synced: ${emails.length} emails, ${events.length} events`);
            
            // Send data to backend for indexing
            await indexOutlookData(emails, events);
            
        } catch (error) {
            console.error("Error syncing Outlook data:", error);
            setSyncStatus("Sync failed - using mock data");
        }
    };

    // Get recent emails from Outlook
    const getRecentEmails = () => {
        return new Promise((resolve, reject) => {
            if (!isInOffice()) {
                resolve([]);
                return;
            }

            Office.context.mailbox.makeEwsRequestAsync(
                `<?xml version="1.0" encoding="utf-8"?>
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
                        <t:BaseShape>AllProperties</t:BaseShape>
                      </m:ItemShape>
                      <m:IndexedPageItemView MaxEntriesReturned="50" Offset="0" BasePoint="Beginning" />
                      <m:ParentFolderIds>
                        <t:DistinguishedFolderId Id="inbox" />
                      </m:ParentFolderIds>
                    </m:FindItem>
                  </soap:Body>
                </soap:Envelope>`,
                (result) => {
                    if (result.status === "succeeded") {
                        // Parse EWS response and extract email data
                        const emails = parseEmailsFromEWS(result.value);
                        resolve(emails);
                    } else {
                        reject(result.error);
                    }
                }
            );
        });
    };

    // Get upcoming calendar events
    const getUpcomingEvents = () => {
        return new Promise((resolve, reject) => {
            if (!isInOffice()) {
                resolve([]);
                return;
            }

            // Use Office.js Calendar API
            Office.context.mailbox.makeEwsRequestAsync(
                `<?xml version="1.0" encoding="utf-8"?>
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
                        <t:BaseShape>AllProperties</t:BaseShape>
                      </m:ItemShape>
                      <m:IndexedPageItemView MaxEntriesReturned="20" Offset="0" BasePoint="Beginning" />
                      <m:ParentFolderIds>
                        <t:DistinguishedFolderId Id="calendar" />
                      </m:ParentFolderIds>
                    </m:FindItem>
                  </soap:Body>
                </soap:Envelope>`,
                (result) => {
                    if (result.status === "succeeded") {
                        const events = parseEventsFromEWS(result.value);
                        resolve(events);
                    } else {
                        reject(result.error);
                    }
                }
            );
        });
    };

    // Parse emails from EWS response
    const parseEmailsFromEWS = (ewsResponse) => {
        // Simplified parser - in production, you'd use a proper XML parser
        const emails = [];
        try {
            // This is a simplified example - real implementation would parse XML properly
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(ewsResponse, "text/xml");
            const items = xmlDoc.getElementsByTagName("t:Message");
            
            for (let i = 0; i < items.length && i < 50; i++) {
                const item = items[i];
                const email = {
                    id: getElementText(item, "t:ItemId"),
                    subject: getElementText(item, "t:Subject"),
                    sender: getElementText(item, "t:From"),
                    body: getElementText(item, "t:Body"),
                    received: getElementText(item, "t:DateTimeReceived")
                };
                emails.push(email);
            }
        } catch (error) {
            console.error("Error parsing emails:", error);
        }
        return emails;
    };

    // Parse events from EWS response
    const parseEventsFromEWS = (ewsResponse) => {
        const events = [];
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(ewsResponse, "text/xml");
            const items = xmlDoc.getElementsByTagName("t:CalendarItem");
            
            for (let i = 0; i < items.length && i < 20; i++) {
                const item = items[i];
                const event = {
                    id: getElementText(item, "t:ItemId"),
                    subject: getElementText(item, "t:Subject"),
                    start: getElementText(item, "t:Start"),
                    end: getElementText(item, "t:End"),
                    organizer: getElementText(item, "t:Organizer"),
                    body: getElementText(item, "t:Body")
                };
                events.push(event);
            }
        } catch (error) {
            console.error("Error parsing events:", error);
        }
        return events;
    };

    // Helper function to get text content from XML element
    const getElementText = (parent, tagName) => {
        const element = parent.getElementsByTagName(tagName)[0];
        return element ? element.textContent : "";
    };

    // Send Outlook data to backend for indexing
    const indexOutlookData = async (emails, events) => {
        try {
            const response = await fetch('http://localhost:8385/index/outlook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: emails,
                    events: events
                })
            });
            
            if (!response.ok) {
                console.error("Failed to index Outlook data");
            }
        } catch (error) {
            console.error("Error indexing data:", error);
        }
    };

    // Initialize Outlook sync on component mount
    useEffect(() => {
        const initializeOutlookData = async () => {
            if (isInOffice()) {
                Office.onReady(() => {
                    syncOutlookData();
                });
            } else {
                setSyncStatus("Running in browser - using mock data");
            }
        };

        initializeOutlookData();
    }, []);

    const handleQuery = async (searchType) => {
        if (!query.trim()) return;

        setLoading(true);
        setResults(null);

        try {
            const endpoint = searchType === 'combined' 
                ? '/query/combined' 
                : searchType === 'calendar' 
                ? '/query/calendar' 
                : '/query/inbox';

            const response = await fetch(`http://localhost:8385${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: query,
                    use_outlook_data: isInOffice()
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setResults(data);
            } else {
                setResults({ error: data.error || "Unknown error occurred" });
            }
        } catch (error) {
            console.error("Error querying:", error);
            setResults({ error: `Network error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const renderEmailResults = (emails) => {
        return emails.map((email, index) => (
            <div key={index} className={styles.emailItem}>
                <Text weight="semibold">{email.subject || email.title}</Text>
                <Text size={200}>From: {email.sender || email.from || "Unknown"}</Text>
                <Text size={200}>Date: {email.received_time || email.received || "Unknown"}</Text>
                {email.similarity_score && (
                    <Badge appearance="filled" color="info">
                        Relevance: {Math.round(email.similarity_score * 100)}%
                    </Badge>
                )}
            </div>
        ));
    };

    const renderEventResults = (events) => {
        return events.map((event, index) => (
            <div key={index} className={styles.eventItem}>
                <Text weight="semibold">{event.title || event.subject}</Text>
                <Text size={200}>Organizer: {event.organizer || "Unknown"}</Text>
                <Text size={200}>Start: {event.start_time || event.start || "Unknown"}</Text>
                {event.similarity_score && (
                    <Badge appearance="filled" color="success">
                        Relevance: {Math.round(event.similarity_score * 100)}%
                    </Badge>
                )}
            </div>
        ));
    };

    return (
        <div className={styles.container}>
            <Title3>📧 Outlook Q&A Assistant</Title3>
            
            {/* Sync Status */}
            <div className={styles.syncStatus}>
                <Text size={200}>
                    <strong>Outlook Integration:</strong> {syncStatus}
                </Text>
                {isInOffice() && (
                    <Button size="small" onClick={syncOutlookData} style={{ marginLeft: "10px" }}>
                        Refresh Data
                    </Button>
                )}
            </div>

            <div className={styles.querySection}>
                <Field label="Ask a question about your emails or calendar:">
                    <Textarea
                        placeholder="e.g., 'What meetings do I have this week?' or 'Show me emails about budget planning'"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.textField}
                        rows={3}
                    />
                </Field>

                <div className={styles.buttonRow}>
                    <Button 
                        appearance="primary" 
                        onClick={() => handleQuery('inbox')}
                        disabled={loading || !query.trim()}
                    >
                        📧 Search Emails
                    </Button>
                    <Button 
                        appearance="primary" 
                        onClick={() => handleQuery('calendar')}
                        disabled={loading || !query.trim()}
                    >
                        📅 Search Calendar
                    </Button>
                    <Button 
                        appearance="secondary" 
                        onClick={() => handleQuery('combined')}
                        disabled={loading || !query.trim()}
                    >
                        🔍 Search Both
                    </Button>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: "center", margin: "20px" }}>
                    <Spinner label="Searching your Outlook data..." />
                </div>
            )}

            {results && (
                <div style={{ width: "100%" }}>
                    <Divider />
                    
                    {results.error ? (
                        <Card className={styles.resultCard}>
                            <div style={{ padding: "16px" }}>
                                <Text weight="semibold" style={{ color: "red" }}>Error</Text>
                                <Text>{results.error}</Text>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Card className={styles.resultCard}>
                                <div style={{ padding: "16px" }}>
                                    <Text weight="semibold">Question:</Text>
                                    <Text>{results.question}</Text>
                                    
                                    <br />
                                    
                                    <Text weight="semibold">Answer:</Text>
                                    <Text>{results.answer}</Text>
                                    
                                    <div style={{ marginTop: "10px" }}>
                                        <Badge appearance="filled" color={results.context_used ? "success" : "warning"}>
                                            {results.context_used ? "Enhanced with your Outlook data" : "Basic response"}
                                        </Badge>
                                        {isInOffice() && (
                                            <Badge appearance="outline" color="brand" style={{ marginLeft: "5px" }}>
                                                Live Outlook Data
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {results.relevant_emails && results.relevant_emails.length > 0 && (
                                <Card className={styles.resultCard}>
                                    <div style={{ padding: "16px" }}>
                                        <Text weight="semibold">📧 Relevant Emails ({results.relevant_emails.length})</Text>
                                        <div style={{ marginTop: "10px" }}>
                                            {renderEmailResults(results.relevant_emails)}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {results.relevant_events && results.relevant_events.length > 0 && (
                                <Card className={styles.resultCard}>
                                    <div style={{ padding: "16px" }}>
                                        <Text weight="semibold">📅 Relevant Events ({results.relevant_events.length})</Text>
                                        <div style={{ marginTop: "10px" }}>
                                            {renderEventResults(results.relevant_events)}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutlookRAGQuery;
