import React, { createContext, useState, useContext } from "react";

export const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const triggerRefresh = () => {
    setRefreshFlag((prev) => !prev); // flip value to trigger reload
  };

  return (
    <ActivityContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => useContext(ActivityContext);
