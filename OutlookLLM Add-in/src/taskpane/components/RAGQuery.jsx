import * as React from "react";
import { useState } from "react";
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
    buttonGroup: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },
    resultsSection: {
        width: "100%",
        marginTop: "20px"
    },
    resultCard: {
        marginBottom: "15px",
        padding: "15px"
    },
    emailItem: {
        marginBottom: "10px",
        padding: "10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px"
    },
    eventItem: {
        marginBottom: "10px",
        padding: "10px",
        backgroundColor: "#f0f9ff",
        borderRadius: "4px"
    },
    metadata: {
        fontSize: "12px",
        color: "#666",
        marginTop: "5px"
    }
});

const RAGQueryComponent = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [queryType, setQueryType] = useState("inbox");

    const styles = useStyles();

    const handleQuery = async (type) => {
        if (!query.trim()) {
            return;
        }

        setIsLoading(true);
        setQueryType(type);

        try {
            const endpoint = type === "inbox" ? "/query/inbox" : "/query/calendar";
            const response = await fetch(`http://127.0.0.1:8385${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: query,
                })
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            setResults(data);

        } catch (error) {
            console.error('Error querying:', error);
            setResults({
                error: "Failed to query the system. Please try again.",
                question: query
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryChange = (event) => {
        setQuery(event.target.value);
    };

    const renderEmailResults = (emails) => {
        return emails.map((email, index) => (
            <div key={email.id} className={styles.emailItem}>
                <Text weight="semibold">{email.subject}</Text>
                <div className={styles.metadata}>
                    From: {email.sender} | Date: {new Date(email.date).toLocaleDateString()} | Folder: {email.folder}
                </div>
            </div>
        ));
    };

    const renderEventResults = (events) => {
        return events.map((event, index) => (
            <div key={event.id} className={styles.eventItem}>
                <Text weight="semibold">{event.subject}</Text>
                <div className={styles.metadata}>
                    Organizer: {event.organizer} | Start: {new Date(event.start_time).toLocaleString()} | Location: {event.location}
                </div>
            </div>
        ));
    };

    return (
        <div className={styles.container}>
            <Title3>📧 Inbox & Calendar Q&A</Title3>
            
            <div className={styles.querySection}>
                <Field 
                    className={styles.textField} 
                    size="medium" 
                    label="Ask a question about your emails or calendar:"
                >
                    <Textarea 
                        size="medium" 
                        placeholder="e.g., What meetings do I have this week? Who sent me emails about budget?"
                        value={query}
                        onChange={handleQueryChange}
                        resize="vertical"
                        rows={3}
                    />
                </Field>

                <div className={styles.buttonGroup}>
                    <Button 
                        appearance="primary" 
                        disabled={!query.trim() || isLoading}
                        onClick={() => handleQuery("inbox")}
                    >
                        {isLoading && queryType === "inbox" && <Spinner size="tiny" />}
                        📧 Search Inbox
                    </Button>
                    
                    <Button 
                        appearance="primary" 
                        disabled={!query.trim() || isLoading}
                        onClick={() => handleQuery("calendar")}
                    >
                        {isLoading && queryType === "calendar" && <Spinner size="tiny" />}
                        📅 Search Calendar
                    </Button>
                </div>
            </div>

            {results && (
                <div className={styles.resultsSection}>
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
                                            {results.context_used ? "RAG Enhanced" : "Basic Response"}
                                        </Badge>
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

export default RAGQueryComponent;
