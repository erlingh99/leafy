import { useState, useEffect } from "react";
import { useToast } from "./useToast";
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
          return;
        }
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data || []);
    } catch (error) {
      toast({
        title: t.errorLoadingSubscription,
        description: error.message,
        variant: "destructive",
      })
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

      toast({
        title: t.subscriptionAdded, //TODO
        description: t.subscriptionAddedDescription(subscriptionData.name), //TODO
      });
      loadSubscriptions();
      return true;
    } catch (error) {
      toast({
        title: t.errorAddingSubscription,
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSubscription = async (
    id: string,
    subscription: Partial<Subscription>
  ): Promise<boolean> => {

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

      toast({
        title: t.subscriptionUpdated, //TODO
        description: t.subscriptionUpdatedDescription(subscription?.name || ""),
      });
      loadSubscriptions();
      return true;
    } catch (error) {
      toast({
        title: t.errorUpdatingSubscription,
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSubscription = async (id: string) => {
    const subscription = subscriptions.find((s) => s.id === id);
    
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

      toast({
        title: t.subscriptionDeleted, //TODO
        description: t.subscriptionDeletedDescription(subscription?.name || ""), //TODO translations
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: t.errorDeletingSubscription,
        description: error.message,
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
