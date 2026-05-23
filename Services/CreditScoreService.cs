using ScoreCircle.Data;
using ScoreCircle.Models;
using Microsoft.EntityFrameworkCore;

namespace ScoreCircle.Services
{
    public class CreditScoreService
    {
        private readonly AppDbContext _db;

        public CreditScoreService(AppDbContext db)
        {
            _db = db;
        }

        // Returns the user's latest credit score, or creates a seeded one if none exists
        public async Task<CreditScore> GetOrSeedAsync(string userId)
        {
            var latest = await _db.CreditScores
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.RecordedAt)
                .FirstOrDefaultAsync();

            if (latest != null) return latest;

            // Seed a realistic score based on userId hash (deterministic per user)
            var seed = Math.Abs(userId.GetHashCode()) % 1000;
            var score = new CreditScore
            {
                UserId = userId,
                Score = 480 + (seed % 320),           // 480–799
                UtilisationPercent = 20 + (seed % 65), // 20–84%
                MissedPayments = seed % 4,
                AccountsOpen = 2 + (seed % 5),
                CreditAgeMonths = 12 + (seed % 84),
                RecordedAt = DateTime.UtcNow
            };
            score.Tier = CalculateTier(score.Score);

            _db.CreditScores.Add(score);
            await _db.SaveChangesAsync();
            return score;
        }

        public static CreditTier CalculateTier(int score) => score switch
        {
            < 580 => CreditTier.Poor,
            < 670 => CreditTier.Fair,
            < 740 => CreditTier.Good,
            _ => CreditTier.Excellent
        };

        public static string TierColor(CreditTier tier) => tier switch
        {
            CreditTier.Poor => "danger",
            CreditTier.Fair => "warning",
            CreditTier.Good => "success",
            CreditTier.Excellent => "info",
            _ => "secondary"
        };

        public static int TierPercent(CreditScore score) =>
            (int)((score.Score - 300.0) / (850.0 - 300.0) * 100);
    }
}
