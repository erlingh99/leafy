import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast, delayedToast } from "./useToast";
import { Translations } from "@/translations/types";
import { Subscription } from "@/models/subscription";


export const useSubscription = (t: Translations) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load subscriptions using useQuery
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch subscriptions');
      }

      return response.json() as Promise<Subscription[]>;
    },
  });

  // Mutation for adding a subscription
  const addSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: Partial<Subscription>) => {
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
    },
    onSuccess: (_, variables) => {
      const promise = queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: t.subscriptionAdded,
        description: t.subscriptionAddedDescription(variables.name || ""),
      });
      return promise;
    },
    onError: (error) => {
      toast({
        title: t.errorAddingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating a subscription
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, subscription }: { id: string, subscription: Partial<Subscription> }) => {
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
    },
    onSuccess: (_, variables) => {
      const promise = queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: t.subscriptionUpdated,
        description: t.subscriptionUpdatedDescription(variables.subscription.name || ""),
      });
      return promise;
    },
    onError: (error) => {
      toast({
        title: t.errorUpdatingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a subscription
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }
    },
    onSuccess: (_, id) => {
      const subscription = subscriptions.find((s) => s.id === id);
      const promise = queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: t.subscriptionDeleted,
        description: t.subscriptionDeletedDescription(subscription?.name || ""),
      });
      return promise;
    },
    onError: (error) => {
      toast({
        title: t.errorDeletingSubscription,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

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
      await addSubscriptionMutation.mutateAsync(subscriptionData);
      loadingToast.dismiss();
      return true;
    } catch {
      loadingToast.dismiss();
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
      await updateSubscriptionMutation.mutateAsync({ id, subscription });
      loadingToast.dismiss();
      return true;
    } catch {
      loadingToast.dismiss();
      return false;
    }
  };

  const deleteSubscription = async (id: string) => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.deletingSubscription || "Deleting subscription...",
    });
    deleteSubscriptionMutation.mutate(id, {
      onSettled: () => loadingToast.dismiss()
    });
  };


  return {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription
  };
};
