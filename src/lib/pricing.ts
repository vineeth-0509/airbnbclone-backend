import { differenceInCalendarDays } from 'date-fns';

/** The subset of a Listing that pricing math actually needs. */
export interface Priceable {
  pricePerNight: number;
  cleaningFee: number;
  serviceFeePct: number;
}

export interface Quote {
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

// Single source of truth for money. The client mirrors this for previews,
// but the server value is the one that gets charged.
export function quote(listing: Priceable, checkIn: string | Date, checkOut: string | Date): Quote {
  const nights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  if (nights < 1) throw new Error('Checkout must be after check-in');
  const subtotal = listing.pricePerNight * nights;
  const cleaningFee = listing.cleaningFee;
  const serviceFee = Math.round(subtotal * listing.serviceFeePct);
  return { nights, subtotal, cleaningFee, serviceFee, total: subtotal + cleaningFee + serviceFee };
}
