namespace ScoreCircle.Models
{
    public enum CreditTier { Poor, Fair, Good, Excellent }

    public class CreditScore
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int Score { get; set; }               // 300–850
        public CreditTier Tier { get; set; }
        public int UtilisationPercent { get; set; }  // 0–100
        public int MissedPayments { get; set; }
        public int AccountsOpen { get; set; }
        public int CreditAgeMonths { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public AppUser? User { get; set; }
        public ICollection<Advice> Advices { get; set; } = new List<Advice>();
    }
}
