import { useState, useEffect } from "react";
import { useToast } from "./useToast";

export interface Subscription {
  id: string;
  name: string;
  email: string;
}


export const useSubscription = (t: any) => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch(`https://leafy.lan/api/subscriptions`, {
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
      console.error("Error fetching subscriptions:", error);
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
      const response = await fetch('https://leafy.lan/api/subscriptions', {
        method: 'POST',
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
        description: t.plantAddedSubscription(subscriptionData.name), //TODO
      });
      loadSubscriptions();
      return true;
    } catch (error: any) {
      toast({
        title: t.errorAdding,
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
      const response = await fetch(`https://leafy.lan/api/subscriptions/${id}`, {
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
    } catch (error: any) {
      toast({
        title: t.errorUpdating,
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSubscription = async (id: string) => {
    const subscription = subscriptions.find((s) => s.id === id);
    
    try {
      const response = await fetch(`https://leafy.lan/api/subscriptions/${id}`, {
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
        description: t.plantSubscriptionDescription(subscription?.name || ""), //TODO translations
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: t.errorDeleting,
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
