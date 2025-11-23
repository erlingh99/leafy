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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Language, Translations } from "@/translations/types";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { Subscription } from "@/hooks/useSubscription";

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
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t.menu}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 mt-6">
          <div className="w-full">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              mobile={true}
            />
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
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
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
