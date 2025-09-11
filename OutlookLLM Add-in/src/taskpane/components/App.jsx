import * as React from "react";
import { useState } from "react";
import PropTypes from "prop-types";
import Header from "./Header";
import HeroList from "./HeroList";
import TextInsertion from "./TextInsertion";
import RAGQuery from "./RAGQuery";
import OutlookRAGQuery from "./OutlookRAGQuery";
import { makeStyles, Divider, Button } from "@fluentui/react-components";
import { Ribbon24Regular, LockOpen24Regular, DesignIdeas24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
  },
  tabContainer: {
    display: "flex",
    gap: "10px",
    margin: "20px",
    marginBottom: "10px"
  },
  contentContainer: {
    padding: "0 20px"
  }
});

const App = (props) => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState("compose");

  const listItems = [
    {
      icon: "📧",
      primaryText: "Compose with AI",
      secondaryText: "Generate professional emails using AI assistance",
    },
    {
      icon: "🔍", 
      primaryText: "Inbox & Calendar Q&A",
      secondaryText: "Ask questions about your emails and meetings",
    },
    {
      icon: "📊",
      primaryText: "Smart Summaries", 
      secondaryText: "Get insights from your communication data",
    },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.tabContainer}>
        <Button 
          appearance={activeTab === "compose" ? "primary" : "secondary"}
          onClick={() => setActiveTab("compose")}
        >
          📧 Compose
        </Button>
        <Button 
          appearance={activeTab === "rag" ? "primary" : "secondary"}
          onClick={() => setActiveTab("rag")}
        >
          🔍 Q&A
        </Button>
      </div>

      <div className={styles.contentContainer}>
        {activeTab === "compose" && <TextInsertion />}
        {activeTab === "rag" && <OutlookRAGQuery />}
        
        {activeTab === "compose" && (
          <>
            <Divider style={{ margin: "30px 0" }} />
            <HeroList message="Discover what OutlookLLM can do for you." items={listItems} />
          </>
        )}
      </div>
    </div>
  );
};

App.propTypes = {
  title: PropTypes.string,
};

export default App;
