-- Remove seeded demo pricing tiers; admins manage tiers manually.

DELETE FROM public.occasion_pricing_tiers;
