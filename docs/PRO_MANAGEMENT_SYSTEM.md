# Pro Management System

## Overview

The Pro Management System enables FLI Golf to manage professional disc golf players, tournaments, special events, and payment distribution. The system features:

- **$4M Prize Pool for 2027** - Distributed across 6 tournaments
- **Progressive Payout Structure** - Later tournaments worth more
- **Gender Equality** - Equal payouts for men's and women's divisions
- **Franchise-First Model** - Franchises receive 20% cut before pro distribution
- **Top-Heavy Distribution** - Top 3 finishers receive majority of purse
- **Expandable Design** - Easily scale to more tournaments and events

## 2027 Season Payout Structure

### Total Prize Pool: $4,000,000

The 2027 season features 6 tournaments with progressive prize pools:

| Tournament | Prize Pool | Men's Purse | Women's Purse | Dates |
|------------|-----------|-------------|---------------|-------|
| 1. Season Opener | $500,000 | $250,000 | $250,000 | Feb 1-3 |
| 2. Spring Championship | $566,667 | $283,333 | $283,333 | Apr 1-3 |
| 3. Mid-Season Classic | $633,333 | $316,667 | $316,667 | Jun 1-3 |
| 4. Summer Showdown | $700,000 | $350,000 | $350,000 | Aug 1-3 |
| 5. Fall Invitational | $766,667 | $383,333 | $383,333 | Oct 1-3 |
| 6. Championship Finals | $833,333 | $416,667 | $416,667 | Dec 1-3 |

### Payout Distribution Model

1. **Franchise Cut (20%)**: Franchises receive 20% of total purse before pro distribution
2. **Pro Cut (80%)**: Remaining 80% split equally between men's and women's divisions
3. **Placement Payouts**: Top-heavy distribution within each division

#### Example: Tournament 1 ($500,000 total)
- Franchise Cut: $100,000 (20%)
- Pro Cut: $400,000 (80%)
  - Men's Division: $200,000
  - Women's Division: $200,000

#### Placement Distribution (Per Division)
Top 20 placements with top-heavy structure:

| Place | Percentage | Amount (T1) | Amount (T6) |
|-------|-----------|-------------|-------------|
| 🥇 1st | 30.0% | $60,000 | $125,000 |
| 🥈 2nd | 20.0% | $40,000 | $83,333 |
| 🥉 3rd | 15.0% | $30,000 | $62,500 |
| 4th | 5.95% | $11,900 | $24,792 |
| 5th | 5.06% | $10,120 | $21,083 |
| 6th-20th | Decreasing | ... | ... |

**Top 3 Combined**: 65% of division purse  
**Places 4-20**: 35% of division purse (exponential decay)

### Gender Equality

Men and women receive **identical payouts** for identical placements:
- 1st place men's = 1st place women's
- Equal division purses
- Equal franchise opportunities

## Database Collections

### 1. tournaments
Manages tournament events with prize pools.

**Fields:**
- `name` - Tournament name
- `season` - Year (e.g., 2024, 2025)
- `tournamentNumber` - Optional tournament number within season (1-6 for first season)
- `startDate` - Tournament start date
- `endDate` - Tournament end date
- `location` - City/region
- `venue` - Specific venue name
- `prizePool` - Total prize money available
- `status` - scheduled | in_progress | completed | cancelled
- `description` - Tournament details
- `notes` - Internal notes

### 2. tournament_results
Tracks player placements and earnings per tournament.

**Fields:**
- `tournament` - Relation to tournaments collection
- `pro` - Relation to pros collection
- `franchise` - Relation to franchises collection (optional)
- `division` - mens | womens
- `placement` - Final placement (1st, 2nd, etc.)
- `earnings` - Total earnings (franchise + pro)
- `franchiseEarnings` - Amount to franchise (20%)
- `proEarnings` - Amount to pro (80%)
- `score` - Final score
- `rounds` - Number of rounds played
- `notes` - Additional notes

