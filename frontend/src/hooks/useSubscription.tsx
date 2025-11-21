import { useState, useEffect } from "react";
import { useToast, delayedToast } from "./useToast";
import { Translations } from "@/lib/translations";

export interface Subscription {
  id: string;
  name: string;
  email: string;
}


export const useSubscription = (t: Translations) => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.loadingSubscriptions || "Loading subscriptions...",
    });

    try {
      const response = await fetch(`/api/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSubscriptions([]);
          loadingToast.dismiss();
          return;
        }
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data || []);
      loadingToast.dismiss();
    } catch (error) {
      loadingToast.update({
        title: t.errorLoadingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const addSubscription = async (subscriptionData: Partial<Subscription>): Promise<boolean> => {
    if (!subscriptionData.name || !subscriptionData.email) {
      toast({
        title: t.missingInfo,
        description: t.fillAllFields,
        variant: "destructive",
      });
      return false;
    }

    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.addingSubscription || "Adding subscription...",
    });

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subscriptionData.name,
          email: subscriptionData.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add subscription');
      }

      loadingToast.update({
        title: t.subscriptionAdded,
        description: t.subscriptionAddedDescription(subscriptionData.name || ""),
      });
      loadSubscriptions();
      return true;
    } catch (error) {
      loadingToast.update({
        title: t.errorAddingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSubscription = async (
    id: string,
    subscription: Partial<Subscription>
  ): Promise<boolean> => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.updatingSubscription || "Updating subscription...",
    });

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      loadingToast.update({
        title: t.subscriptionUpdated,
        description: t.subscriptionUpdatedDescription(subscription?.name || ""),
      });
      loadSubscriptions();
      return true;
    } catch (error) {
      loadingToast.update({
        title: t.errorUpdatingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSubscription = async (id: string) => {
    const subscription = subscriptions.find((s) => s.id === id);
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.deletingSubscription || "Deleting subscription...",
    });
    
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      loadingToast.update({
        title: t.subscriptionDeleted,
        description: t.subscriptionDeletedDescription(subscription?.name || ""),
      });
      loadSubscriptions();
    } catch (error) {
      loadingToast.update({
        title: t.errorDeletingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };


  return {
    subscriptions,
    loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription
  };
};
