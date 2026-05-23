using ScoreCircle.Data;
using ScoreCircle.Models;
using Microsoft.EntityFrameworkCore;

namespace ScoreCircle.Services
{
    public class AdviceService
    {
        private readonly AppDbContext _db;

        public AdviceService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Advice>> GetOrGenerateAsync(CreditScore score)
        {
            // Return cached advice if already generated for this score snapshot
            var existing = await _db.Advices
                .Where(a => a.CreditScoreId == score.Id)
                .ToListAsync();

            if (existing.Any()) return existing;

            var advices = GenerateAdvice(score);
            _db.Advices.AddRange(advices);
            await _db.SaveChangesAsync();
            return advices;
        }

        private List<Advice> GenerateAdvice(CreditScore score)
        {
            var result = new List<Advice>();

            // Rule 1: High utilisation
            if (score.UtilisationPercent > 50)
            {
                result.Add(new Advice
                {
                    CreditScoreId = score.Id,
                    Title = "Reduce your credit utilisation",
                    Body = $"Your utilisation is at {score.UtilisationPercent}%. Lenders prefer below 30%. " +
                           "Try paying down your highest-balance card first, or ask your provider for a limit increase " +
                           "without spending more — both lower your ratio.",
                    Priority = "High"
                });
            }
            else if (score.UtilisationPercent > 30)
            {
                result.Add(new Advice
                {
                    CreditScoreId = score.Id,
                    Title = "Nudge your utilisation below 30%",
                    Body = $"You're at {score.UtilisationPercent}%. Getting below 30% is a meaningful milestone. " +
                           "Even a R500 extra payment this month will move the needle.",
                    Priority = "Medium"
                });
            }

            // Rule 2: Missed payments
            if (score.MissedPayments >= 2)
            {
                result.Add(new Advice
                {
                    CreditScoreId = score.Id,
                    Title = "Set up payment reminders or debit orders",
                    Body = $"You have {score.MissedPayments} missed payments on record. Each one stays visible " +
                           "to bureaus for 2 years. Set up an automatic minimum payment debit order now — " +
                           "it stops the bleeding while you plan your full repayments.",
                    Priority = "High"
                });
            }
            else if (score.MissedPayments == 1)
            {
                result.Add(new Advice
                {
                    CreditScoreId = score.Id,
                    Title = "One missed payment — catch it fast",
                    Body = "You have 1 missed payment. Call the lender and ask if they'll mark it as resolved — " +
                           "some will, especially first-time misses. Then set a debit order for the minimum going forward.",
                    Priority = "Medium"
                });
            }

            // Rule 3: Score tier-specific advice
            switch (score.Tier)
            {
                case CreditTier.Poor:
                    result.Add(new Advice
                    {
                        CreditScoreId = score.Id,
                        Title = "Consider a secured credit card",
                        Body = "With a Poor rating, new credit is hard to get. A secured card — where you deposit " +
                               "money as collateral — lets you build a positive payment history. " +
                               "Use it for one small regular purchase and pay in full each month.",
                        Priority = "Medium"
                    });
                    break;

                case CreditTier.Fair:
                    result.Add(new Advice
                    {
                        CreditScoreId = score.Id,
                        Title = "You're closer to Good than you think",
                        Body = $"Your score is {score.Score}. Good starts at 670. Three to six months of " +
                               "consistent on-time payments and lower utilisation can get you there. " +
                               "Set a monthly reminder to check your progress.",
                        Priority = "Medium"
                    });
                    break;

                case CreditTier.Good:
                    result.Add(new Advice
                    {
                        CreditScoreId = score.Id,
                        Title = "Protect what you've built",
                        Body = "Good credit opens most doors — home loans, vehicle finance, better rates. " +
                               "Don't apply for new credit you don't need: each application triggers an inquiry " +
                               "that temporarily dips your score by a few points.",
                        Priority = "Low"
                    });
                    break;

                case CreditTier.Excellent:
                    result.Add(new Advice
                    {
                        CreditScoreId = score.Id,
                        Title = "Leverage your excellent rating",
                        Body = "You're in the top tier. Negotiate your interest rates — banks will often reduce them " +
                               "for customers in your bracket. Check if your home loan rate reflects your current " +
                               "score; you may have been on a higher rate when you first applied.",
                        Priority = "Low"
                    });
                    break;
            }

            // Rule 4: Short credit age
            if (score.CreditAgeMonths < 24)
            {
                result.Add(new Advice
                {
                    CreditScoreId = score.Id,
                    Title = "Keep your oldest account open",
                    Body = $"Your credit history is only {score.CreditAgeMonths} months old. " +
                           "Closing your oldest account resets this clock. Keep it open and active " +
                           "with at least one small purchase per month — even a R20 airtime top-up counts.",
                    Priority = "Low"
                });
            }

            return result;
        }
    }
}
