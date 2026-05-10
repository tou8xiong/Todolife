import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export function useTranslatedToast() {
  const { t } = useLanguage();

  return {
    success: (key: string) => {
      const message = (t.toast?.success as any)?.[key] || key;
      toast.success(message);
    },
    error: (key: string) => {
      const message = (t.toast?.error as any)?.[key] || key;
      toast.error(message);
    },
    info: (key: string) => {
      const message = (t.toast?.info as any)?.[key] || key;
      toast.info(message);
    },
    warning: (key: string) => {
      toast(key);
    },
  };
}
