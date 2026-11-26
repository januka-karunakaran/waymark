/**
 * Waymark Mobile — Feature 05.1: Booking & Ticketing Architecture Foundation
 * Digital Ticket Domain Contracts
 */

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded' | 'void';

export type PassengerType = 'adult' | 'child' | 'senior' | 'student';

export interface TicketPassenger {
  fullName: string;
  passengerType?: PassengerType;
  specialAssistanceRequired?: boolean;
}

/**
 * Authoritative digital ticket issued strictly after verified booking confirmation and payment capture.
 * Rule: Local identifiers or client-minted QR image artwork must NOT constitute a genuine ticket.
 * A ticket is only valid when backed by an authorized issuing authority reference.
 */
export interface Ticket {
  /** Unique ticket identifier issued by backend authority */
  id: string;
  /** Confirmed booking reference */
  bookingId: string;
  /** Verified departure reference */
  departureId: string;
  /** Passenger details for this ticket */
  passenger: TicketPassenger;
  /** Authoritative issuing agency or operator */
  issuingAuthority: string;
  /** ISO 8601 UTC timestamp of ticket issuance */
  issuedAt: string;
  /** Lifecycle status of the ticket */
  status: TicketStatus;
  /** Cryptographically verifiable reference or ticket digest from issuing authority */
  secureVerificationReference: string;
}
