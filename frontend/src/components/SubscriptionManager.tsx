import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Subscription } from "@/models/subscription";
import { Translations } from "@/translations/types";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionManagerProps {
  t: Translations;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscriptions, addSubscription: onAddSubscription, updateSubscription: onUpdateSubscription, deleteSubscription: onDeleteSubscription } = useSubscription(t, isOpen);
  const [newSubscription, setNewSubscription] = useState({ name: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState({ name: "", email: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAdd = async () => {
    if (newSubscription.name && newSubscription.email && isValidEmail(newSubscription.email)) {
      setIsAdding(true);
      try {
        await onAddSubscription(newSubscription);
        setNewSubscription({ name: "", email: "" });
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleEdit = (id: string, subscription: Subscription) => {
    setEditingId(id);
    setEditingSubscription({ name: subscription.name, email: subscription.email });
  };

  const handleSave = async () => {
    if (editingId && isValidEmail(editingSubscription.email)) {
      setIsSaving(true);
      try {
        await onUpdateSubscription(editingId, editingSubscription);
        setEditingId(null);
        setEditingSubscription({ name: "", email: "" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteSubscription(id);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>{t.subscriptionManageButton}</Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.subscriptionManageTitle}</DialogTitle>
            <DialogDescription>
              {t.subscriptionManageDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                {editingId === subscription.id ? (
                  <>
                    <Input
                      type="text"
                      aria-label={t.subscriptionNamePlaceholder || "Name"}
                      value={editingSubscription.name}
                      onChange={(e) =>
                        setEditingSubscription({
                          ...editingSubscription,
                          name: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="email"
                      aria-label={t.subscriptionEmailPlaceholder || "Email"}
                      value={editingSubscription.email}
                      onChange={(e) =>
                        setEditingSubscription({
                          ...editingSubscription,
                          email: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      {t.subscriptionSave}
                    </Button>
                  </>
                ) : (
                  <>
                    <span>{subscription.name}</span>
                    <span>{subscription.email}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(subscription.id, subscription)}
                      >
                        {t.subscriptionEdit}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(subscription.id)}
                      >
                        {t.subscriptionDelete}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 justify-between items-center">
            <Input
              type="text"
              aria-label={t.subscriptionNamePlaceholder || "Name"}
              placeholder={t.subscriptionNamePlaceholder}
              value={newSubscription.name}
              onChange={(e) =>
                setNewSubscription({ ...newSubscription, name: e.target.value })
              }
            />
            <Input
              type="email"
              aria-label={t.subscriptionEmailPlaceholder || "Email"}
              placeholder={t.subscriptionEmailPlaceholder}
              value={newSubscription.email}
              onChange={(e) =>
                setNewSubscription({ ...newSubscription, email: e.target.value })
              }
            />
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.subscriptionAdd}
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.subscriptionClose}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};