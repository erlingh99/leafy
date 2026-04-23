import { Plus, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Language, Translations } from "@/translations/types";
import { Subscription } from "@/models/subscription";
import { SubscriptionManager } from "@/components/SubscriptionManager";

interface HeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  subscriptions: Subscription[];
  onAddSubscription: (subscription: Partial<Subscription>) => Promise<boolean>;
  onUpdateSubscription: (id: string, subscription: Partial<Subscription>) => Promise<boolean>;
  onDeleteSubscription: (id: string) => Promise<void>;
  theme: string;
  onToggleTheme: () => void;
  onOpenAddDialog: () => void;
  isAddingPlant?: boolean;
  t: Translations;
}

export const Header = ({
  language,
  onLanguageChange,
  subscriptions,
  onAddSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  theme,
  onToggleTheme,
  onOpenAddDialog,
  isAddingPlant = false,
  t,
}: HeaderProps) => {

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.appTitle}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{t.appSubtitle}</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Mobile menu */}
            <MobileMenu
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              subscriptions={subscriptions}
              onAddSubscription={onAddSubscription}
              onUpdateSubscription={onUpdateSubscription}
              onDeleteSubscription={onDeleteSubscription}
              t={t}
            />

            {/* Desktop buttons */}
            <div className="hidden md:flex gap-2">
              <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
              <Button
                variant="outline"
                onClick={onToggleTheme}
                size="icon"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <SubscriptionManager
                subscriptions={subscriptions}
                onAddSubscription={onAddSubscription}
                onUpdateSubscription={onUpdateSubscription}
                onDeleteSubscription={onDeleteSubscription}
                t={t}
              />
            </div>

            <DialogTrigger asChild>
              <Button className="gap-2" onClick={onOpenAddDialog} disabled={isAddingPlant}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t.addPlant}</span>
              </Button>
            </DialogTrigger>
          </div>
        </div>
      </div>
    </header>
  );
};
