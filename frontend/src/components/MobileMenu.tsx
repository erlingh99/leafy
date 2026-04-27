import { lazy, Suspense } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";
import { Language, Translations } from "@/translations/types";

const LanguageSwitcher = lazy(() =>
  import("@/components/LanguageSwitcher").then((m) => ({ default: m.LanguageSwitcher }))
);
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { Subscription } from "@/models/subscription";

interface MobileMenuProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  subscriptions: Subscription[];
  onAddSubscription: (subscription: Partial<Subscription>) => Promise<boolean>;
  onUpdateSubscription: (id: string, subscription: Partial<Subscription>) => Promise<boolean>;
  onDeleteSubscription: (id: string) => Promise<void>;
  t: Translations;
}

export function MobileMenu({
  currentLanguage,
  onLanguageChange,
  subscriptions,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  t
}: MobileMenuProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label={t.menu}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t.menu}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 mt-6">
          <div className="w-full">
            <Suspense fallback={null}>
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                t={t}
                mobile={true}
              />
            </Suspense>
          </div>
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full justify-start gap-2"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === "dark" ? t.lightMode : t.darkMode}
          </Button>
          <SubscriptionManager
            subscriptions={subscriptions}
            onAddSubscription={onAddSubscription}
            onUpdateSubscription={onUpdateSubscription}
            onDeleteSubscription={onDeleteSubscription}
            t={t}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
