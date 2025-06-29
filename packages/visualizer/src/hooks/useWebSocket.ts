import { useState, useEffect, useCallback } from 'react';
import type { StateFileInfo, VisualizerMessage } from '../types';

export function useWebSocket(url: string, token: string) {
  const [states, setStates] = useState<StateFileInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(url);
      
      websocket.onopen = () => {
        console.log('Connected to Elevo CLI');
        setIsConnected(true);
        setError(null);
        
        // Send ping to verify connection
        websocket.send(JSON.stringify({ type: 'ping', token }));
      };

      websocket.onmessage = (event) => {
        try {
          const message: VisualizerMessage = JSON.parse(event.data);
          
          if (message.token !== token) {
            setError('Invalid token');
            return;
          }

          switch (message.type) {
            case 'initial_data':
            case 'state_update':
              if (Array.isArray(message.data)) {
                setStates(message.data);
                console.log(`Received ${message.data.length} state machines`);
              }
              break;
            case 'error':
              setError(typeof message.data === 'string' ? message.data : 'Unknown error');
              break;
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
          setError('Failed to parse message from server');
        }
      };

      websocket.onclose = () => {
        console.log('Disconnected from Elevo CLI');
        setIsConnected(false);
        setWs(null);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!ws || ws.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 3000);
      };

      websocket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
      };

      setWs(websocket);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }
  }, [url, token, ws]);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const reconnect = useCallback(() => {
    if (ws) {
      ws.close();
    }
    setTimeout(connect, 100);
  }, [ws, connect]);

  return {
    states,
    isConnected,
    error,
    reconnect
  };
}