**Unique Constraint:** One result per pro per tournament

### 3. special_events
Non-tournament events requiring payment (appearances, clinics, media, etc.).

**Fields:**
- `name` - Event name
- `eventType` - appearance | clinic | media | promotional | content_creation | other
- `eventDate` - Date of event
- `location` - Event location
- `description` - Event details
- `status` - scheduled | completed | cancelled
- `notes` - Internal notes

### 4. franchise_payouts
Tracks franchise earnings from tournament results.

**Fields:**
- `franchise` - Relation to franchises collection
- `tournament` - Relation to tournaments collection
- `totalEarnings` - Total franchise earnings from tournament
- `mensEarnings` - Earnings from men's division
- `womensEarnings` - Earnings from women's division
- `numberOfPros` - Number of pros representing franchise
- `status` - pending | paid | cancelled
- `paymentDate` - Date franchise was paid
- `notes` - Payment notes

### 5. pro_payments
Payment records for all pro compensation.

**Fields:**
- `pro` - Relation to pros collection
- `paymentType` - tournament | special_event | bonus | other
- `tournament` - Optional relation to tournaments
- `specialEvent` - Optional relation to special_events
- `amount` - Payment amount
- `paymentDate` - Date payment was made
- `dueDate` - Date payment is due
- `status` - pending | processing | paid | cancelled
- `paymentMethod` - bank_transfer | check | paypal | venmo | zelle | other
- `transactionId` - Payment reference number
- `description` - Payment description
- `notes` - Internal notes

## Domain Models

### Tournament
- Represents a tournament event
- Methods: `isActive()`, `isCompleted()`, `isUpcoming()`, `getDuration()`

### TournamentResult
- Represents a player's result in a tournament
- Methods: `isWinner()`, `isPodium()`, `isTopTen()`

### SpecialEvent
- Represents a special event
- Methods: `isCompleted()`, `isUpcoming()`, `isPast()`

### ProPayment
- Represents a payment to a pro
- Methods: `isPaid()`, `isPending()`, `isOverdue()`, `getDaysUntilDue()`

## Repositories

All repositories extend `BaseRepo` and provide CRUD operations plus specialized queries:

### TournamentRepo
- `findBySeason(season)` - Get tournaments for a specific season
- `findUpcoming()` - Get scheduled future tournaments
- `findActive()` - Get in-progress tournaments
- `findCompleted(season?)` - Get completed tournaments

### TournamentResultRepo
- `findByTournament(tournamentId)` - Get all results for a tournament
- `findByPro(proId)` - Get all results for a pro
- `findTopFinishers(tournamentId, limit)` - Get top N finishers
- `getTotalEarnings(proId)` - Calculate total tournament earnings

### SpecialEventRepo
- `findUpcoming()` - Get scheduled future events
- `findByType(eventType)` - Get events by type
- `findByDateRange(start, end)` - Get events in date range
- `findCompleted()` - Get completed events

### ProPaymentRepo
- `findByPro(proId)` - Get all payments for a pro
- `findPending()` - Get all pending payments
- `findOverdue()` - Get overdue payments
- `findByStatus(status)` - Get payments by status
- `findByTournament(tournamentId)` - Get payments for a tournament
- `findBySpecialEvent(eventId)` - Get payments for an event
- `getTotalPaid(proId)` - Calculate total paid to pro
- `getTotalPending(proId)` - Calculate total pending for pro

## User Interface

### /dashboard/pros
Main dashboard showing:
- Total pros count
- Active tournaments
- Pending payments count
- Overdue payments alert
- Recent tournaments list
- All pros list

### /dashboard/pros/tournaments
Tournament management:
- Create/edit/delete tournaments
- Filter by season and status
- View tournament details
- Track prize pools
- Progressive payout structure display

### /dashboard/pros/tournaments/[id]
Tournament detail page:
- Complete payout structure breakdown
- Add results for men's and women's divisions
- Auto-calculated earnings per placement
- Franchise payout tracking
- Real-time payout totals

