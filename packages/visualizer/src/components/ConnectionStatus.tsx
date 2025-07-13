import { RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "clsx-for-tailwind";
interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  onReconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  error,
  onReconnect,
}: ConnectionStatusProps) {
  if (isConnected && !error) {
    return null; // Don't show anything when connected and no errors
  }

  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHide(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn("fixed top-4 right-4 z-50 animate-slide-in", {
        "opacity-0": hide,
      })}
    >
      <div
        className={`
        p-4 rounded-lg shadow-lg border max-w-sm
        ${error ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}
      `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
            flex-shrink-0 p-1 rounded
            ${error ? "text-red-600" : "text-yellow-600"}
          `}
          >
            {error ? (
              // @ts-ignore
              <AlertCircle className="w-5 h-5" />
            ) : (
              // @ts-ignore
              <WifiOff className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`
              text-sm font-medium
              ${error ? "text-red-800" : "text-yellow-800"}
            `}
            >
              {error ? "Connection Error" : "Disconnected"}
            </h3>

            <p
              className={`
              text-xs mt-1
              ${error ? "text-red-600" : "text-yellow-600"}
            `}
            >
              {error || "Lost connection to Elevo CLI"}
            </p>

            <div className="mt-3">
              <button
                onClick={onReconnect}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded
                  transition-colors duration-200
                  ${
                    error
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  }
                `}
              >
                {/* @ts-ignore */}
                <RefreshCw className="w-3 h-3" />
                Reconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
