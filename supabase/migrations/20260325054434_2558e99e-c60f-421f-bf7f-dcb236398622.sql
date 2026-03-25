CREATE POLICY "Anyone can update orders_attribution"
ON public.orders_attribution
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can update payment_events"
ON public.payment_events
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);