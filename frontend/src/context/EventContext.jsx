import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [days, setDays] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/current-event')
      .then((res) => {
        if (res.success) {
          setEvent(res.data.event);
          setDays(res.data.days || []);
          setSessionCount(res.data.sessionCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ event, days, sessionCount, loading }), [event, days, sessionCount, loading]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useCurrentEvent = () => useContext(EventContext);
