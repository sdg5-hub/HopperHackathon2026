import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>{formatted}</Text>;
}