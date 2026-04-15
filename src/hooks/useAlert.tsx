"use client";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AlertConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "success" | "error" | "warning";
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  linkToLogin?: boolean;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertConfig | null>(null);
  const router = useRouter();

  const showAlert = useCallback((config: AlertConfig) => {
    setAlert(config);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const handleConfirm = () => {
    if (alert?.onConfirm) {
      alert.onConfirm();
    }
    if (alert?.linkToLogin) {
      router.push("/formlogin");
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alert?.onCancel) {
      alert.onCancel();
    }
    hideAlert();
  };

  useEffect(() => {
    if (alert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [alert]);

  const typeStyles = {
    info: {
      bg: "bg-blue-500",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bg: "bg-emerald-500",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-500",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-500",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  };

  const currentStyle = alert ? typeStyles[alert.type || "info"] : typeStyles.info;

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className={`${currentStyle.bg} p-4 rounded-t-2xl flex items-center gap-3`}>
              <div className="shrink-0">{currentStyle.icon}</div>
              <h3 className="text-white font-bold text-lg">{alert.title}</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {alert.message}
              </p>
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              {alert.showCancel && (
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {alert.cancelText || "Cancel"}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl ${currentStyle.bg} text-white font-semibold hover:opacity-90 transition-opacity`}
              >
                {alert.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  return context;
}
