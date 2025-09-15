import * as React from "react";
import { useState } from "react";
import PropTypes from "prop-types";
import Header from "./Header";
import HeroList from "./HeroList";
import TextInsertion from "./TextInsertion";
import UnreadEmailsList from "./UnreadEmailsList";
import RAGQuery from "./RAGQuery";
import OutlookRAGQuery from "./OutlookRAGQuery";
import { makeStyles, Tab, TabList, TabValue, Divider, Button } from "@fluentui/react-components";
import { Ribbon24Regular, LockOpen24Regular, DesignIdeas24Regular, Mail24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
  },
  tabContainer: {
    padding: "10px",
  },
  tabContent: {
    marginTop: "15px",
  }
});

const App = (props) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState("compose");

  const onTabSelect = (event, data) => {
    setSelectedTab(data.value);
  };

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
        <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
          <Tab id="Compose" value="compose" icon={<DesignIdeas24Regular />}>
            יצירת מייל
          </Tab>
          <Tab id="Unread" value="unread" icon={<Mail24Regular />}>
            מיילים שלא נקראו
          </Tab>
          <Tab id="RAG" value="rag" icon={<LockOpen24Regular />}>
            שאלות ותשובות
          </Tab>
        </TabList>
        
        <div className={styles.tabContent}>
          {selectedTab === "compose" && <TextInsertion />}
          {selectedTab === "unread" && <UnreadEmailsList />}
          {selectedTab === "rag" && <OutlookRAGQuery />}
        </div>
      </div>
    </div>
  );
};

App.propTypes = {
  title: PropTypes.string,
};

export default App;