### /dashboard/pros/payments
Payment management:
- Create/edit payments
- Filter by status and pro
- Mark payments as paid
- Track pending and overdue payments
- Link payments to tournaments or special events

### /dashboard/pros/franchise-payouts
Franchise payout tracking:
- View all franchise earnings
- Filter by franchise
- Track pending vs paid status
- Breakdown by men's/women's divisions
- Mark payouts as paid

### /dashboard/pros/special-events
Special event management:
- Create/edit/delete events
- Filter by status and type
- Track event types: appearances, clinics, media, promotional, content creation

## Workflow Examples

### Tournament Payout Workflow
1. **Create Tournament**: Set up tournament in `/dashboard/pros/tournaments` with prize pool
2. **Configure Payouts**: System automatically calculates:
   - 20% franchise cut
   - 80% pro cut split equally between divisions
   - Placement payouts based on top-heavy structure
3. **Add Results**: Enter placements for men's and women's divisions
   - Select pro and franchise
   - System auto-calculates earnings
4. **Franchise Payouts**: Automatically created and tracked
5. **Pro Payments**: Create payment records for individual pros
6. **Mark as Paid**: Update status when payments processed

### Example: Adding Tournament Results

**Tournament**: Championship Finals ($833,333)
- Franchise Cut: $166,667
- Pro Cut: $666,666
- Men's Purse: $333,333
- Women's Purse: $333,333

**Men's Division Results:**
1. 🥇 John Doe (Franchise A) - Placement 1
   - Pro Earnings: $100,000
   - Franchise Earnings: $25,000
   - Total: $125,000

2. 🥈 Jane Smith (Franchise B) - Placement 2
   - Pro Earnings: $66,667
   - Franchise Earnings: $16,666
   - Total: $83,333

**Franchise Payouts Automatically Created:**
- Franchise A: $25,000 (from John's result)
- Franchise B: $16,666 (from Jane's result)

### Special Event Payment Workflow
1. Create special event in `/dashboard/pros/special-events`
2. Create payment record linked to the event
3. Set due date and amount
4. Track payment status
5. Mark as paid when completed

## Expandability

The system is designed to scale:
- **Tournaments:** No limit on number per season (started with 6)
- **Payment Types:** Easily add new payment types
- **Event Types:** Add new special event categories
- **Payment Methods:** Support for multiple payment methods
- **Reporting:** Repositories provide methods for financial reporting

## Migration

Collections were created using:
```bash
npx tsx src/lib/migrations/migrate-pro-payments.ts
```

The migration script is in `src/lib/migrations/create-pro-payment-collections.ts` and can be re-run to update schemas if needed.

## Key Features Implemented

✅ **Progressive Prize Pools** - $4M distributed across 6 tournaments with increasing values  
✅ **Gender Equality** - Equal payouts for men's and women's divisions  
✅ **Franchise-First Model** - 20% cut to franchises before pro distribution  
✅ **Top-Heavy Distribution** - Top 3 get 65% of division purse  
✅ **Auto-Calculated Payouts** - System calculates earnings based on placement  
✅ **Franchise Tracking** - Automatic franchise payout aggregation  
✅ **Division Support** - Separate men's and women's results  
✅ **Real-Time Totals** - Live calculation of paid vs pending amounts  

## Future Enhancements

Potential additions:
- Bulk result import from tournament software
- Payment approval workflow with multi-level authorization
- Financial reporting dashboard with charts and analytics
- Export payment data for accounting systems (QuickBooks, Xero)
- Email notifications for payment status changes
- Integration with payment processors (Stripe, PayPal)
- Multi-currency support for international events
- Tax document generation (1099 forms)
- Historical performance analytics per pro
- Franchise ROI tracking and reporting
- Season-long leaderboards and standings
- Automated bonus calculations for achievements
